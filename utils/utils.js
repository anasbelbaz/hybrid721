const { solidityPack, keccak256 } = require("ethers/lib/utils");
const MerkleTree = require("merkletreejs");

const generateMerkleTree = (array) => {
    const len = array.length;
    const last_elem = array[len - 1];
    let n = Math.pow(2, Math.ceil(Math.log(len) / Math.log(2)));
    n = Math.max(n, 2);

    for (let i = 0; i < n - len; i++) {
        array.push(last_elem);
    }

    const leaves = array.map((x) => keccak256(solidityPack(["uint256"], [x])));
    const tree = new MerkleTree(leaves, keccak256, { sort: true });

    return tree.getHexRoot();
};

export { generateMerkleTree };
