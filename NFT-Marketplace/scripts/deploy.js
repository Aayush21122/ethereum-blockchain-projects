const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const PedalsupNFT = await ethers.getContractFactory("PedalsupNFT");
  const nft = await PedalsupNFT.deploy();
  await nft.waitForDeployment();
  console.log("PedalsupNFT deployed to:", nft.target);

  const PedalsupERC20 = await ethers.getContractFactory("Pedalsup");
  const erc20 = await PedalsupERC20.deploy();
  await erc20.waitForDeployment();
  console.log("PedalsupERC20 deployed to:", erc20.target);

  const marketPlace = await ethers.getContractFactory("MarketPlace");
  const marketPlaceInstance = await marketPlace.deploy(deployer.address);
  await marketPlaceInstance.waitForDeployment();
  console.log("Market Place Instance deployed to:", marketPlaceInstance.target);
  return { nft, erc20, marketPlaceInstance };
}

module.exports = { main };