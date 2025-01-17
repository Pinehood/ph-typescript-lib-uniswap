## Introduction

Uniswap wrapper - original source code taken from [here](https://github.com/Web3Camp-Labs/uniswap-trade-cli/tree/main). Adapted for the NPM package publishing and downstream usages purposes.

## Installations

- [Node.js](https://nodejs.org/en/download/) (version >= 18.10.0)
- [Visual Studio Code](https://code.visualstudio.com/download) (and "Prettier - Code formatter" extension)

## Setup

1. Prerequisites:

- must have installed tools from the "Installations" section
- must have checked out / cloned source code from this repository

2. Open up the cloned repository/project/folder and run following commands in the given order, one by one:

   ```
   npm install
   npm run build
   ```

3. Both of the above commands should have completed successfully, and should have not caused any "package.json" or "package-lock.json" changes.

## Example balance fetch

```typescript
import { generatePrivateKeyAndContractAddress, UniswapClient } from '.';

(async function () {
  const { key, address, contract } = await generatePrivateKeyAndContractAddress(
    'mnemonic',
    'USDC'
  );
  const client = new UniswapClient({
    privKey: key,
  });
  try {
    console.log(await client.getBalance(contract ?? address));
  } catch (e) {
    console.error(e);
  }
})();
```
