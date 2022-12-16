# Hybrid ERC721 Configurator

This project demonstrates a basic ERC721 use case. It comes with a sample contract, tests for that contract, a script that deploys that contract, and code sample to interact with the contract using js and ethers library.

Smart contract features: 
- Randomized mint
- Royatlties with 1 reicever 
- Automatic reveal 
- Unlimited whitelists with prices, mint limit, start/end dates

Installation:

```shell
yarn install or npm install
```

Set up .env variables:

```shell
API_KEY= EXPLORER_APIKEY (snowtrace,etherscan...)
MAIN_URL= MAINNET_URL (exemple: https://api.avax.network/ext/bc/C/rpc)
TEST_URL= TESTNET_URL (exemple: https://api.avax-test.network/ext/bc/C/rpc)
PRIVATE_KEY= WALLET_PRIVATE_KEY
```

Try running some of the following tasks:

```shell
npx hardhat clean

npx hardhat test
npx hardhat compile

npx hardhat run scripts/deploy.js --network NETWORK_NAME
npx hardhat verify --constructor-args scripts/verifyArguments.js CONTRACT_ADDRESS --network test
```
