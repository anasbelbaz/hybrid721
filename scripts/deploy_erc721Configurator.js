const { ethers } = require("hardhat");
const params = require("./params");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ERC721Configurator = await ethers.getContractFactory(
        "ERC721Configurator"
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
    ] = params.args;

    const contractInstance = await ERC721Configurator.deploy(
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

    const [
        _WL_START_DATE,
        _MAX_WL_CLAIM,
        _WL_NFT_PRICE,
        _MERKLE_ROOT,
        _HAS_WL,
    ] = params.whitelist;

    await contractInstance.setWhiteList(
        _WL_START_DATE,
        _MAX_WL_CLAIM,
        _WL_NFT_PRICE,
        _MERKLE_ROOT,
        _HAS_WL
    );

    await contractInstance.setAdmins(params.admins);

    console.log("ERC721Configurator deployed to:", contractInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
