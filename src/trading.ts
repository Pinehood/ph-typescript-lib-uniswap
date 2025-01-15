import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
  FeeAmount,
} from '@uniswap/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import { ethers, toNumber } from 'ethers';
import { Provider } from 'ethers';
import JSBI from 'jsbi';
import {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  POOL_FACTORY_CONTRACT_ADDRESS,
} from './constants';
import { fromReadableAmount, createWallet, sendTransaction } from './utils';
import {
  IPoolInfo,
  ITradeInfo,
  ETransactionStates,
  TPreviewData,
} from './definitions';

export class Trading {
  private readonly wallet: ethers.Wallet;
  private readonly chainId: number;
  private readonly poolFactoryAddress: string = POOL_FACTORY_CONTRACT_ADDRESS;
  private readonly swapRouterAddress: string = SWAP_ROUTER_ADDRESS;
  private readonly quoterAddress: string = QUOTER_CONTRACT_ADDRESS;

  constructor(
    key: string,
    provider: string,
    chainId: number,
    infuraApiKey: string,
    poolFactoryAddress?: string,
    swapRounerAddress?: string,
    quoterAddress?: string
  ) {
    if (typeof key === 'string' && !key.startsWith('0x')) {
      key = '0x' + key;
    }
    this.wallet = createWallet(key, provider, infuraApiKey);
    this.chainId = chainId;
    if (poolFactoryAddress) {
      this.poolFactoryAddress = poolFactoryAddress;
    }
    if (swapRounerAddress) {
      this.swapRouterAddress = swapRounerAddress;
    }
    if (quoterAddress) {
      this.quoterAddress = quoterAddress;
    }
  }

  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  getChainId(): number {
    return this.chainId;
  }

  getProvider(): Provider | null {
    return this.wallet.provider;
  }

  getWalletAddress(): string | null {
    return this.wallet.address;
  }

