const { ethers } = require("hardhat");

async function main(root) {
    const account = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("Pedalsup");
    let erc20 = await ERC20.deploy(account[7].address);
    await erc20.waitForDeployment();
    console.log("ERC20", erc20.target);

    const Airdrop = await ethers.getContractFactory("MerkleAirdrop");
    let airdrop = await Airdrop.deploy(erc20.target, root);
    await airdrop.waitForDeployment();

    return { erc20, airdrop };
}

module.exports = { main };