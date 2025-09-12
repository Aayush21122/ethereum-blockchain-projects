const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Contract", async () => {
    let erc20;
    let deployer;
    before(async () => {
        [deployer] = await ethers.getSigners();
        const ERC20 = await ethers.getContractFactory("ERC20Contract");
        erc20 = await ERC20.deploy();
        await erc20.waitForDeployment();
        console.log("ERC20 deployed to: ", await erc20.getAddress());
    })

    console.log("In test file")

    it("Should match the amount", async () => {
        await erc20.mintable(deployer.address, 10);
        expect(await erc20.balanceOfAccount(deployer.address)).to.equal(10);
    })
})