const { ethers } = require("hardhat");
const params = require("./params");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const ERC721DutchAuction = await ethers.getContractFactory(
        "ERC721DutchAuction"
    );

    const [
        nftName,
        nftSymbol,
        _baseTokenURI,
        _MAX_MINTABLE,
        _ROYALTY_RECIPIENT,
        _ROYALTY_VALUE,
        _PUBLIC_START_DATE,
        _MAX_PUBLIC_CLAIM,
        _KALAO_ADDRESS,
    ] = params.args_dutchAuction;

    const contractInstance = await ERC721DutchAuction.deploy(
        nftName,
        nftSymbol,
        _baseTokenURI,
        _MAX_MINTABLE,
        _ROYALTY_RECIPIENT,
        _ROYALTY_VALUE,
        _PUBLIC_START_DATE,
        _MAX_PUBLIC_CLAIM,
        _KALAO_ADDRESS
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
        _MERKLE_ROOT,
        _HAS_WL
    );

    await contractInstance.setAdmins(params.admins);

    console.log("ERC721DutchAuction deployed to:", contractInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
