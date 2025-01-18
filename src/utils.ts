import * as wif from 'wif';
import { ethers, toNumber, Provider, TransactionReceipt } from 'ethers';
import { Trade } from '@uniswap/v3-sdk';
import { Currency } from '@uniswap/sdk-core';
import { Token, TradeType } from '@uniswap/sdk-core';
import { ERC20_ABI, ETH_PRICE_URL } from './constants';
import { ETransactionStates, TTransactionResult } from './definitions';

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

export function createWallet(privKey: string, rpcUrl: string): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  if (ethers.isHexString(privKey) && privKey.length === 66) {
    return new ethers.Wallet(privKey, provider);
  }
  const decoded = wif.decode(privKey);
  const privateKey = ethers.hexlify(decoded.privateKey);
  return new ethers.Wallet(privateKey, provider);
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
): Promise<TTransactionResult> {
  const provider = wallet.provider;
  if (!provider) {
    return { state: ETransactionStates.FAILED };
  }

  if (transaction.value) {
    transaction.value = BigInt(transaction.value);
  }

  const fee = await provider.getFeeData();
  if (fee.maxFeePerGas) {
    transaction.maxFeePerGas = fee.maxFeePerGas * 2n;
  }
  if (fee.maxPriorityFeePerGas) {
    transaction.maxPriorityFeePerGas = fee.maxPriorityFeePerGas * 2n;
  }

  const txRes = await wallet.sendTransaction(transaction);
  let receipt: TransactionReceipt | null = null;

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

  if (receipt && noWait) {
    return { state: ETransactionStates.SENT, receipt };
  } else {
    return { state: ETransactionStates.FAILED };
  }
}

export async function getEthPriceUSD(): Promise<number> {
  const res = await fetch(ETH_PRICE_URL);
  const data: any = await res.json();
  if (data && data.ethereum) {
    return Number(data.ethereum.usd);
  }
  return -1;
}
