import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import {
  Pool,
  Route,
  SwapQuoter,
  SwapRouter,
  Trade,
  FeeAmount,
  ADDRESS_ZERO,
} from '@uniswap/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import { ethers, toNumber, TransactionRequest } from 'ethers';
import JSBI from 'jsbi';
import {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  POOL_FACTORY_CONTRACT_ADDRESS,
  SLIPPAGE_TOLERANCE,
  DEADLINE,
} from './constants';
import {
  fromReadableAmount,
  createWallet,
  sendTransaction,
  getEthPriceUSD,
} from './utils';
import {
  IPoolInfo,
  ITradeInfo,
  ETransactionStates,
  TPreviewData,
  TTransactionResult,
} from './definitions';

export class Trading {
  private readonly wallet: ethers.Wallet;
  private readonly chainId: number;
  private readonly poolFactoryAddress: string = POOL_FACTORY_CONTRACT_ADDRESS;
  private readonly swapRouterAddress: string = SWAP_ROUTER_ADDRESS;
  private readonly quoterAddress: string = QUOTER_CONTRACT_ADDRESS;
  private readonly slippage: number;
  private readonly deadline: number;

  constructor(
    key: string,
    provider: string,
    chainId: number,
    poolFactoryAddress?: string,
    swapRouterAddress?: string,
    quoterAddress?: string,
    slippage?: number,
    deadline?: number
  ) {
    this.wallet = createWallet(key, provider);
    this.chainId = chainId;
    this.slippage = slippage || SLIPPAGE_TOLERANCE;
    this.deadline = deadline || DEADLINE;
    if (poolFactoryAddress) {
      this.poolFactoryAddress = poolFactoryAddress;
    }
    if (swapRouterAddress) {
      this.swapRouterAddress = swapRouterAddress;
    }
    if (quoterAddress) {
      this.quoterAddress = quoterAddress;
    }
  }

  getWallet() {
    return this.wallet;
  }

  getChainId() {
    return this.chainId;
  }

  getProvider() {
    return this.wallet.provider;
  }

  getWalletAddress() {
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

    if (currentPoolAddress == ADDRESS_ZERO)
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.LOW
      );
    if (currentPoolAddress == ADDRESS_ZERO)
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.MEDIUM
      );
    if (currentPoolAddress == ADDRESS_ZERO)
      currentPoolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        FeeAmount.HIGH
      );

    if (currentPoolAddress == ADDRESS_ZERO) {
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

  async getTokenApprovalMax(token: Token): Promise<TTransactionResult> {
    const provider = this.getProvider();
    const address = this.getWalletAddress();
    if (!provider || !address) {
      return { state: ETransactionStates.FAILED };
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
      return { state: ETransactionStates.FAILED };
    }
  }

  async getTokenTransferApproval(
    token: Token,
    requiredAmount: number
  ): Promise<TTransactionResult> {
    const provider = this.getProvider();
    const address = this.getWalletAddress();
    if (!provider || !address) {
      return { state: ETransactionStates.FAILED };
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
        return { state: ETransactionStates.SENT };
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
      return { state: ETransactionStates.FAILED };
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

  executeTrade(tradeInfo: ITradeInfo): Promise<TTransactionResult> {
    const walletAddress = this.getWalletAddress();
    const provider = this.getProvider();

    if (!walletAddress || !provider) {
      throw new Error('Cannot execute a trade without a connected wallet');
    }

    return sendTransaction(
      this.wallet,
      this.getTransactionRequest(tradeInfo, walletAddress),
      true
    );
  }

  async previewTrade(tradeInfo: ITradeInfo): Promise<TPreviewData> {
    const provider = this.getProvider();
    const walletAddress = this.getWalletAddress();

    if (!walletAddress || !provider) {
      throw new Error('Cannot preview a trade without a connected wallet');
    }

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

    const output = Number(trade.outputAmount.toSignificant(6));
    const price = Number(trade.priceImpact.toSignificant(6));

    const results = await Promise.allSettled([
      provider.estimateGas(
        this.getTransactionRequest(tradeInfo, walletAddress)
      ),
      getEthPriceUSD(),
    ]);

    return {
      output,
      price,
      gas:
        results[0].status === 'fulfilled'
          ? toNumber(BigInt(results[0].value))
          : -1,
      eth: results[1].status === 'fulfilled' ? results[1].value : -1,
    };
  }

  private getTransactionRequest(
    tradeInfo: ITradeInfo,
    walletAddress: string
  ): TransactionRequest {
    const { trade } = tradeInfo;
    const methodParameters = SwapRouter.swapCallParameters([trade], {
      slippageTolerance: new Percent(this.slippage, 10_000),
      deadline: Math.floor(Date.now() / 1000) + 60 * this.deadline,
      recipient: walletAddress,
    });
    return {
      data: methodParameters.calldata,
      to: this.swapRouterAddress,
      value: methodParameters.value,
      from: walletAddress,
    };
  }
}