  async getPoolInfo(tokenIn: Token, tokenOut: Token): Promise<IPoolInfo> {
    const provider = this.wallet.provider;
    if (!provider) {
      throw new Error('No provider');
    }

    const factoryContract = new ethers.Contract(
      this.poolFactoryAddress,
      IUniswapV3FactoryABI.abi,
      provider
    );

    let currentPoolAddress: string = await factoryContract.getPool(
      tokenIn.address,
      tokenOut.address,
      FeeAmount.LOWEST
    );

    if (currentPoolAddress == '0x0000000000000000000000000000000000000000')
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.LOW
      );
    if (currentPoolAddress == '0x0000000000000000000000000000000000000000')
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.MEDIUM
      );
    if (currentPoolAddress == '0x0000000000000000000000000000000000000000')
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.HIGH
      );

    if (currentPoolAddress == '0x0000000000000000000000000000000000000000') {
      throw new Error('Pool not founded!');
    }

    const poolContract = new ethers.Contract(
      currentPoolAddress,
      IUniswapV3PoolABI.abi,
      provider
    );

    const [token0, token1, fee, tickSpacing, liquidity, slot0] =
      await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

    return {
      token0,
      token1,
      fee: toNumber(fee),
      tickSpacing,
      liquidity,
      sqrtPriceX96: slot0[0],
      tick: toNumber(slot0[1]),
    };
  }

  async getTokenApprovalMax(token: Token): Promise<ETransactionStates> {
    const provider = this.getProvider();
    const address = this.getWalletAddress();
    if (!provider || !address) {
      return ETransactionStates.FAILED;
    }
    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        this.wallet
      );
      const transaction = await tokenContract.approve.populateTransaction(
        this.swapRouterAddress,
        ethers.MaxUint256
      );
      return sendTransaction(this.wallet, {
        ...transaction,
        from: address,
      });
    } catch {
      return ETransactionStates.FAILED;
    }
  }

  async getTokenTransferApproval(
    token: Token,
    requiredAmount: number
  ): Promise<ETransactionStates> {
    const provider = this.getProvider();
    const address = this.getWalletAddress();
    if (!provider || !address) {
      return ETransactionStates.FAILED;
    }
    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        this.wallet
      );
      const requiredAllowance = fromReadableAmount(
        requiredAmount,
        token.decimals
      );
      const allowance = await tokenContract.allowance(
        address,
        this.swapRouterAddress
      );

      if (allowance > requiredAllowance) {
        return ETransactionStates.SENT;
      }

      const transaction = await tokenContract.approve.populateTransaction(
        this.swapRouterAddress,
        requiredAllowance
      );

      return sendTransaction(this.wallet, {
        ...transaction,
        from: address,
      });
    } catch {
      return ETransactionStates.FAILED;
    }
  }

  async createTrade(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: number
  ): Promise<ITradeInfo> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('Provider required to get pool state');
    }

    const poolInfo = await this.getPoolInfo(tokenIn, tokenOut);
    const pool = new Pool(
      tokenIn,
      tokenOut,
      poolInfo.fee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick
    );

    const swapRoute = new Route([pool], tokenIn, tokenOut);
    const { calldata } = SwapQuoter.quoteCallParameters(
      swapRoute,
      CurrencyAmount.fromRawAmount(
        tokenIn,
        fromReadableAmount(amountIn, tokenIn.decimals).toString()
      ),
      TradeType.EXACT_INPUT,
      {
        useQuoterV2: true,
      }
    );

    const quoteCallReturnData = await provider.call({
      to: this.quoterAddress,
      data: calldata,
    });

    const amountOut = ethers.AbiCoder.defaultAbiCoder().decode(
      ['uint256'],
      quoteCallReturnData
    );

    const uncheckedTrade = Trade.createUncheckedTrade({
      route: swapRoute,
      inputAmount: CurrencyAmount.fromRawAmount(
        tokenIn,
        fromReadableAmount(amountIn, tokenIn.decimals).toString()
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        tokenOut,
        JSBI.BigInt(amountOut)
      ),
      tradeType: TradeType.EXACT_INPUT,
    });

    return {
      pool: poolInfo,
      trade: uncheckedTrade,
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amount: amountIn,
    };
  }

  executeTrade(tradeInfo: ITradeInfo): Promise<ETransactionStates> {
    const walletAddress = this.getWalletAddress();
    const provider = this.getProvider();

    if (!walletAddress || !provider) {
      throw new Error('Cannot execute a trade without a connected wallet');
    }

    const methodParameters = SwapRouter.swapCallParameters([tradeInfo.trade], {
      slippageTolerance: new Percent(5, 10_000),
      deadline: Math.floor(Date.now() / 1000) + 60 * 15,
      recipient: walletAddress,
    });

    return sendTransaction(
      this.wallet,
      {
        data: methodParameters.calldata,
        to: this.swapRouterAddress,
        value: methodParameters.value,
        from: walletAddress,
      },
      true
    );
  }

  async previewTrade(tradeInfo: ITradeInfo): Promise<TPreviewData> {
    const { tokenIn, tokenOut, amount } = tradeInfo;

    const poolInfo = await this.getPoolInfo(tokenIn, tokenOut);
    const pool = new Pool(
      tokenIn,
      tokenOut,
      poolInfo.fee,
      poolInfo.sqrtPriceX96.toString(),
      poolInfo.liquidity.toString(),
      poolInfo.tick
    );

    const amountInCurrency = CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.parseUnits('' + amount, 18).toString()
    );

    const amountOutCurrency = CurrencyAmount.fromRawAmount(
      tokenOut,
      ethers.parseUnits('0', 18).toString()
    );

    const route = new Route([pool], tokenIn, tokenOut);
    const trade = Trade.createUncheckedTrade({
      route,
      inputAmount: amountInCurrency,
      outputAmount: amountOutCurrency,
      tradeType: TradeType.EXACT_INPUT,
    });

    const output = trade.outputAmount.toSignificant(6);
    const price = trade.priceImpact.toSignificant(6);

    return {
      output,
      price,
    };
  }
}
