const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with:", deployer.address);

    const PedalsupERC20 = await ethers.getContractFactory("Pedalsup");
    const erc20 = await PedalsupERC20.deploy();
    await erc20.waitForDeployment();
    console.log("PedalsupERC20 deployed to:", erc20.target);

    const staking = await ethers.getContractFactory("Staking");
    const stakingInstance = await staking.deploy(deployer.address);
    await stakingInstance.waitForDeployment();
    console.log("Staking Instance deployed to:", stakingInstance.target);
    return { erc20, stakingInstance };
}

module.exports = { main };