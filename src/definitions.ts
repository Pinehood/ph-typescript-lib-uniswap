import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';

export enum ETransactionStates {
  FAILED = 'Failed',
  NEW = 'New',
  REJECTED = 'Rejected',
  SENDING = 'Sending',
  SENT = 'Sent',
}

export interface IExampleConfig {
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

export type TCryptoAsset = {
  name: string;
  symbol: string;
  address?: string;
  coinType?: number;
  isErc20?: boolean;
};

export type TPreviewData = Partial<{
  output: string;
  price: string;
  gas: string;
}>;

export type TUniswapConfig = {
  chainId: number;
  rpcUrl: string;
  privKey: string;
};
