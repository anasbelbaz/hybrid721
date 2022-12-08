const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { solidityPack, keccak256 } = require("ethers/lib/utils");
const { MerkleTree } = require("merkletreejs");

const addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.getTime();
};

describe("DaoConfigurator", function () {
    let DaoConfigurator,
        contractInstance,
        owner,
        addr1,
        addr2,
        addr3,
        addrs,
        merkleTree;

    beforeEach(async function () {
        DaoConfigurator = await ethers.getContractFactory(
            "DaoConfiguratorERC721"
        );

        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        contractInstance = await DaoConfigurator.deploy(
            "NFT_NAME",
            "NFT_SYMBOL",
            "base ",
            "reveal ",
            1000,
            "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3",
            500,
            1670429163,
            ethers.utils.parseEther("1"),
            1670436600,
            0
        );
        const admins = [addr2.address, addr3.address];
        contractInstance.setAdmins(admins);

        const whiteList = [addr1.address, addr2.address, addr3.address];

        const leaves = whiteList.map((x) =>
            keccak256(solidityPack(["address"], [x]))
        );

        merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

        contractInstance.setWhiteList(
            1670429163,
            10,
            ethers.utils.parseEther("1"),
            merkleTree.getHexRoot(),
            true
        );
    });

    describe("check owner", function () {
        it("Should set the right owner", async function () {
            expect(await contractInstance.owner()).to.equal(owner.address);
        });
    });

    describe("check setBaseURI", function () {
        it("Should be reverted because the caller is not owner", async function () {
            await expect(
                contractInstance.connect(addr1).setBaseUri("url")
            ).to.be.revertedWith("caller is not the owner");
        });

        it("Should set the baseTokenURI by owner", async function () {
            const baseurl = "ipfs://test.url/";
            await contractInstance.connect(owner).setBaseUri(baseurl);

            expect(await contractInstance.BASE_URI()).to.equal(baseurl);
        });
    });

    describe("check admin mint", function () {
        it("Should not Admin mint", async function () {
            await expect(
                contractInstance.connect(addr1).adminMint(2, addr1.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should Random Admin mint", async function () {
            await contractInstance
                .connect(owner)
                .adminRandomMint(2, addr1.address);
            expect(await contractInstance.balanceOf(addr1.address)).to.equal(2);
        });

        it("Should not Admin mint in order", async function () {
            await contractInstance
                .connect(owner)
                .adminRandomMint(2, addr1.address);

            await expect(
                contractInstance.connect(owner).adminMint(2, addr1.address)
            ).to.be.revertedWith(
                "can't mint in order, tokens have already been randomized"
            );
        });
    });

    describe("check onlyOwner functions", function () {
        it("Should be reverted because the caller is not owner", async function () {
            await expect(
                contractInstance.connect(addr1).toggleMint()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should should set toggleMint by owner", async function () {
            await contractInstance.connect(owner).toggleMint();

            expect(await contractInstance.OPEN_SALES()).to.equal(false);
        });
    });

    describe("check whitelisted user", function () {
        it("Should not be whitelisted", async function () {
            const claimingAddress = keccak256(owner.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            const proof = await contractInstance
                .connect(owner)
                .isWhiteListed(owner.address, hexProof);

            expect(proof).to.equal(false);
        });

        it("Should be whitelisted", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);

            const proof = await contractInstance
                .connect(addr1)
                .isWhiteListed(addr1.address, hexProof);

            expect(proof).to.equal(true);
        });
    });

    describe("whitelist mint", function () {
        it("Should be reverted because the HAS_WL is false", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.toggleHasWL();
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(1, hexProof, overrides)
            ).to.be.revertedWith("No whitelist assigned to this project");
        });

        it("Should be reverted because the OPEN_SALES is false", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);

            await contractInstance.connect(owner).toggleMint();

            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(1, hexProof, overrides)
            ).to.be.revertedWith("It's not possible to claim just yet");
        });

        it("Should be reverted because the minting event has not begun", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setWLstartDate(addDays(new Date(), 2));

            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(1, hexProof, overrides)
            ).to.be.revertedWith("Not started yet");
        });

        it("Should be reverted because the Public event has begun", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setWLstartDate(1670409526);
            await contractInstance.setPublicStartDate(1670495926);

            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(1, hexProof, overrides)
            ).to.be.revertedWith(
                "Public mint is open, the whitelist mint is over"
            );
        });

        it("Should be reverted if exceeded max token purchase", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));

            const overrides = {
                value: ethers.utils.parseEther("11"),
            };

            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(11, hexProof, overrides)
            ).to.be.revertedWith("you can't claim that much at once");
        });

        it("Should be reverted because the caller do not have enough fund", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));

            const overrides = {
                value: ethers.utils.parseEther("0.01"),
            };
            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(1, hexProof, overrides)
            ).to.be.revertedWith("Ether value sent is below the price");
        });

        it("Should be reverted because the caller exceeds max token per address", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));

            const overrides = {
                value: ethers.utils.parseEther("5"),
            };

            await expect(
                contractInstance
                    .connect(addr1)
                    .whiteListMint(11, hexProof, overrides)
            ).to.be.revertedWith("you can't claim that much");
        });

        it("Verify whitelisted user minting count", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));
            const overrides = {
                value: ethers.utils.parseEther("10"),
            };

            await contractInstance
                .connect(addr1)
                .whiteListMint(10, hexProof, overrides);

            expect(
                await contractInstance.whiteListMintedCount(addr1.address)
            ).to.equal(10);
        });

        it("Should mint token", async function () {
            const claimingAddress = keccak256(addr1.address);
            const hexProof = merkleTree.getHexProof(claimingAddress);
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };

            await contractInstance
                .connect(addr1)
                .whiteListMint(1, hexProof, overrides);
            expect(await contractInstance.balanceOf(addr1.address)).to.equal(1);
        });
    });

    describe("public mint", function () {
        it("Should be reverted because the OPEN_SALES is false", async function () {
            await contractInstance.connect(owner).toggleMint();
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance.connect(addr1).publicMint(1, overrides)
            ).to.be.revertedWith("It's not possible to claim just yet");
        });

        it("Should be reverted because the Has_Public is false", async function () {
            await contractInstance.connect(owner).toggleHasPublic();
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance.connect(addr1).publicMint(1, overrides)
            ).to.be.revertedWith("No public sale assigned to this project");
        });

        it("Should be reverted if exceeded max token purchase", async function () {
            const overrides = {
                value: ethers.utils.parseEther("11"),
            };

            await expect(
                contractInstance.connect(addr1).publicMint(11, overrides)
            ).to.be.revertedWith("you can't claim that much at once");
        });

        it("Should be reverted because the caller do not have enough fund", async function () {
            const overrides = {
                value: ethers.utils.parseEther("0.01"),
            };
            await expect(
                contractInstance.connect(addr1).publicMint(1, overrides)
            ).to.be.revertedWith("Ether value sent is below the price");
        });

        it("Should be reverted because the minting event has not begun", async function () {
            await contractInstance.setPublicStartDate(addDays(new Date(), 2));

            const overrides = {
                value: ethers.utils.parseEther("1"),
            };
            await expect(
                contractInstance.connect(addr1).publicMint(1, overrides)
            ).to.be.revertedWith("Not started yet");
        });

        it("Should be reverted because the caller exceeds max token", async function () {
            const overrides = {
                value: ethers.utils.parseEther("5"),
            };

            //5 token each time * 2000 = 10 000
            for (let i = 0; i < 200; i++) {
                await contractInstance.connect(addr1).publicMint(5, overrides);
            }

            await expect(
                contractInstance.connect(addr1).publicMint(1, overrides)
            ).to.be.revertedWith("Not enough left to mint");
        });

        it("Should mint token", async function () {
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };

            await contractInstance.connect(addr1).publicMint(1, overrides);
            expect(await contractInstance.balanceOf(addr1.address)).to.equal(1);
        });

        it("Should be possible to free mint", async function () {
            await contractInstance.setPublicPrice(ethers.utils.parseEther("0"));
            await contractInstance.connect(addr1).publicMint(1);
            expect(await contractInstance.balanceOf(addr1.address)).to.equal(1);
        });
    });

    describe("withdraw", function () {
        it("Should be reverted because the caller is not admin", async function () {
            await expect(
                contractInstance.connect(addr1).withdraw()
            ).to.be.revertedWith("Your are not admin");
        });
        it("Should withdraw fund by the admin", async function () {
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };

            await contractInstance.connect(addr1).publicMint(1, overrides);
            await contractInstance.connect(addr3).withdraw();
        });

        it("Should withdraw fund by the admin", async function () {
            const overrides = {
                value: ethers.utils.parseEther("1"),
            };

            await contractInstance.connect(addr1).publicMint(1, overrides);

            const accountBalanceBeforeWithdraw = ethers.utils.formatEther(
                await contractInstance.provider.getBalance(addr3.address)
            );

            await contractInstance.connect(addr3).withdraw();
            const accountBalanceAfterWithdraw = ethers.utils.formatEther(
                await contractInstance.provider.getBalance(addr3.address)
            );

            expect(
                parseInt(accountBalanceAfterWithdraw) >
                    parseInt(accountBalanceBeforeWithdraw)
            ).to.be.true;

            //get smart contract balance before withdraw and smart contract balance after withdraw
        });
    });
});
