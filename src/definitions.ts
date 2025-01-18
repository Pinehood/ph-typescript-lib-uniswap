import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';
import { TransactionReceipt } from 'ethers';

export enum ETransactionStates {
  FAILED = 'failed',
  NEW = 'new',
  REJECTED = 'rejected',
  SENDING = 'sending',
  SENT = 'sent',
}

export interface IContractConfig {
  chainId: number;
  name: string;
  rpc: string;
  poolFactoryAddress: string;
  quoterAddress: string;
  swapRouterAddress: string;
}

export interface IPoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

export interface ITradeInfo {
  pool: IPoolInfo;
  tokenIn: Token;
  tokenOut: Token;
  amount: number;
  trade: TTokenTrade;
}

export type TTokenTrade = Trade<Token, Token, TradeType>;
export type TTransactionState = Lowercase<keyof typeof ETransactionStates>;

export type TTransactionResult = {
  state: TTransactionState;
  receipt?: TransactionReceipt;
};

export type TCryptoAsset = {
  name: string;
  symbol: string;
  address?: string;
  coinType?: number;
  isErc20?: boolean;
};

export type TPreviewData = Partial<{
  output: number;
  price: number;
  gas: number;
  eth: number;
}>;

export type TUniswapConfig = {
  chainId?: number;
  rpcUrl?: string;
  privKey: string;
  slippage?: number;
  deadline?: number;
};
