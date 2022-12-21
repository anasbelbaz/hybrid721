const params = {
    args: [
        "NFT_NAME",
        "NFT_SYMBOL",
        "base ",
        "reveal ",
        10000,
        "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3",
        500,
        1670429163,
        100,
        1670436600,
        10,
    ],
    args_dutchAuction: [
        "NFT_NAME",
        "NFT_SYMBOL",
        "base ",
        10000,
        "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3",
        500,
        1670429163,
        10,
        "0xeff2357C9e40103Ac4d268B32de478E4fBBFc4f0",
    ],
    whitelist: [
        1670429163, // wl start date
        10, // wl max per claim
        10, // wl nft price
        "0xe58fd181d2d25aef80ae5646aaf46071d6e24b5e0ec8c890ee392320eee9da6c", // whitelist merkle root
        true, // set wl state to true
    ],
    admins: [
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
        "0x20dbf6Ad54bdAe76E42Aee8960b7e2E56A053eFf",
    ],
};

module.exports = params;
