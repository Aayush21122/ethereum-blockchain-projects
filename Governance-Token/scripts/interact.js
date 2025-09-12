const { ethers } = require("hardhat");

async function main() {
  const [owner, user1, user2, user3] = await ethers.getSigners();

  // console.log("Owner address:", owner.address, await ethers.provider.getBalance(owner.address));
  // console.log("User1 address:", user1.address, ethers.formatUnits(await ethers.provider.getBalance(user1.address)));
  // console.log("User2 address:", user2.address, ethers.formatUnits(await ethers.provider.getBalance(user2.address)));
  // console.log("User3 address:", user3.address, ethers.formatUnits(await ethers.provider.getBalance(user3.address)));

  const NFT = await ethers.getContractFactory("PedalsupNFT");
  const marketplaceAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
  const nft = NFT.attach(marketplaceAddress);

  // console.log("-------- Minting ERC20 TOKEN ---------");
  // const mintERC20 = await nft.erc20Mint(user2.address, ethers.parseUnits("1000"));
  // await mintERC20.wait();
  // console.log("Minted 1000 ERC20 tokens to ", owner.address, " Balance: ", ethers.formatUnits(await nft.getERC20Balance(owner.address)));

  // console.log("--------- Get price of listed nft for ETH ---------");
  // const ethPrice = await nft.getPriceofListedNFTForETH(1);
  // console.log("Price of NFT for ETH:", ethers.formatUnits(ethPrice));

  // console.log("--------- Get price of listed nft for ERC20 ---------");
  // const erc20Price = await nft.getPriceofListedNFTForERC20(1);
  // console.log("Price of NFT for ERC20:", ethers.formatUnits(erc20Price));

  // console.log("\n--- Minting NFT ---");
  // const mintTx = await nft.safeMint(user1.address);
  // await mintTx.wait();
  // console.log("Minted NFT to ", user1.address);

  //   console.log("\n--- Transfer NFT ---");
  //   const transferTx = await nft.connect(user2).buyNFTWithETH(
  //     1,
  //     { value: ethers.parseUnits("100") }
  //   );
  //   await transferTx.wait();
  //   console.log("Transferred tokenId 1 from user1 → user2");

  // console.log("---------- Listing NFT for sell for ETH ---------");
  // await nft.connect(user1).approve(marketplaceAddress, 1);
  // await nft.connect(user1).sellForETH(1, ethers.parseUnits("100"));

  // console.log("---------- Listing NFT for sell for ERC20 ---------");
  // await nft.connect(user1).approve(marketplaceAddress, 1);
  // await nft.connect(user1).sellForERC20(1, ethers.parseUnits("1000"));

  console.log("\n--- Transfer NFT ---");
  const transferTx = await nft.connect(user2).buyNFTWithERC20(
    1,
    ethers.parseUnits("1000")
  );
  await transferTx.wait();
  console.log("Transferred tokenId 1 from user1 → user2");

  //   console.log("\n--- All Accounts ---");
  //   const accounts = await nft.getAllAccounts();
  //   console.log(`Accounts are : ${accounts}`);


  //   console.log("\n--- NFTs of user2 ---");
  //   const balance2 = await nft.balanceOf(user2.address);
  //   const balance1 = await nft.balanceOf(user1.address);
  //   const balance3 = await nft.balanceOf(user3.address);
  //   console.log("user1 NFT balance:", balance1.toString());
  //   console.log("user2 NFT balance:", balance2.toString());
  //   console.log("user3 NFT balance:", balance3.toString());

  // console.log("CHECK FOR TOKEN TRANSFER: ", await nft.getAccountbyTokenId(1));

  //   console.log("\n--- ETH Transfer ---");
  //   beforeUser1 = await ethers.provider.getBalance(user1.address);
  //   beforeUser2 = await ethers.provider.getBalance(user2.address);
  //   beforeUser3 = await ethers.provider.getBalance(user3.address);

  //   console.log("User1 ETH balance before:", ethers.formatUnits(beforeUser1));
  //   console.log("User2 ETH balance before:", ethers.formatUnits(beforeUser2));
  //   console.log("User3 ETH balance before:", ethers.formatUnits(beforeUser3));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
