import hdkey from 'hdkey';
import ECPairFactory from 'ecpair';
import Wallet from 'ethereumjs-wallet';
import * as bip39 from 'bip39';
import * as wif from 'wif';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Keypair } from '@solana/web3.js';
import { BITCOIN_NETWORKS, SUPPORTED_CRYPTO_ASSETS } from './constants';

const ECPair = ECPairFactory(ecc);

export async function generatePrivateKeyAndContractAddress(
  mnemonic: string,
  coin: string
) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const isERC20 = SUPPORTED_CRYPTO_ASSETS.some(
    (a) => a.isErc20 === true && a.symbol === coin
  );
  const coinType = isERC20
    ? 60
    : (SUPPORTED_CRYPTO_ASSETS.find(
        (a) => a.isErc20 !== true && a.symbol === coin
      )?.coinType ?? -1);
  const contract = SUPPORTED_CRYPTO_ASSETS.find(
    (a) => a.symbol === coin
  )?.address;

  if (coin === 'SOL') {
    const solanaSeed = seed.slice(0, 32);
    const keypair = Keypair.fromSeed(solanaSeed);
    return {
      key: Buffer.from(keypair.secretKey).toString('hex'),
      address: keypair.publicKey.toBase58(),
      contract,
    };
  }

  const hdPath = `m/44'/${coinType}'/0'/0/0`;
  const root = hdkey.fromMasterSeed(seed);
  const wallet = root.derive(hdPath);

  if (!wallet?.privateKey) {
    throw new Error(`Private key generation failed for ${coin}`);
  }

  const privateKey = wallet.privateKey;
  let publicAddress = '0x0000000000000000000000000000000000000000';
  if (isERC20 || coinType === 60) {
    const ethWalletInstance = Wallet.fromPrivateKey(privateKey);
    publicAddress = ethWalletInstance.getAddressString();
    return {
      key: ethWalletInstance.getPrivateKeyString(),
      address: publicAddress,
      contract,
    };
  }

  const network = BITCOIN_NETWORKS[coin as keyof typeof BITCOIN_NETWORKS];
  if (network) {
    const keyPair = ECPair.fromPrivateKey(privateKey, { network });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network,
    });
    const wifPrivateKey = wif.encode({
      version: network.wif,
      privateKey: keyPair.privateKey!,
      compressed: true,
    });
    return {
      key: wifPrivateKey,
      address,
      contract,
    };
  }

  return {
    key: privateKey.toString('hex'),
    address: publicAddress,
    contract,
  };
}
