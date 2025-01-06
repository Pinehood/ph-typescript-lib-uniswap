import bip39 from 'bip39';
import hdkey from 'hdkey';
import ethWallet from 'ethereumjs-wallet';
import { Keypair } from '@solana/web3.js';
import { CryptoAsset } from './definitions';

export function generatePrivateKey(
  mnemonic: string,
  coin: string,
  assets: Array<CryptoAsset>
) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const isERC20 =
    assets.filter((a) => a.isErc20).findIndex((a) => a.symbol === coin) > -1;
  const coinType = isERC20
    ? 60
    : (assets.filter((a) => a.isErc20 !== true).find((a) => a.symbol === coin)
        ?.coinType ?? -1);
  if (coin === 'SOL') {
    const solanaSeed = seed.slice(0, 32);
    const keypair = Keypair.fromSeed(solanaSeed);
    return {
      key: keypair.secretKey.toString(),
      address: keypair.publicKey.toBase58(),
    };
  } else {
    const hdPath = `m/44'/${coinType}'/0'/0/0`;
    const root = hdkey.fromMasterSeed(seed);
    const wallet = root.derive(hdPath);
    const privateKey = '0x' + wallet?.privateKey?.toString('hex');
    let publicAddress = 'N/A';
    if (isERC20 || coinType === 60) {
      const ethWalletInstance = ethWallet.fromPrivateKey(
        wallet?.privateKey ?? Buffer.from('')
      );
      publicAddress = ethWalletInstance.getAddressString();
    }
    return { key: privateKey, address: publicAddress };
  }
}
