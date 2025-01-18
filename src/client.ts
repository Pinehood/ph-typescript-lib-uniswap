import { Token } from '@uniswap/sdk-core';
import { formatEther } from 'ethers';
import { Trading } from './trading';
import { loadTradeConfig } from './config';
import { getCurrencyBalance, getCurrencyDecimals } from './utils';
import {
  ETransactionStates,
  TPreviewData,
  TTransactionResult,
  TUniswapConfig,
} from './definitions';

export class UniswapClient {
  private readonly config: TUniswapConfig;

  constructor(config: TUniswapConfig) {
    this.config = config;
  }

  async getBalance(tokenAddress?: string) {
    const { chainId = 1, rpcUrl, privKey } = this.config;
    const conf = loadTradeConfig(chainId);
    if (!conf) {
      throw new Error(`Invalid chain ID ${chainId}`);
    }

    const trading = new Trading(
      privKey,
      rpcUrl || conf.rpc,
      conf.chainId,
      conf.poolFactoryAddress,
      conf.swapRouterAddress,
      conf.quoterAddress,
      this.config.slippage,
      this.config.deadline
    );

    const provider = trading.getProvider();
    const walletAddress = trading.getWalletAddress();
    if (!provider || !walletAddress) {
      throw new Error('No provider or wallet address');
    }

    const isSame = walletAddress.toLowerCase() === tokenAddress?.toLowerCase();
    if (!isSame && tokenAddress?.startsWith('0x')) {
      const decimals = await getCurrencyDecimals(
        provider,
        new Token(conf.chainId, tokenAddress, 18)
      );
      const token = new Token(conf.chainId, tokenAddress, decimals);
      return Number(await getCurrencyBalance(provider, walletAddress, token));
    }

    const balance = await provider.getBalance(walletAddress);
    return parseFloat(formatEther(balance));
  }

  async swapTokens(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountToSwap: number,
    previewOnly?: boolean,
    needApproval?: boolean,
    approvalMax?: boolean
  ): Promise<TTransactionResult | TPreviewData> {
    const { chainId = 1, rpcUrl, privKey } = this.config;
    const conf = loadTradeConfig(chainId);
    if (!conf) {
      throw new Error(`Invalid chain ID ${chainId}`);
    }

    const trading = new Trading(
      privKey,
      rpcUrl || conf.rpc,
      conf.chainId,
      conf.poolFactoryAddress,
      conf.swapRouterAddress,
      conf.quoterAddress,
      this.config.slippage,
      this.config.deadline
    );

    const provider = trading.getProvider();
    const walletAddress = trading.getWalletAddress();
    if (!provider || !walletAddress) {
      return { state: ETransactionStates.FAILED };
    }

    const results = await Promise.allSettled([
      getCurrencyDecimals(
        provider,
        new Token(conf.chainId, tokenInAddress, 18)
      ),
      getCurrencyDecimals(
        provider,
        new Token(conf.chainId, tokenOutAddress, 18)
      ),
    ]);

    const tokenInDecimals =
      results[0].status === 'fulfilled' ? results[0].value : 18;
    const tokenOutDecimals =
      results[1].status === 'fulfilled' ? results[1].value : 18;

    const tokenIn = new Token(conf.chainId, tokenInAddress, tokenInDecimals);
    const tokenOut = new Token(conf.chainId, tokenOutAddress, tokenOutDecimals);

    const tokenInBalance = await getCurrencyBalance(
      provider,
      walletAddress,
      tokenIn
    );

    if (parseFloat(tokenInBalance) < amountToSwap) {
      return { state: ETransactionStates.REJECTED };
    }

    if (amountToSwap <= 0) {
      amountToSwap = parseFloat(tokenInBalance);
    }

    if (needApproval && tokenIn.isToken) {
      const ret = approvalMax
        ? await trading.getTokenApprovalMax(tokenIn)
        : await trading.getTokenTransferApproval(tokenIn, amountToSwap);
      if (ret.state !== ETransactionStates.SENT) {
        return { state: ETransactionStates.FAILED };
      }
    }

    const tradeInfo = await trading.createTrade(
      tokenIn,
      tokenOut,
      amountToSwap
    );
    if (!tradeInfo) {
      return { state: ETransactionStates.FAILED };
    }

    if (previewOnly) {
      return trading.previewTrade(tradeInfo);
    }
    return trading.executeTrade(tradeInfo);
  }
}
