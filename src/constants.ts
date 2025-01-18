import * as bitcoin from 'bitcoinjs-lib';
import { TCryptoAsset } from './definitions';

export const RPC_URL = 'https://eth.llamarpc.com';
export const ETH_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export const POOL_FACTORY_CONTRACT_ADDRESS =
  '0x1F98431c8aD98523631AE4a59f267346ea31F984';
export const QUOTER_CONTRACT_ADDRESS =
  '0x61fFE014bA17989E743c5F6cB21bF9697530B21e';
export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

export const MAX_FEE_PER_GAS = 220 * 1000000000;
export const MAX_PRIORITY_FEE_PER_GAS = MAX_FEE_PER_GAS;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;
export const SLIPPAGE_TOLERANCE = 5;
export const DEADLINE = 15;

export const BITCOIN_NETWORKS: Record<string, bitcoin.Network> = {
  BTC: bitcoin.networks.bitcoin,
  DOGE: {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'doge',
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  },
  DASH: {
    messagePrefix: '\x19Dash Signed Message:\n',
    bech32: 'dash',
    bip32: { public: 0x02fe52f8, private: 0x02fe52cc },
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc,
  },
  ZEC: bitcoin.networks.bitcoin,
  BTG: bitcoin.networks.bitcoin,
  DGB: bitcoin.networks.bitcoin,
  QTUM: bitcoin.networks.bitcoin,
  RVN: bitcoin.networks.bitcoin,
};

