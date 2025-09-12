const { ethers } = require("hardhat");

async function main() {
    // Contract address from deployment
    const contractAddress = "0xcD4C77fa5dC1e0240Da75160403015fB140f69B9";

    const ERC20 = await ethers.getContractFactory("ERC20Contract");

    const erc20 = ERC20.attach(contractAddress);

    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";

    // let tx1 = await erc20.mintable(deployer, ethers.parseUnits("1.1", 6));
    // await tx1.wait();
    // let tx2 = await erc20.mintToSender(ethers.parseUnits("0.9", 6));
    // await tx2.wait();
    console.log("Balance of deployer: ", ethers.formatUnits(await erc20.balanceOfAccount(deployer), 6));
    // console.log("All accounts: ", await erc20.getAllAccounts());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
