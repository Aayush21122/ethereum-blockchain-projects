const { expect } = require("chai");
const { ethers } = require("hardhat");
const { main } = require("../scripts/deploy.js");

describe("NFT Marketplace", async () => {
    let nft, marketPlace, erc20;
    let owner, user1, user2, user3;
    let listingId;

    before(async () => {
        const deployed = await main();
        nft = deployed.nft;
        erc20 = deployed.erc20;
        marketPlace = deployed.marketPlaceInstance;
        [owner, user1, user2, user3] = await ethers.getSigners();
    });

    it("should mint an ERC20", async () => {
        const mintERC20 = await erc20.mint(user1.address, ethers.parseUnits("1000"));
        await mintERC20.wait();
        console.log("Balance of ERC20 of user1 is: ", ethers.formatUnits(await erc20.balanceOf(user1.address)));
        expect(await erc20.balanceOf(user1.address)).to.equal(ethers.parseUnits("1000"));
    });

    it("should mint an NFT", async () => {
        const mintNFT = await nft.safeMint(user1.address);
        await mintNFT.wait();
        console.log("Owner of NFT with ID 1 is: ", await nft.getAccountbyTokenId(1));
        expect(await nft.ownerOf(1)).to.equal(await nft.getAccountbyTokenId(1));
    });

    it("should revert due to unownership", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        await expect(
            marketPlace.connect(user2).sellForETH(nft.target, 1, ethers.parseUnits("1000"), 0)
        ).to.be.revertedWith("You are not the owner");
    });

    it("should list nft for sell for Eth on market place", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user1).sellForETH(nft.target, 1, ethers.parseUnits("1000"), 0);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForETH(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForETH(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    // it("should revert due to already listed for sell", async () => {
    //     // await nft.connect(user1).approve(marketPlace.target, 1);
    //     await expect(
    //         marketPlace.sellForETH(nft.target, 1, ethers.parseUnits("1000"))
    //     ).to.be.revertedWith("NFT is listed for sell");
    // });

    it("should revert due to Incorrect Price", async () => {
        await expect(
            marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("500") })
        ).to.be.revertedWith("Incorrect price");
    });

    it("should buy an NFT", async () => {
        const buyNFT = await marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") });
        await buyNFT.wait();
        console.log("User2 is the new owner of NFT with ID 1: ", await nft.getAccountbyTokenId(1));
        expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it("should revert due to unlisted NFT", async () => {
        await expect(
            marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") })
        ).to.be.revertedWith("NFT not for sell");
    });

    it("should revert due to unownership", async () => {
        await nft.connect(user2).approve(marketPlace.target, 1);
        await expect(
            marketPlace.connect(user1).sellForERC20(nft.target, erc20.target, 1, ethers.parseUnits("1000"), 0)
        ).to.be.revertedWith("You are not the owner");
    });

    it("should list nft for sell for ERC20 on market place", async () => {
        await nft.connect(user2).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user2).sellForERC20(nft.target, erc20.target, 1, ethers.parseUnits("1000"), 0);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForERC20(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForERC20(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    // it("should revert due to already listed for sell", async () => {
    //     // await nft.connect(user2).approve(marketPlace.target, 1);
    //     await expect(
    //         marketPlace.connect(user2).sellForETH(nft.target, erc20.target, 1, ethers.parseUnits("1000"))
    //     ).to.be.revertedWith("NFT is listed for sell");
    // });

    it("should revert due to insufficient balance", async () => {
        await erc20.connect(user3).approve(marketPlace.target, ethers.parseUnits("1000"));
        await expect(
            marketPlace.connect(user3).buyNFTWithERC20(listingId, ethers.parseUnits("1000"))
        ).to.be.revertedWith("Insufficient Balance");
    });

    it("should revert due to incorrect price", async () => {
        await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("1000"));
        await expect(
            marketPlace.connect(user1).buyNFTWithERC20(listingId, ethers.parseUnits("500"))
        ).to.be.revertedWith("Incorrect price");
    });

    it("should buy an NFT through ERC20", async () => {
        await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("1000"));
        const buyNFT = await marketPlace.connect(user1).buyNFTWithERC20(listingId, ethers.parseUnits("1000"));
        await buyNFT.wait();
        console.log("User1 is the new owner of NFT with ID 1: ", await nft.getAccountbyTokenId(1));
        console.log("Balance of ERC20 of user1 is: ", ethers.formatUnits(await erc20.balanceOf(user1.address)));
        console.log("Balance of ERC20 of user2 is: ", ethers.formatUnits(await erc20.balanceOf(user2.address)));
        console.log("Balance of ERC20 of deployer is: ", ethers.formatUnits(await erc20.balanceOf(owner.address)));
        expect(await nft.ownerOf(1)).to.equal(user1.address);
    });

    it("should revert due to nft not for sell", async () => {
        await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("1000"));
        await expect(
            marketPlace.connect(user1).buyNFTWithERC20(9, ethers.parseUnits("1000"))
        ).to.be.revertedWith("NFT not for sell");
    });

    it("should list nft for sell for Eth on market place", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user1).sellForETH(nft.target, 1, ethers.parseUnits("1000"), 0);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForETH(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForETH(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    it("should revert due to non-existent listing", async () => {
        await expect(
            marketPlace.connect(user1).removeFromSellingForETH(9)
        ).to.be.revertedWith("There is no nft for selling");
    });

    it("should revert due to non-existent listing", async () => {
        await expect(
            marketPlace.connect(user2).removeFromSellingForETH(listingId)
        ).to.be.revertedWith("You are not the owner");
    });

    it("should remove nft from sell for Eth", async () => {
        const listNFT = await marketPlace.connect(user1).removeFromSellingForETH(listingId);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTRemoved");
        console.log(`NFT with listing Id ${event.args[0]} is removed from listing`);
        expect((await marketPlace.getPriceofListedNFTForETH(listingId)).isRemoved).to.equal(true);
    });

    it("should list nft for sell for ERC20 on market place", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user1).sellForERC20(nft.target, erc20.target, 1, ethers.parseUnits("1000"), 0);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForERC20(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForERC20(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    it("should revert due to non-existent listing", async () => {
        await expect(
            marketPlace.connect(user1).removeFromSellingForERC20(9)
        ).to.be.revertedWith("There is no nft for selling");
    });

    it("should revert due to non-existent listing", async () => {
        await expect(
            marketPlace.connect(user2).removeFromSellingForERC20(listingId)
        ).to.be.revertedWith("You are not the owner");
    });

    it("should remove nft from sell for ERC20", async () => {
        const listNFT = await marketPlace.connect(user1).removeFromSellingForERC20(listingId);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTRemoved");
        console.log(`NFT with listing Id ${event.args[0]} is removed from listing`);
        expect((await marketPlace.getPriceofListedNFTForERC20(listingId)).isRemoved).to.equal(true);
    });

    it("should list nft for sell for ERC20 on market place", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user1).sellForERC20(nft.target, erc20.target, 1, ethers.parseUnits("1000"), 3600);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForERC20(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForERC20(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    it("should revert due to nft not yet available for sell", async () => {
        await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("1000"));
        await expect(
            marketPlace.connect(user1).buyNFTWithERC20(listingId, ethers.parseUnits("1000"))
        ).to.be.revertedWith("NFT not yet available for sell");
    });

    it("should remove nft from sell for ERC20", async () => {
        const listNFT = await marketPlace.connect(user1).removeFromSellingForERC20(listingId);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTRemoved");
        console.log(`NFT with listing Id ${event.args[0]} is removed from listing`);
        expect((await marketPlace.getPriceofListedNFTForERC20(listingId)).isRemoved).to.equal(true);
    });

    it("should list nft for sell for Eth on market place", async () => {
        await nft.connect(user1).approve(marketPlace.target, 1);
        const listNFT = await marketPlace.connect(user1).sellForETH(nft.target, 1, ethers.parseUnits("1000"), 3600);
        const receipt = await listNFT.wait();
        const event = receipt.logs
            .map(log => {
                try {
                    return marketPlace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e && e.name === "NFTListed");
        listingId = event.args[0];
        console.log("NFT with ID 1 listed for sell on market place ", (await marketPlace.getPriceofListedNFTForETH(listingId)).price);
        expect((await marketPlace.getPriceofListedNFTForETH(listingId)).price).to.equal(ethers.parseUnits("1000"));
    });

    it("should not revert as time is manipulated and increase by 1 hour", async () => {
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");
        await expect(
            marketPlace.connect(user1).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") })
        ).to.not.be.reverted;
    });

});