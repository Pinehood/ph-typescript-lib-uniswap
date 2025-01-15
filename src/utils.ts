import { Trade } from '@uniswap/v3-sdk';
import { Currency } from '@uniswap/sdk-core';
import { Token, TradeType } from '@uniswap/sdk-core';
import { Provider } from 'ethers';
import { ethers, toNumber } from 'ethers';
import { ERC20_ABI } from './constants';
import { ETransactionStates } from './definitions';

export function fromReadableAmount(amount: number, decimals: number): bigint {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.formatUnits(rawAmount, decimals);
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

export function createWallet(
  privKey: string,
  rpcUrl: string,
  apiKey: string
): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(rpcUrl + apiKey);
  return new ethers.Wallet(privKey, provider);
}

export async function getCurrencyBalance(
  provider: Provider,
  address: string,
  currency: Currency
): Promise<string> {
  if (currency.isNative) {
    return ethers.formatEther(await provider.getBalance(address));
  }
  const ERC20Contract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  );
  const balance: number = await ERC20Contract.balanceOf(address);
  const decimals: number = await ERC20Contract.decimals();
  return toReadableAmount(balance, decimals);
}

export async function getCurrencyDecimals(
  provider: Provider,
  currency: Currency
): Promise<number> {
  if (currency.isNative) {
    return 18;
  }
  const ERC20Contract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  );
  const decimals: bigint = await ERC20Contract.decimals();
  return toNumber(decimals);
}

export async function sendTransaction(
  wallet: ethers.Wallet,
  transaction: ethers.TransactionRequest,
  noWait?: boolean
): Promise<ETransactionStates> {
  const provider = wallet.provider;
  if (!provider) {
    return ETransactionStates.FAILED;
  }

  if (transaction.value) {
    transaction.value = BigInt(transaction.value);
  }

  const fee = await provider!.getFeeData();
  if ((await provider!.getNetwork()).chainId === 137n) {
    transaction.gasPrice = fee.gasPrice! * 2n;
  } else {
    transaction.maxFeePerGas = fee.maxFeePerGas! * 2n;
    transaction.maxPriorityFeePerGas = fee.maxPriorityFeePerGas! * 2n;
  }

  const txRes = await wallet.sendTransaction(transaction);
  let receipt = null;

  while (!noWait && receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash);
      if (receipt === null) {
        continue;
      }
    } catch {
      break;
    }
  }

  if (receipt || noWait) {
    return ETransactionStates.SENT;
  } else {
    return ETransactionStates.FAILED;
  }
}
