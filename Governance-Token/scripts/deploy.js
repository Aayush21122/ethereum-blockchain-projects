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

  const GPedalsup = await ethers.getContractFactory("GPedalsup");
  const gpup = await GPedalsup.deploy();
  await gpup.waitForDeployment();
  console.log("GPedalsup deployed to:", gpup.target);

  const TL = await ethers.getContractFactory("MyTimelock");
  const timelock = await TL.deploy(12, [], [], deployer.address);
  await timelock.waitForDeployment();
  console.log("Timelock deployed to:", timelock.target);

  const PedalsupGovernance = await ethers.getContractFactory("PedalsupGovernor");
  const governance = await PedalsupGovernance.deploy(gpup.target, timelock.target);
  await governance.waitForDeployment();
  console.log("PedalsupGovernor deployed to:", governance.target);

  const marketPlace = await ethers.getContractFactory("MarketPlace");
  const marketPlaceInstance = await marketPlace.deploy(timelock.target);
  await marketPlaceInstance.waitForDeployment();
  console.log("Market Place Instance deployed to:", marketPlaceInstance.target);
  return { nft, timelock, gpup, governance, erc20, marketPlaceInstance };
}

module.exports = { main };