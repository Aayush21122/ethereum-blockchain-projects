const { ethers } = require("hardhat");

async function main() {
    // const [deployer] = await ethers.getSigners();
    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";

    const ERC1155 = await ethers.getContractFactory("ERC1155Contract");
    let erc1155 = await ERC1155.deploy();
    await erc1155.waitForDeployment();
    console.log("ERC1155 deployed to:", await erc1155.getAddress());

    let tx1 = await erc1155.mint(deployer, 1, ethers.parseUnits("1", 6), "0x");
    await tx1.wait();
    let tx2 = await erc1155.mintBatch(deployer, [1, 2], [ethers.parseUnits("1", 6), ethers.parseUnits("100", 6)], "0x");
    await tx2.wait();
    console.log("Balance of deployer: ", await erc1155.getMintableAmount(deployer, 1));
    console.log("Balance of deployer: ", await erc1155.getMintableAmount(deployer, 2));
    console.log("All accounts: ", await erc1155.getAllAccounts());
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})