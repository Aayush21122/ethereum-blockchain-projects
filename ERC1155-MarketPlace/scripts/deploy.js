const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const PedalsupERC20 = await ethers.getContractFactory("Pedalsup");
  const erc20 = await PedalsupERC20.deploy();
  await erc20.waitForDeployment();
  console.log("PedalsupERC20 deployed to:", erc20.target);
  
  const PedalsupERC1155 = await ethers.getContractFactory("Pedalsup1155");
  const erc1155 = await PedalsupERC1155.deploy();
  await erc1155.waitForDeployment();
  console.log("PedalsupERC20 deployed to:", erc1155.target);

  const marketPlace = await ethers.getContractFactory("MarketPlace");
  const marketPlaceInstance = await marketPlace.deploy(deployer.address);
  await marketPlaceInstance.waitForDeployment();
  console.log("Market Place Instance deployed to:", marketPlaceInstance.target);
  return { erc20, erc1155, marketPlaceInstance };
}

module.exports = { main };