const { ethers } = require("hardhat");
const { expect } = require("chai");
const { merkleTree } = require("../scripts/merkletree.js");
const { main } = require("../scripts/deploy.js");

describe("Airdrop", async () => {
    let userProof, root, user1, user2, user3, user4, user5, user6, user7, user8, erc20, airdrop;
    before(async () => {
        ({ root, userProof } = await merkleTree());

        [user1, user2, user3, user4, user5, user6, user7, user8] = await ethers.getSigners();
        console.log(user1.address);

        ({ erc20, airdrop } = await main(root));
    });

    it("Should revert due to invalid proof", async () => {
        await expect(airdrop.connect(user1).claim(200, userProof[1])).to.be.revertedWith("Invalid proof");
    });

    it("Should revert if non-owner trying to mint tokens", async () => {
        await expect(erc20.mint(airdrop.target, ethers.parseUnits("100"))).to.be.revertedWithCustomError(erc20, "OwnableUnauthorizedAccount");
    });

    it("Should successfully claim reward", async () => {
        await erc20.connect(user8).mint(airdrop.target, ethers.parseUnits("3000"));
        await airdrop.connect(user1).claim(ethers.parseUnits("100"), userProof[0]);
        const bool = await airdrop.hasClaimed(user1.address);
        expect(bool).to.be.equal(true);
        const balance = await erc20.balanceOf(airdrop.target);
        expect(balance).to.be.equal(ethers.parseUnits("2900"));
    });

    it("Should revert due to reward already claimed", async () => {
        await expect(airdrop.connect(user1).claim(ethers.parseUnits("100"), userProof[0])).to.be.revertedWith("Already claimed")
    });
});