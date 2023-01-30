import { keccak256 } from "ethers/lib/utils";

const { ContractFactory, ethers } = require("ethers");
const {
    DaoConfiguratorERC721,
} = require("../artifacts/contracts/DaoConfiguratorERC721.sol/DaoConfiguratorERC721.json");

export const createERC721 = async (provider, collection) => {
    try {
        const signer = provider.getSigner();

        const erc721Instance = new ContractFactory(
            DaoConfiguratorERC721.abi,
            DaoConfiguratorERC721.bytecode,
            signer
        );

        const contract = await erc721Instance.deploy(
            collection._name,
            collection._symbol,
            collection._baseTokenURI,
            collection._revealURI,
            collection._MAX_MINTABLE,
            collection._ROYALTY_RECIPIENT,
            collection._ROYALTY_VALUE,
            collection._START_DATE,
            collection._NFT_PUBLIC_PRICE,
            collection._REVEAL_DATE,
            collection._MAX_PUBLIC_CLAIM
        );

        await contract.deployTransaction.wait();
        return contract.address;
    } catch (err) {
        console.error(err);
        throw new Error("Deploying collection failed!");
    }
};

export const setWhiteList = async (provider, params) => {
    try {
        const signer = provider.getSigner();

        let contract = new ethers.Contract(
            params.collectionAddress,
            DaoConfiguratorERC721.abi,
            signer
        );

        const whiteList = ["0x", "0x", "0x"];

        // re-creating the tree
        const leaves = whiteList.map((x) =>
            keccak256(solidityPack(["address"], [x]))
        );
        const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });
        const root = merkleTree.getHexRoot();

        let tx = await contract.setWhiteList(
            params._WL_START_DATE,
            params._MAX_WL_CLAIM,
            params._WL_NFT_PRICE,
            root,
            params._HAS_WL
        );

        const txResponse = await tx.wait();
        return txResponse;
    } catch (err) {
        throw new Error("Set whitelist failed!");
    }
};

export const publicMintERC721 = async (provider, params) => {
    try {
        const signer = provider.getSigner();

        let contract = new ethers.Contract(
            params.collectionAddress,
            DaoConfiguratorERC721.abi,
            signer
        );

        const overrides = {
            value: ethers.utils.parseEther("1"), // token price
        };

        let tx = await contract.publicMint(1, overrides);

        const txResponse = await tx.wait();
        return txResponse;
    } catch (err) {
        throw new Error("Minting ERC721 failed!");
    }
};

export const whiteListMintERC721 = async (provider, params) => {
    try {
        //whitelist
        const whiteList = ["0x", "0x", "0x"];

        // re-creating the tree
        const leaves = whiteList.map((x) =>
            keccak256(solidityPack(["address"], [x]))
        );
        merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

        // in order to get the leaf
        const claimingAddress = keccak256(params.userAddress);
        const hexProof = merkleTree.getHexProof(claimingAddress);

        const signer = provider.getSigner();

        let contract = new ethers.Contract(
            params.collectionAddress,
            DaoConfiguratorERC721.abi,
            signer
        );

        const overrides = {
            value: ethers.utils.parseEther("1"), // token price
        };

        let tx = await contract.whiteListMint(1, hexProof, overrides);

        const txResponse = await tx.wait();
        return txResponse;
    } catch (err) {
        throw new Error("Minting ERC721 failed!");
    }
};

export const toggleMint = async (provider, collectionAddress) => {
    try {
        const signer = provider.getSigner();

        let contract = new ethers.Contract(
            collectionAddress,
            DaoConfiguratorERC721.abi,
            signer
        );

        let tx = await contract.toggleMint();

        const txResponse = await tx.wait();
        return txResponse;
    } catch (err) {
        throw new Error("Toggle mint failed!");
    }
};

export const withdraw = async (provider, collectionAddress) => {
    try {
        const signer = provider.getSigner();

        let contract = new ethers.Contract(
            collectionAddress,
            DaoConfiguratorERC721.abi,
            signer
        );

        let tx = await contract.withdraw();

        const txResponse = await tx.wait();
        return txResponse;
    } catch (err) {
        throw new Error("Withdraw failed!");
    }
};
