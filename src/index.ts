import { Token } from '@uniswap/sdk-core';
import { Trading } from './trading';
import { loadTradeConfig } from './config';
import { TransactionState } from './definitions';
import { getCurrencyBalance, getCurrencyDecimals } from './utils';

export async function runSwapOnce(
  chainId: number,
  rpcUrl: string,
  privKey: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountToSwap: number,
  needApproval?: boolean,
  approvalMax?: boolean
): Promise<TransactionState> {
  const conf = loadTradeConfig(chainId);
  if (!conf) {
    throw new Error(`invalid chain id ${chainId}`);
  }

  const T = new Trading(
    privKey,
    rpcUrl || conf.rpc,
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
    return TransactionState.Rejected;
  }

  if (amountToSwap <= 0) {
    amountToSwap = parseFloat(tokenInBalance);
  }

  if (needApproval && tokenIn.isToken) {
    let ret: TransactionState;
    if (approvalMax) {
      ret = await T.getTokenApprovalMax(tokenIn);
    } else {
      ret = await T.getTokenTransferApproval(tokenIn, amountToSwap);
    }
    if (ret !== TransactionState.Sent) {
      return TransactionState.Failed;
    }
  }

  const tradeInfo = await T.createTrade(tokenIn, tokenOut, amountToSwap);
  return T.executeTrade(tradeInfo);
}
