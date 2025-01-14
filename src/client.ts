import { Token } from '@uniswap/sdk-core';
import { Trading } from './trading';
import { loadTradeConfig } from './config';
import { ETransactionStates, TUniswapConfig } from './definitions';
import { getCurrencyBalance, getCurrencyDecimals } from './utils';

export class UniswapClient {
  private readonly config: TUniswapConfig;

  constructor(config: TUniswapConfig) {
    this.config = config;
  }

  async getBalance(tokenAddress: string) {
    const { chainId = 1, privKey } = this.config;
    const conf = loadTradeConfig(chainId);
    if (!conf) {
      throw new Error(`invalid chain id ${chainId}`);
    }

    const T = new Trading(
      privKey,
      conf.rpc,
      conf.chainId,
      conf.poolFactoryAddress,
      conf.swapRouterAddress,
      conf.quoterAddress
    );

    return getCurrencyBalance(
      T.getProvider()!,
      T.getWalletAddress()!,
      new Token(
        conf.chainId,
        tokenAddress,
        await getCurrencyDecimals(
          T.getProvider()!,
          new Token(conf.chainId, tokenAddress, 18)
        )
      )
    );
  }

  async swapTokens(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountToSwap: number,
    previewOnly?: boolean,
    needApproval?: boolean,
    approvalMax?: boolean
  ) {
    const { chainId = 1, privKey } = this.config;
    const conf = loadTradeConfig(chainId);
    if (!conf) {
      throw new Error(`invalid chain id ${chainId}`);
    }

    const T = new Trading(
      privKey,
      conf.rpc,
      conf.chainId,
      conf.poolFactoryAddress,
      conf.swapRouterAddress,
      conf.quoterAddress
    );

    const tokenInDecimals = await getCurrencyDecimals(
      T.getProvider()!,
      new Token(conf.chainId, tokenInAddress, 18)
    );

    const tokenOutDecimals = await getCurrencyDecimals(
      T.getProvider()!,
      new Token(conf.chainId, tokenOutAddress, 18)
    );

    const tokenIn = new Token(conf.chainId, tokenInAddress, tokenInDecimals);
    const tokenOut = new Token(conf.chainId, tokenOutAddress, tokenOutDecimals);

    const tokenInBalance = await getCurrencyBalance(
      T.getProvider()!,
      T.getWalletAddress()!,
      tokenIn
    );

    if (parseFloat(tokenInBalance) < amountToSwap) {
      return ETransactionStates.REJECTED;
    }

    if (amountToSwap <= 0) {
      amountToSwap = parseFloat(tokenInBalance);
    }

    if (needApproval && tokenIn.isToken) {
      let ret: ETransactionStates;
      if (approvalMax) {
        ret = await T.getTokenApprovalMax(tokenIn);
      } else {
        ret = await T.getTokenTransferApproval(tokenIn, amountToSwap);
      }
      if (ret !== ETransactionStates.SENT) {
        return ETransactionStates.FAILED;
      }
    }

    const tradeInfo = await T.createTrade(tokenIn, tokenOut, amountToSwap);
    if (previewOnly) {
      return T.previewTrade(tradeInfo);
    }
    return T.executeTrade(tradeInfo);
  }
}
