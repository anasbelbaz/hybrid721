require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
//
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

// task action function receives the Hardhat Runtime Environment as second argument
task(
    "blockNumber",
    "Prints the current block number",
    async (_, { ethers }) => {
        await ethers.provider.getBlockNumber().then((blockNumber) => {
            console.log("Current block number: " + blockNumber);
        });
    }
);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    etherscan: {
        apiKey: process.env.API_KEY,
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
        test: {
            url: process.env.TEST_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 43113,
        },
        main: {
            url: process.env.MAIN_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 43114,
        },
    },

    solidity: {
        compilers: [
            {
                version: "0.8.1",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
            },
        ],
    },
};
