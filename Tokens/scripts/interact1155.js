const { ethers } = require("hardhat");

async function main() {
    // Contract address from deployment
    const contractAddress = "0x0F7CbB02fCa1c72E0d0016dc1d499444a07793e8";

    const ERC1155 = await ethers.getContractFactory("ERC1155Contract");

    const erc1155 = ERC1155.attach(contractAddress);
    // const [deployer] = await ethers.getSigners();
    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";

    let tx1 = await erc1155.mint(deployer, 1, ethers.parseUnits("1", 6), "0x");
    await tx1.wait();
    let tx2 = await erc1155.mintBatch(deployer, [1, 2], [ethers.parseUnits("1", 6), ethers.parseUnits("100", 6)], "0x");
    await tx2.wait();
    console.log("Balance of deployer: ", await erc1155.getMintableAmount(deployer, 1));
    console.log("Balance of deployer: ", await erc1155.getMintableAmount(deployer, 2));
    console.log("All accounts: ", await erc1155.getAllAccounts());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
