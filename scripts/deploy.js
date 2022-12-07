const { ethers } = require("hardhat");

//helpers
// npx hardhat verify --constructor-args scripts/arguments.ts 0x95Cc015c59A70CA26547A6bc86a8Ce210aa37Ee7
// npx hardhat run scripts/deploy.js --network test

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DaoConfiguratorERC721 = await ethers.getContractFactory(
        "DaoConfiguratorERC721"
    );

    const contractInstance = await DaoConfiguratorERC721.deploy(
        "NFT_NAME", // _name
        "NFT_SYMBOL", // _symbol
        "base ", // baseTokenURI
        "reveal ", // revealURI
        10000, // total supply
        "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3", // royalty recipient
        500, //_ROYALTY_VALUE
        1670429163, // public start date https://www.unixtimestamp.com/
        1, // public price
        1670436600, // _REVEAL_DATE  https://www.unixtimestamp.com/
        10 //public max claim per mint
    );

    await contractInstance.deployed();

    // set whiteList
    await contractInstance.setWhiteList(
        1670429163, // wl start date
        10, // wl max per claim
        10, // wl nft price
        "0xe58fd181d2d25aef80ae5646aaf46071d6e24b5e0ec8c890ee392320eee9da6c", // whitelist merkle root
        true // set wl state to true
    );

    const admins = [
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
    ];

    await contractInstance.setAdmins(admins);

    console.log("DaoConfiguratorERC721 deployed to:", contractInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
