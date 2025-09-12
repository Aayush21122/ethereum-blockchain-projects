const { ethers } = require("hardhat");

async function main() {
    // Contract address from deployment
    const contractAddress = "0x76797E17d7Dd6136d833704740fB4f6127e45556";

    const ERC721 = await ethers.getContractFactory("ERC721Contract");

    const erc721 = ERC721.attach(contractAddress);

    const deployer = "0xBbC0d026950711b6E579fc5Ac80bb1aDd7c08EAf";

    // let tx1 = await erc721.mintNFT(deployer, "ipfs/bafkreicztdrp2mygpokqqxpnrssi7nz3myiy6oq6vvmehcqk5ybgca654y");
    // await tx1.wait();
    // let tx2 = await erc721.mintNFTToSender("ipfs/bafkreihuxehfjd4fwz2fabnyxtvljfbo53ek7loqcernkqvdtj6xslg72m");
    // await tx2.wait();
    console.log("MetaData of 1st NFT: ", await erc721.metaDataOfNFT(deployer, 3));
    console.log("MetaData of 2nd NFT: ", await erc721.metaDataOfNFT(deployer, 4));
    // console.log("All accounts: ", await erc721.getAllAccounts());

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
