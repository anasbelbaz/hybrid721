const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const addDays = (days) => {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getTime();
};

const unixTimestamp = (timestamp) => {
    return Math.floor(timestamp / 1000);
};

const addMinutes = (minutes) => {
    return unixTimestamp(new Date(Date.now() + minutes * 60000).getTime());
};

describe("DutchAuction", function () {
    let DutchAuction,
        contractInstance,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addrs;

    beforeEach(async function () {
        DutchAuction = await ethers.getContractFactory("dutchAuction");

        [owner, addr1, addr2, addr3, addr4, ...addrs] =
            await ethers.getSigners();

        contractInstance = await DutchAuction.deploy(
            "NFT_NAME",
            "NFT_SYMBOL",
            "base ",
            1000,
            "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3",
            500,
            10,
            "0xab7b1563C4cA2A002b3F8bFf9dC1499CEdF8e4F3"
        );

        const admins = [addr2.address, addr3.address];
        contractInstance.setAdmins(admins);

        contractInstance.setDutchAuction(
            addMinutes(0),
            ethers.utils.parseEther("5"),
            ethers.utils.parseEther("1"),
            10,
            ethers.utils.parseEther("1")
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

    describe("dutch auction tests", function () {
        it("Should be reverted because the price has changed", async function (done) {
            const overrides = {
                value: ethers.utils.parseEther("3"),
            };

            // const ok = await contractInstance.getCurrentPrice();
            // console.log(ok);

            setTimeout(async () => {
                const ok = await contractInstance.getCurrentPrice();
                console.log("timedout", ok);
                return await expect(
                    contractInstance.connect(addr1).claim(1, overrides)
                ).to.be.revertedWith("Ether value sent is below the price");
            }, 10000).then(() => done());
        });
    });

    // describe("public mint", function () {
    //     it("Should be reverted because the OPEN_SALES is false", async function () {
    //         await contractInstance.connect(owner).toggleMint();
    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).publicMint(1, overrides)
    //         ).to.be.revertedWith("It's not possible to claim just yet");
    //     });

    //     it("Should be reverted because the Has_Public is false", async function () {
    //         await contractInstance.connect(owner).toggleHasPublic();
    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).publicMint(1, overrides)
    //         ).to.be.revertedWith("No public sale assigned to this project");
    //     });

    //     it("Should be reverted if exceeded max token purchase", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("11"),
    //         };

    //         await expect(
    //             contractInstance.connect(addr1).publicMint(11, overrides)
    //         ).to.be.revertedWith("you can't claim that much at once");
    //     });

    //     it("Should be reverted because the caller do not have enough fund", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("0.01"),
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).publicMint(1, overrides)
    //         ).to.be.revertedWith("Ether value sent is below the price");
    //     });

    //     it("Should be reverted because the minting event has not begun", async function () {
    //         await contractInstance.setPublicStartDate(addDays(2));

    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };
    //         await expect(
    //             contractInstance.connect(addr1).publicMint(1, overrides)
    //         ).to.be.revertedWith("Not started yet");
    //     });

    //     it("Should be reverted because the caller exceeds max token", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("5"),
    //         };

    //         //5 token each time * 2000 = 10 000
    //         for (let i = 0; i < 200; i++) {
    //             await contractInstance.connect(addr1).publicMint(5, overrides);
    //         }

    //         await expect(
    //             contractInstance.connect(addr1).publicMint(1, overrides)
    //         ).to.be.revertedWith("Not enough left to mint");
    //     });

    //     it("Should mint token", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };

    //         await contractInstance.connect(addr1).publicMint(1, overrides);
    //         expect(await contractInstance.balanceOf(addr1.address)).to.equal(1);
    //     });

    //     it("Should be possible to free mint", async function () {
    //         await contractInstance.setPublicPrice(ethers.utils.parseEther("0"));
    //         await contractInstance.connect(addr1).publicMint(1);
    //         expect(await contractInstance.balanceOf(addr1.address)).to.equal(1);
    //     });
    // });

    // describe("withdraw", function () {
    //     it("Should be reverted because the caller is not admin", async function () {
    //         await expect(
    //             contractInstance.connect(addr1).withdraw()
    //         ).to.be.revertedWith("Your are not admin");
    //     });
    //     it("Should withdraw fund by the admin", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };

    //         await contractInstance.connect(addr1).publicMint(1, overrides);
    //         await contractInstance.connect(addr3).withdraw();
    //     });

    //     it("Should withdraw fund by the admin", async function () {
    //         const overrides = {
    //             value: ethers.utils.parseEther("1"),
    //         };

    //         await contractInstance.connect(addr1).publicMint(1, overrides);

    //         const accountBalanceBeforeWithdraw = ethers.utils.formatEther(
    //             await contractInstance.provider.getBalance(addr3.address)
    //         );

    //         await contractInstance.connect(addr3).withdraw();
    //         const accountBalanceAfterWithdraw = ethers.utils.formatEther(
    //             await contractInstance.provider.getBalance(addr3.address)
    //         );

    //         expect(
    //             parseInt(accountBalanceAfterWithdraw) >
    //                 parseInt(accountBalanceBeforeWithdraw)
    //         ).to.be.true;

    //         //get smart contract balance before withdraw and smart contract balance after withdraw
    //     });
    // });
});