export const SUPPORTED_CRYPTO_ASSETS: Array<TCryptoAsset> = [
  // BIP44 Coins (Non-ERC20)
  { name: 'Ethereum', symbol: 'ETH', coinType: 60, isErc20: false },
  { name: 'Stellar Lumens', symbol: 'XLM', coinType: 148, isErc20: false },
  { name: 'Ripple', symbol: 'XRP', coinType: 144, isErc20: false },
  { name: 'Bitcoin', symbol: 'BTC', coinType: 0, isErc20: false },
  { name: 'Litecoin', symbol: 'LTC', coinType: 2, isErc20: false },
  { name: 'Dogecoin', symbol: 'DOGE', coinType: 3, isErc20: false },
  { name: 'Dash', symbol: 'DASH', coinType: 5, isErc20: false },
  { name: 'Ethereum Classic', symbol: 'ETC', coinType: 61, isErc20: false },
  { name: 'Zcash', symbol: 'ZEC', coinType: 133, isErc20: false },
  { name: 'Bitcoin Cash', symbol: 'BCH', coinType: 145, isErc20: false },
  { name: 'Bitcoin Gold', symbol: 'BTG', coinType: 156, isErc20: false },
  { name: 'DigiByte', symbol: 'DGB', coinType: 20, isErc20: false },
  { name: 'Komodo', symbol: 'KMD', coinType: 141, isErc20: false },
  { name: 'Monacoin', symbol: 'MONA', coinType: 22, isErc20: false },
  { name: 'Qtum', symbol: 'QTUM', coinType: 2301, isErc20: false },
  { name: 'Decred', symbol: 'DCR', coinType: 42, isErc20: false },
  { name: 'Ravencoin', symbol: 'RVN', coinType: 175, isErc20: false },
  { name: 'Horizen', symbol: 'ZEN', coinType: 121, isErc20: false },
  {
    name: 'Hedera',
    symbol: 'HBAR',
    coinType: 3030,
    isErc20: false,
  },
  {
    name: 'Stellar Lumens',
    symbol: 'XLM',
    coinType: 148,
    isErc20: false,
  },
  {
    name: 'Algorand',
    symbol: 'ALGO',
    coinType: 283,
    isErc20: false,
  },
  {
    name: 'Cosmos',
    symbol: 'ATOM',
    coinType: 118,
    isErc20: false,
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    coinType: 501,
    isErc20: false,
  },
  {
    name: 'Cardano',
    symbol: 'ADA',
    coinType: 1815,
    isErc20: false,
  },

  // ERC-20 Tokens
  {
    name: 'Chainlink',
    symbol: 'LINK',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    isErc20: true,
  },
  {
    name: 'Uniswap',
    symbol: 'UNI',
    address: '0x1F9840a85d5aF5bf1D1762F925BDADdC4201F984',
    isErc20: true,
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    isErc20: true,
  },
  {
    name: 'Tether',
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    isErc20: true,
  },
  {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    isErc20: true,
  },
  {
    name: 'Wrapped HBAR',
    symbol: 'WHBAR',
    address: '0x5d68e6B7f71944D6fA651e8fE66E2b09c729BAdD',
    isErc20: true,
  },
  {
    name: 'Wrapped XLM',
    symbol: 'WXLM',
    address: '0x39bb259f66e1c59d5abef88375979b4d20d98022',
    isErc20: true,
  },
  {
    name: 'Wrapped ALGO',
    symbol: 'WALGO',
    address: '0x5992ad1c5b0c8186a291c2ffeb18db885c9f4c96',
    isErc20: true,
  },
  {
    name: 'Wrapped ATOM',
    symbol: 'WATOM',
    address: '0x0eb3a705fc54725037cc9e008bdede697f62f335',
    isErc20: true,
  },
  {
    name: 'Wrapped Solana',
    symbol: 'WSOL',
    address: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    isErc20: true,
  },
  {
    name: 'Wrapped Cardano',
    symbol: 'WADA',
    address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
    isErc20: true,
  },
  {
    name: 'Basic Attention Token',
    symbol: 'BAT',
    address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
    isErc20: true,
  },
  {
    name: '0x Protocol',
    symbol: 'ZRX',
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    isErc20: true,
  },
  {
    name: 'Synthetix',
    symbol: 'SNX',
    address: '0xC011A72400E58ecD99Ee497CF89E3775d4bd732F',
    isErc20: true,
  },
  {
    name: 'Aave',
    symbol: 'AAVE',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33e2dDAe9',
    isErc20: true,
  },
  {
    name: 'Maker',
    symbol: 'MKR',
    address: '0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2',
    isErc20: true,
  },
  {
    name: 'Compound',
    symbol: 'COMP',
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    isErc20: true,
  },
  {
    name: 'Yearn Finance',
    symbol: 'YFI',
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    isErc20: true,
  },
  {
    name: 'SushiSwap',
    symbol: 'SUSHI',
    address: '0x6B3595068778DD592e39A122f4f5a5CF09C90fE2',
    isErc20: true,
  },
  {
    name: '1inch',
    symbol: '1INCH',
    address: '0x111111111117dC0aa78b770fA6A738034120C302',
    isErc20: true,
  },
  {
    name: 'Balancer',
    symbol: 'BAL',
    address: '0xba100000625a3754423978a60c9317c58a424e3D',
    isErc20: true,
  },
  {
    name: 'Ren',
    symbol: 'REN',
    address: '0x408e41876cCCDC0F92210600ef50372656052a38',
    isErc20: true,
  },
  {
    name: 'Kyber Network',
    symbol: 'KNC',
    address: '0xdd974D5C2e2928dea5F71b9825b8b646686bd200',
    isErc20: true,
  },
  {
    name: 'Band Protocol',
    symbol: 'BAND',
    address: '0xba11D3e6b3464C6eB7eC6bF7d7eB8d9Ff8A8B8e1',
    isErc20: true,
  },
  {
    name: 'Ocean Protocol',
    symbol: 'OCEAN',
    address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
    isErc20: true,
  },
  {
    name: 'Orchid',
    symbol: 'OXT',
    address: '0x4575f41308ec1483f3d399aa9a2826d74da13deb',
    isErc20: true,
  },
  {
    name: 'Aragon',
    symbol: 'ANT',
    address: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e',
    isErc20: true,
  },
  {
    name: 'Civic',
    symbol: 'CVC',
    address: '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
    isErc20: true,
  },
  {
    name: 'Storj',
    symbol: 'STORJ',
    address: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC',
    isErc20: true,
  },
  {
    name: 'Status',
    symbol: 'SNT',
    address: '0x744d70fdbe2ba4cf95131626614a1763df805b9e',
    isErc20: true,
  },
  {
    name: 'Augur',
    symbol: 'REP',
    address: '0x1985365e9f78359a9b6ad760e32412f4a445e862',
    isErc20: true,
  },
  {
    name: 'Golem',
    symbol: 'GLM',
    address: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429',
    isErc20: true,
  },
  {
    name: 'Loopring',
    symbol: 'LRC',
    address: '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEaF9',
    isErc20: true,
  },
  {
    name: 'Enjin Coin',
    symbol: 'ENJ',
    address: '0xF629cBd94d3791C9250152BD8dFbDF380E2a3B9c',
    isErc20: true,
  },
  {
    name: 'Decentraland',
    symbol: 'MANA',
    address: '0x0f5D2fB29fb7d3CFeE444a200298f468908cC942',
    isErc20: true,
  },
  {
    name: 'Shiba Inu',
    symbol: 'SHIB',
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    isErc20: true,
  },
  {
    name: 'Frax',
    symbol: 'FRAX',
    address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    isErc20: true,
  },
  {
    name: 'Pepe',
    symbol: 'PEPE',
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    isErc20: true,
  },

  // Binance Smart Chain (BEP-20) Tokens
  {
    name: 'PancakeSwap',
    symbol: 'CAKE',
    address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    isErc20: true,
  },
  {
    name: 'SafeMoon',
    symbol: 'SAFEMOON',
    address: '0x8076c74c5e3f5852037f31f21dd36b16e82018',
    isErc20: true,
  },
  {
    name: 'Floki Inu',
    symbol: 'FLOKI',
    address: '0x43f11c02439e2736800433b4594994bd43cd066d',
    isErc20: true,
  },
  {
    name: 'Baby Doge',
    symbol: 'BABYDOGE',
    address: '0xc748673057861a797275cd8a068abb95a902e8de',
    isErc20: true,
  },
  {
    name: 'DogeBonk',
    symbol: 'DOBO',
    address: '0x9b20dabcec77f6289113e61893f7beefaeb1990a',
    isErc20: true,
  },

  // Solana SPL Tokens
  {
    name: 'Bonk',
    symbol: 'BONK',
    address: 'bonkXrZ9zKo8mE5Y9EmN6sxziD4AaSAnveLG5m8ADx8',
    isErc20: true,
  },
  {
    name: 'Raydium',
    symbol: 'RAY',
    address: '4k3Dyjzvzp8eLhU2YVhByJKQhF9NbA6q3u5T7wM8iXEj',
    isErc20: true,
  },
  {
    name: 'Serum',
    symbol: 'SRM',
    address: 'SRMuAjoTURKVmX3mDB5pAtm6P3ZwpjEVQ2hMXu9SZsw',
    isErc20: true,
  },
  {
    name: 'Mango',
    symbol: 'MNGO',
    address: 'MangoC5gQ6dH71ShyrueIgy6r3vCm9bKZbXXxNg',
    isErc20: true,
  },
  {
    name: 'Tulip',
    symbol: 'TULIP',
    address: 'TuLpK8fF8xA8oRr6uyX97BZunC5qZjDchJ4wHZxy39M',
    isErc20: true,
  },

  // Avalanche C-Chain (AVAX) Tokens
  {
    name: 'Avalanche',
    symbol: 'AVAX',
    address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    isErc20: true,
  },
  {
    name: 'Trader Joe',
    symbol: 'JOE',
    address: '0x6e84A6216eA6dACC71eD821dEB5bC3D2cC76139c',
    isErc20: true,
  },
  {
    name: 'BENQI',
    symbol: 'QI',
    address: '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
    isErc20: true,
  },
  {
    name: 'Pangolin',
    symbol: 'PNG',
    address: '0x60781c2586d68229fde47564546784ab3faca982',
    isErc20: true,
  },
  {
    name: 'Yield Yak',
    symbol: 'YAK',
    address: '0x9D9442C74D8593D02E2180A35C4B286C50E7B600',
    isErc20: true,
  },
];
