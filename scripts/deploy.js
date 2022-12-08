const { ethers } = require("hardhat");
const { args } = require("./arguments");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DaoConfiguratorERC721 = await ethers.getContractFactory(
        "DaoConfiguratorERC721"
    );

    const [
        _name,
        _symbol,
        _baseTokenURI,
        _revealURI,
        _MAX_MINTABLE,
        _ROYALTY_RECIPIENT,
        _ROYALTY_VALUE,
        _START_DATE,
        _NFT_PUBLIC_PRICE,
        _REVEAL_DATE,
        _MAX_PUBLIC_CLAIM,
    ] = args;

    const contractInstance = await DaoConfiguratorERC721.deploy(
        _name,
        _symbol,
        _baseTokenURI,
        _revealURI,
        _MAX_MINTABLE,
        _ROYALTY_RECIPIENT,
        _ROYALTY_VALUE,
        _START_DATE,
        _NFT_PUBLIC_PRICE,
        _REVEAL_DATE,
        _MAX_PUBLIC_CLAIM
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
