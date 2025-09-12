const { expect } = require("chai");
const { ethers } = require("hardhat");
const { main } = require("../scripts/deploy.js");

describe("ERC1155 Marketplace", async () => {
  let erc1155, erc20, marketPlace;
  let owner, user1, user2, user3;
  let listingId;
  const tokenId = 1;
  const mintAmount = 1;

  before(async () => {
    const deployed = await main();
    erc20 = deployed.erc20;
    marketPlace = deployed.marketPlaceInstance;
    erc1155 = deployed.erc1155;
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it("should mint ERC20 to user1", async () => {
    await erc20.mint(user1.address, ethers.parseUnits("1000"));
    expect(await erc20.balanceOf(user1.address)).to.equal(ethers.parseUnits("1000"));
  });

  it("should mint ERC1155 token (1 unit) to user1", async () => {
    await erc1155.mint(user1.address, tokenId, mintAmount, "0x");
    expect(await erc1155.balanceOf(user1.address, tokenId)).to.equal(mintAmount);
  });

  it("should revert when non-owner tries to list (Not enough erc1155 balance)", async () => {
    await expect(
      marketPlace.connect(user2).ETHListing(erc1155.target, tokenId, ethers.parseUnits("1000"), 0)
    ).to.be.revertedWith("Not enough erc1155 balance");
  });

  it("should revert when listing with zero price (ETH) when owner has token", async () => {
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    await expect(
      marketPlace.connect(user1).ETHListing(erc1155.target, tokenId, 0, 0)
    ).to.be.revertedWith("Price must be greater than zero");
  });

  it("should let owner list ERC1155 token for ETH", async () => {
    const tx = await marketPlace.connect(user1).ETHListing(
      erc1155.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receipt = await tx.wait();

    const ev = receipt.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");

    listingId = ev.args[0];
    const listing = await marketPlace.getPriceofListedNFTForETH(listingId);
    expect(listing.price).to.equal(ethers.parseUnits("1000"));
    expect(listing.isRemoved).to.equal(false);
    expect(listing.isSold).to.equal(false);
  });

  it("should revert buying with incorrect ETH (Incorrect price)", async () => {
    await expect(
      marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("500") })
    ).to.be.revertedWith("Incorrect price");
  });

  it("should buy ERC1155 token with ETH", async () => {
    await marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") });

    expect(await erc1155.balanceOf(user2.address, tokenId)).to.equal(1);

    const listing = await marketPlace.getPriceofListedNFTForETH(listingId);
    expect(listing.isSold).to.equal(true);
  });

  it("should revert trying to buy an already sold ETH listing (transfer will fail)", async () => {
    await expect(
      marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") })
    ).to.be.reverted;
  });

  it("should revert when previous owner (user1) tries to list for ERC20 (Not enough erc1155 balance)", async () => {
    await expect(
      marketPlace.connect(user1).ERC20Listing(erc1155.target, erc20.target, tokenId, ethers.parseUnits("1000"), 0)
    ).to.be.revertedWith("Not enough erc1155 balance");
  });

  it("should revert due to price being 0", async () => {
    await expect(
      marketPlace.connect(user2).ERC20Listing(erc1155.target, erc20.target, tokenId, 0, 0)
    ).to.be.revertedWith("Price must be greater than zero");
  });

  it("should let current owner (user2) list ERC1155 token for ERC20", async () => {
    await erc1155.connect(user2).setApprovalForAll(marketPlace.target, true);

    const tx = await marketPlace.connect(user2).ERC20Listing(
      erc1155.target,
      erc20.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receipt = await tx.wait();

    const ev = receipt.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");

    listingId = ev.args[0];
    const listing = await marketPlace.getPriceofListedNFTForERC20(listingId);
    expect(listing.price).to.equal(ethers.parseUnits("1000"));
    expect(listing.isRemoved).to.equal(false);
    expect(listing.isSold).to.equal(false);
  });

  it("should revert buying with ERC20 if buyer has insufficient ERC20 balance", async () => {
    await erc20.connect(user3).approve(marketPlace.target, ethers.parseUnits("1000"));
    await expect(
      marketPlace.connect(user3).buyNFTWithERC20(listingId, ethers.parseUnits("1000"))
    ).to.be.revertedWith("Insufficient Balance");
  });

  it("should revert for trying to buy with incorrect price", async () => {
    await erc20.connect(user3).approve(marketPlace.target, ethers.parseUnits("500"));
    await expect(
      marketPlace.connect(user3).buyNFTWithERC20(listingId, ethers.parseUnits("500"))
    ).to.be.revertedWith("Incorrect price");
  });

  it("should revert when ERC20 allowance is too low (but buyer has balance)", async () => {
    expect(await erc20.balanceOf(user1.address)).to.equal(ethers.parseUnits("1000"));

    await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("500"));

    await expect(
      marketPlace.connect(user1).buyNFTWithERC20(listingId, ethers.parseUnits("1000"))
    ).to.be.reverted;
  });

  it("should buy ERC1155 token with ERC20 when allowance and balance are OK", async () => {
    await erc20.connect(user1).approve(marketPlace.target, ethers.parseUnits("1000"));
    await marketPlace.connect(user1).buyNFTWithERC20(listingId, ethers.parseUnits("1000"));

    const listing = await marketPlace.getPriceofListedNFTForERC20(listingId);
    expect(listing.isSold).to.equal(true);
  });

  it("should allow owner to remove an ETH listing and then buying that listing should revert", async () => {
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const txList = await marketPlace.connect(user1).ETHListing(
      erc1155.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receiptList = await txList.wait();
    const evList = receiptList.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");
    const removeListingId = evList.args[0];

    await expect(
      marketPlace.connect(user2).delistingETH(removeListingId)
    ).to.be.revertedWith("You are not the owner");

    await marketPlace.connect(user1).delistingETH(removeListingId);

    await expect(
      marketPlace.connect(user2).buyNFTWithETH(removeListingId, { value: ethers.parseUnits("1000") })
    ).to.be.reverted;
  });

  it("should check delayed availability for ETH listings", async () => {
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);
    const tx = await marketPlace.connect(user1).ETHListing(
      erc1155.target,
      tokenId,
      ethers.parseUnits("1000"),
      3600
    );
    const receipt = await tx.wait();
    const ev = receipt.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");
    const delayedListingId = ev.args[0];

    await expect(
      marketPlace.connect(user2).buyNFTWithETH(delayedListingId, { value: ethers.parseUnits("1000") })
    ).to.be.revertedWith("NFT not yet available for sell");

    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    await expect(
      marketPlace.connect(user2).buyNFTWithETH(delayedListingId, { value: ethers.parseUnits("1000") })
    ).to.not.be.reverted;
  });

  it("should revert with NFT not yet available for sell when ERC20 listing has delay", async () => {
    await erc1155.mint(user1.address, tokenId, 1, "0x");
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const tx = await marketPlace.connect(user1).ERC20Listing(
      erc1155.target,
      erc20.target,
      tokenId,
      ethers.parseUnits("1000"),
      3600
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.map(log => {
      try { return marketPlace.interface.parseLog(log); } catch { return null; }
    }).find(e => e && e.name === "ERC1155Listed");
    const erc20DelayedId = ev.args[0];

    await expect(
      marketPlace.connect(user2).buyNFTWithERC20(erc20DelayedId, ethers.parseUnits("1000"))
    ).to.be.revertedWith("NFT not yet available for sell");
  });

  it("should revert if non-owner tries to remove ERC20 listing", async () => {
    await erc1155.mint(user1.address, tokenId, 1, "0x");
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const tx = await marketPlace.connect(user1).ERC20Listing(
      erc1155.target,
      erc20.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.map(log => {
      try { return marketPlace.interface.parseLog(log); } catch { return null; }
    }).find(e => e && e.name === "ERC1155Listed");
    const erc20ListingId = ev.args[0];

    await expect(
      marketPlace.connect(user2).delistingERC20(erc20ListingId)
    ).to.be.revertedWith("You are not the owner");
  });

  it("should allow owner to remove ERC20 listing", async () => {
    await erc1155.mint(user1.address, tokenId, 1, "0x");
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const tx = await marketPlace.connect(user1).ERC20Listing(
      erc1155.target,
      erc20.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.map(log => {
      try { return marketPlace.interface.parseLog(log); } catch { return null; }
    }).find(e => e && e.name === "ERC1155Listed");
    const erc20ListingId = ev.args[0];

    const txRemove = await marketPlace.connect(user1).delistingERC20(erc20ListingId);
    const receiptRemove = await txRemove.wait();
    const evRemove = receiptRemove.logs.map(log => {
      try { return marketPlace.interface.parseLog(log); } catch { return null; }
    }).find(e => e && e.name === "ERC1155Removed");

    expect(evRemove.args[0]).to.equal(erc20ListingId);
    const listing = await marketPlace.getPriceofListedNFTForERC20(erc20ListingId);
    expect(listing.isRemoved).to.equal(true);
  });

  it("Revert for listing erc1155 twice", async () => {
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const txList = await marketPlace.connect(user1).ETHListing(
      erc1155.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receiptList = await txList.wait();
    const evList = receiptList.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");
    listingId = evList.args[0];

    await expect(
      marketPlace.connect(user1).ETHListing(
        erc1155.target,
        tokenId,
        ethers.parseUnits("1000"),
        0
      )
    ).to.be.revertedWith("Not enough erc1155 balance");
  });

  it("Revert for delisting same erc1155 twice", async () => {
    await marketPlace.connect(user1).delistingETH(listingId);
    await expect(
      marketPlace.connect(user1).delistingETH(listingId)
    ).to.be.revertedWith("NFT not listed for sell");
  });

  it("Revert for buying same erc1155 twice", async () => {
    await erc1155.connect(user1).setApprovalForAll(marketPlace.target, true);

    const txList = await marketPlace.connect(user1).ETHListing(
      erc1155.target,
      tokenId,
      ethers.parseUnits("1000"),
      0
    );
    const receiptList = await txList.wait();
    const evList = receiptList.logs
      .map((log) => { return marketPlace.interface.parseLog(log); })
      .find(e => e && e.name === "ERC1155Listed");
    listingId = evList.args[0];

    await marketPlace.connect(user2).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") });

    await expect(
      marketPlace.connect(user3).buyNFTWithETH(listingId, { value: ethers.parseUnits("1000") })
    ).to.be.revertedWith("NFT not listed for sell");
  });

});
