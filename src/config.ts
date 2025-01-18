import { ChainId } from '@uniswap/sdk-core';
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  RPC_URL,
  SWAP_ROUTER_ADDRESS,
} from './constants';
import { IContractConfig } from './definitions';

const CONTRACT_CONFIG: Array<IContractConfig> = [
  {
    name: 'ETH',
    chainId: ChainId.MAINNET,
    rpc: RPC_URL,
    poolFactoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    quoterAddress: QUOTER_CONTRACT_ADDRESS,
    swapRouterAddress: SWAP_ROUTER_ADDRESS,
  },
];

export function loadTradeConfig(chainId: number): IContractConfig | null {
  for (let index = 0; index < CONTRACT_CONFIG.length; index++) {
    const element = CONTRACT_CONFIG[index];
    if (element.chainId == chainId) {
      return element;
    }
  }
  return null;
}

export function addTradeConfig(config: IContractConfig) {
  CONTRACT_CONFIG.push(config);
}
