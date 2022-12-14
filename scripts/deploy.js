const { ethers } = require("hardhat");
const params = require("./params");

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
    ] = params.args;

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

    const [
        _WL_START_DATE,
        _MAX_WL_CLAIM,
        _WL_NFT_PRICE,
        _WL_ERC20_PRICE,
        _MERKLE_ROOT,
        _HAS_WL,
    ] = params.whitelist;

    await contractInstance.setWhiteList(
        _WL_START_DATE,
        _MAX_WL_CLAIM,
        _WL_NFT_PRICE,
        _WL_ERC20_PRICE,
        _MERKLE_ROOT,
        _HAS_WL
    );

    await contractInstance.setAdmins(params.admins);

    console.log("DaoConfiguratorERC721 deployed to:", contractInstance.address);

    const MyTokenTest = await ethers.getContractFactory(
        "MyTokenTest"
    );

    const contractErc20 = await MyTokenTest.deploy();
    console.log("MyTokenTest deployed to:", contractErc20.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
