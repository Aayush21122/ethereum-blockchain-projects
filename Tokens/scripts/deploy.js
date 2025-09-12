const { ethers } = require("hardhat");

async function main() {
    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";
    console.log(deployer);

    const ERC20 = await ethers.getContractFactory("ERC20Contract");
    console.log("ERC20: ------------------", ERC20);
    let erc20 = await ERC20.deploy();
    console.log("erc20: +++++++++++++++++++", erc20);
    await erc20.waitForDeployment();
    console.log("ERC20 deployed to:", await erc20.getAddress());

    let tx1 = await erc20.mintable(deployer, ethers.parseUnits("10", 6));
    await tx1.wait();
    let tx2 = await erc20.mintToSender(ethers.parseUnits("10", 6));
    await tx2.wait();
    console.log("Balance of deployer: ", await erc20.balanceOfAccount(deployer));
    console.log("All accounts: ", await erc20.getAllAccounts());

}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})