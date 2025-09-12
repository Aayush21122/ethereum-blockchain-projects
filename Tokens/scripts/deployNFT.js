const { ethers } = require("hardhat");

async function main() {
    // const [deployer] = await ethers.getSigners();
    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";

    const ERC721 = await ethers.getContractFactory("ERC721Contract");
    let erc721 = await ERC721.deploy();
    await erc721.waitForDeployment();
    console.log("ERC721 deployed to:", await erc721.getAddress());

    let tx1 = await erc721.mintNFT(deployer, "ipfs://bafkreicztdrp2mygpokqqxpnrssi7nz3myiy6oq6vvmehcqk5ybgca654y");
    await tx1.wait();
    let tx2 = await erc721.mintNFTToSender("ipfs://bafkreihuxehfjd4fwz2fabnyxtvljfbo53ek7loqcernkqvdtj6xslg72m");
    await tx2.wait();
    console.log("MetaData of 1st NFT: ", await erc721.metaDataOfNFT(deployer, 1));
    console.log("MetaData of 2nd NFT: ", await erc721.metaDataOfNFT(deployer, 2));
    console.log("All accounts: ", await erc721.getAllAccounts());

}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
})