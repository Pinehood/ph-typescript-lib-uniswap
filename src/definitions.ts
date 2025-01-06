import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

export interface ExampleConfig {
  chainId: number;
  name: string;
  rpc: string;
  poolFactoryAddress: string;
  quoterAddress: string;
  swapRouterAddress: string;
}

export interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

export interface TradeInfo {
  pool: PoolInfo;
  tokenIn: Token;
  tokenOut: Token;
  amount: number;
  trade: TokenTrade;
}

export type TokenTrade = Trade<Token, Token, TradeType>;

export type CryptoAsset = {
  name: string;
  symbol: string;
  address?: string;
  coinType?: number;
  isErc20?: boolean;
};
