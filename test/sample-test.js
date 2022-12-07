const { expect } = require("chai");
const { ethers } = require("hardhat");
const { generateMerkleTree } = require("../utils/utils");

describe("DaoConfigurator", function () {
    let DaoConfigurator, contractInstance, owner, addr1, addr2, addr3, addrs;

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
            10000,
            "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3",
            500,
            1670429163,
            1,
            1670436600,
            10
        );

        const whiteList = [addr1, addr2, addr3];

        contractInstance.setWhiteListe(
            1670429163,
            10,
            1,
            generateMerkleTree(whiteList),
            true
        );
    });

    describe("Deployment", function () {
        console.log(owner, addr1, addr2, addr3, addrs, "owner");
        // it("Should set the right owner", async function () {
        //     expect(await contractInstance.owner()).to.equal(owner.address);
        // });
    });

    // describe("setIsAllowListActive", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).setIsAllowListActive(true)
    //         ).to.be.revertedWith("Ownable: caller is not the owner");
    //     });

    //     it("Should should set isAllowListActive by owner", async function () {
    //         const expectedValue = true;

    //         await contractInstance
    //             .connect(owner)
    //             .setIsAllowListActive(expectedValue);

    //         expect(await contractInstance.isAllowListActive()).to.equal(
    //             expectedValue
    //         );
    //     });
    // });

    // describe("setAllowList", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance
    //                 .connect(addr1)
    //                 .setAllowList([addr1.address], 10)
    //         ).to.be.revertedWith("caller is not the owner");
    //     });

    //     // THIS IS NOT WORKING, BECAUSE _allowList is private
    //     // it('Should should set _allowList by owner', async function () {
    //     //   const expectedValue = 10

    //     //   await contractInstance
    //     //     .connect(owner)
    //     //     .setAllowList([addr1.address, addr2.address], expectedValue)

    //     //   expect(
    //     //     await contractInstance.connect(owner)._allowList(addr1.address),
    //     //   ).to.equal(expectedValue)
    //     //   expect(
    //     //     await contractInstance.connect(owner)._allowList(addr2.address),
    //     //   ).to.equal(expectedValue)
    //     // })

    //     it("Should should set _allowList by owner", async function () {
    //         const expectedValue = 10;

    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address, addr2.address], expectedValue);

    //         expect(
    //             await contractInstance.numAvailableToMint(addr1.address)
    //         ).to.equal(expectedValue);
    //         expect(
    //             await contractInstance.numAvailableToMint(addr2.address)
    //         ).to.equal(expectedValue);
    //     });

    //     it("Should should set _allowList by owner", async function () {
    //         await contractInstance.connect(owner).setIsAllowListActive(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).mintAllowList(1, overrides)
    //         ).to.be.revertedWith("Exceeded max available to purchase");

    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address], 1);
    //         await contractInstance.connect(addr1).mintAllowList(1, overrides);

    //         //assert
    //         expect(await contractInstance.ownerOf(0)).to.equal(addr1.address);
    //         await expect(contractInstance.ownerOf(1)).to.be.revertedWith(
    //             "URI query for nonexistent token"
    //         );
    //     });
    // });

    // describe("numAvailableToMint", function () {
    //     it("Should show numAvailableToMint", async function () {
    //         const expectedValue = 5;

    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address, addr2.address], expectedValue);

    //         expect(
    //             await contractInstance.numAvailableToMint(addr1.address)
    //         ).to.equal(expectedValue);
    //         expect(
    //             await contractInstance.numAvailableToMint(addr2.address)
    //         ).to.equal(expectedValue);
    //         expect(
    //             await contractInstance.numAvailableToMint(addr3.address)
    //         ).to.equal(0);
    //     });
    // });

    // describe("mintAllowList", function () {
    //     it("Should be reverted because the isAllowListActive is false", async function () {
    //         await contractInstance.connect(owner).setIsAllowListActive(false);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address], 1);
    //         await expect(
    //             contractInstance.connect(addr1).mintAllowList(1, overrides)
    //         ).to.be.revertedWith("Allow list is not active");
    //     });

    //     it("Should be reverted if exceeded max available to purchase", async function () {
    //         await contractInstance.connect(owner).setIsAllowListActive(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.246"), // ether in this case MUST be a string
    //         };
    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address], 1);
    //         await expect(
    //             contractInstance.connect(addr1).mintAllowList(2, overrides)
    //         ).to.be.revertedWith("Exceeded max available to purchase");
    //     });

    //     it("Should be reverted because the caller exceeds max token", async function () {
    //         await contractInstance.connect(owner).setIsAllowListActive(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("24.6"), // ether in this case MUST be a string
    //         };
    //         //50*200 = 10000
    //         for (let i = 0; i < 50; i++) {
    //             await contractInstance
    //                 .connect(owner)
    //                 .setAllowList([addrs[i].address], 200);
    //             await contractInstance
    //                 .connect(addrs[i])
    //                 .mintAllowList(200, overrides);
    //         }
    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addrs[50].address], 200);
    //         await expect(
    //             contractInstance.connect(addrs[50]).mintAllowList(1, overrides)
    //         ).to.be.revertedWith("Purchase would exceed max tokens");
    //     });

    //     it("Should be reverted because the caller do not have enough fund", async function () {
    //         await contractInstance.connect(owner).setIsAllowListActive(true);

    //         const overrides = {
    //             value: ethers.utils.parseEther("0.122"), // ether in this case MUST be a string
    //         };
    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address], 1);
    //         await expect(
    //             contractInstance.connect(addr1).mintAllowList(1, overrides)
    //         ).to.be.revertedWith("Ether value sent is not correct");
    //     });

    //     it("Should mint token", async function () {
    //         const baseurl = "ipfs://test.url/";
    //         contractInstance.connect(owner).setBaseURI(baseurl);
    //         await contractInstance.connect(owner).setIsAllowListActive(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await contractInstance
    //             .connect(owner)
    //             .setAllowList([addr1.address], 1);
    //         await contractInstance.connect(addr1).mintAllowList(1, overrides);

    //         expect(await contractInstance.tokenURI(0)).to.equal(baseurl + "0"); //ipfs://test.url/0
    //         expect(await contractInstance.ownerOf(0)).to.equal(addr1.address);
    //     });
    // });

    // describe("setBaseURI", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).setBaseURI("url")
    //         ).to.be.revertedWith("caller is not the owner");
    //     });

    //     it("Should set the baseTokenURI by owner", async function () {
    //         const baseurl = "ipfs://test.url/";
    //         contractInstance.connect(owner).setBaseURI(baseurl);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await contractInstance.connect(owner).setSaleState(true);
    //         await contractInstance.connect(addr1).mint(1, overrides);

    //         expect(await contractInstance.tokenURI(0)).to.equal(baseurl + "0");
    //         expect(await contractInstance.ownerOf(0)).to.equal(addr1.address);
    //     });
    // });

    // describe("setProvenance", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).setProvenance("random hash")
    //         ).to.be.revertedWith("caller is not the owner");
    //     });

    //     it("Should should set PROVENANCE by owner", async function () {
    //         const expectedValue = "random hash";

    //         await contractInstance.connect(owner).setProvenance(expectedValue);

    //         expect(await contractInstance.PROVENANCE()).to.equal(expectedValue);
    //     });
    // });

    // describe("reserve", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).reserve(1)
    //         ).to.be.revertedWith("caller is not the owner");
    //     });

    //     it("Should reserve tokens by owner", async function () {
    //         const baseurl = "ipfs://test.url/";
    //         contractInstance.connect(owner).setBaseURI(baseurl);
    //         await contractInstance.connect(owner).reserve(5);
    //         for (let i = 0; i < 5; i++) {
    //             expect(await contractInstance.tokenURI(i)).to.equal(
    //                 baseurl + i
    //             );
    //         }
    //     });
    // });

    // describe("setSaleState", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).setSaleState(true)
    //         ).to.be.revertedWith("caller is not the owner");
    //     });

    //     it("Should should set saleIsActive by owner", async function () {
    //         const expectedValue = true;

    //         await contractInstance.connect(owner).setSaleState(expectedValue);

    //         expect(await contractInstance.saleIsActive()).to.equal(
    //             expectedValue
    //         );
    //     });
    // });

    // describe("mint", function () {
    //     it("Should be reverted because the saleIsActive is false", async function () {
    //         await contractInstance.connect(owner).setSaleState(false);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).mint(1, overrides)
    //         ).to.be.revertedWith("Sale must be active to mint tokens");
    //     });

    //     it("Should be reverted if exceeded max token purchase", async function () {
    //         await contractInstance.connect(owner).setSaleState(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.738"), // ether in this case MUST be a string
    //         };

    //         await expect(
    //             contractInstance.connect(addr1).mint(6, overrides)
    //         ).to.be.revertedWith("Exceeded max token purchase");
    //     });

    //     it("Should be reverted because the caller exceeds max token", async function () {
    //         await contractInstance.connect(owner).setSaleState(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.615"), // ether in this case MUST be a string
    //         };

    //         //5 token each time * 2000 = 10000
    //         for (let i = 0; i < 2000; i++) {
    //             await contractInstance.connect(addr1).mint(5, overrides);
    //         }

    //         await expect(
    //             contractInstance.connect(addr1).mint(1, overrides)
    //         ).to.be.revertedWith("Purchase would exceed max tokens");
    //     });

    //     it("Should be reverted because the caller do not have enough fund", async function () {
    //         await contractInstance.connect(owner).setSaleState(true);

    //         const overrides = {
    //             value: ethers.utils.parseEther("0.122"), // ether in this case MUST be a string
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).mint(1, overrides)
    //         ).to.be.revertedWith("Ether value sent is not correct");
    //     });

    //     it("Should mint token", async function () {
    //         const baseurl = "ipfs://test.url/";
    //         contractInstance.connect(owner).setBaseURI(baseurl);
    //         await contractInstance.connect(owner).setSaleState(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.123"), // ether in this case MUST be a string
    //         };
    //         await contractInstance.connect(addr1).mint(1, overrides);

    //         expect(await contractInstance.tokenURI(0)).to.equal(baseurl + "0");
    //         expect(await contractInstance.ownerOf(0)).to.equal(addr1.address);
    //     });
    // });

    // describe("withdraw", function () {
    //     it("Should be reverted because the caller is not owner", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).withdraw()
    //         ).to.be.revertedWith("caller is not the owner");
    //     });
    //     it("Should withdraw fund by the owner", async function () {
    //         await contractInstance.connect(owner).withdraw();
    //     });

    //     it("Should withdraw fund by the owner", async function () {
    //         await contractInstance.connect(owner).setSaleState(true);
    //         const overrides = {
    //             value: ethers.utils.parseEther("5"), // ether in this case MUST be a string
    //         };
    //         await contractInstance.connect(addr1).mint(1, overrides);
    //         const accountBalanceBeforeWithdraw = ethers.utils.formatEther(
    //             await contractInstance.provider.getBalance(owner.address)
    //         );

    //         await contractInstance.connect(owner).withdraw();
    //         const accountBalanceAfterWithdraw = ethers.utils.formatEther(
    //             await contractInstance.provider.getBalance(owner.address)
    //         );

    //         expect(
    //             parseInt(accountBalanceAfterWithdraw) >
    //                 parseInt(accountBalanceBeforeWithdraw)
    //         ).to.be.true;

    //         //get smart contract balance before withdraw and smart contract balance after withdraw
    //     });
    // });
});
