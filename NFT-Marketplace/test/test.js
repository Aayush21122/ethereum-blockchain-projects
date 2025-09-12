const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", async () => {
    let nft, marketplace;
    let admin, minter, user, user2;
    let listingId, listingId2, listingId3;
    let nftMetadata;

    before(async () => {
        [admin, minter, user, user2] = await ethers.getSigners();

        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy();
        await nft.deployed();
        console.log("NFT deployed to:", nft.address);

        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy(nft.address, [admin.address, minter.address]);
        await marketplace.deployed();
        console.log("Marketplace deployed to:", marketplace.address);

        // Set Marketplace contract address in NFT contract
        await nft.setMarketplaceAddress(marketplace.address);
    });

    it("should allow admin to add a new admin", async () => {
        const tx = await marketplace.connect(admin).addAdmin(user.address);
        await tx.wait();
        const isAdmin = await marketplace.isAdmin(user.address);
        expect(isAdmin).to.be.true;

        const allAdmins = await marketplace.getAllAdmins();
        console.log("allAdmins", allAdmins);
    });

    it("should not allow non-admin to add a new admin", async () => {
        await expect(
            marketplace.connect(user2).addAdmin(user2.address)
        ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should allow admin to remove an admin", async () => {
        const tx = await marketplace.connect(admin).removeAdmin(user.address);
        await tx.wait();
        const isAdmin = await marketplace.isAdmin(user.address);
        expect(isAdmin).to.be.false;
    });

    it("should not allow non-admin to remove an admin", async () => {
        await expect(
            marketplace.connect(user2).removeAdmin(user2.address)
        ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should allow admin to add genre", async () => {
        const tx = await marketplace.connect(admin).addGenre("Genre 1");
        await tx.wait();
        const genre = await marketplace.genres(0);
        expect(genre).to.equal("Genre 1");
    });

    it("should not allow non-admin to add genre", async () => {
        await expect(
            marketplace.connect(user).addGenre("Genre 2")
        ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should allow admin to add keymood", async () => {
        const tx = await marketplace.connect(admin).addKeyMood("Keymood 1");
        await tx.wait();
        const keymood = await marketplace.keyMoods(0);
        expect(keymood).to.equal("Keymood 1");
    });

    it("should not allow non-admin to add keymood", async () => {
        await expect(
            marketplace.connect(user).addKeyMood("Keymood 2")
        ).to.be.revertedWith("Only admin can perform this action");
    });

    it("should allow marketplace admin to mint and list an NFT", async () => {
        nftMetadata = {
            amount: 10,
            price: ethers.utils.parseEther("1"),
            title: "Title",
            creatorName: "Creator Name",
            creatorImageHash: "Creator Image",
            royalty: 5,
            keyMood: "Keymood 1",
            genre: "Genre 1",
            description: "Description",
            resourceType: 2,
            nftURI: "https://example.com",
            nftType: 0, // Simple
            latitude: "0",
            longitude: "0",
            radius: "0",
            productHashes: ["", "", ""],
        };

        // check if minter is admin
        const isAdmin = await marketplace.isAdmin(minter.address);
        expect(isAdmin).to.be.true;

        const tx = await marketplace.connect(minter).mintAndListNFT(nftMetadata);
        console.log("tx", tx);
        const receipt = await tx.wait();

        // Retrieve the new tokenId from the emitted event
        const event = receipt.events.find(event => event.event === "NFTListed");
        listingId = event.args.listingId;

        const listing = await marketplace.getListingDetails(listingId);
        expect(listing.nftContract).to.equal(nft.address);
        expect(listing.amount).to.equal(nftMetadata.amount);
        expect(listing.price).to.equal(nftMetadata.price);
    });

    it("should not allow non-admin to mint and list an NFT", async () => {
        await nft.connect(user).setApprovalForAll(marketplace.address, true);

        const isAdmin = await marketplace.isAdmin(user.address);
        expect(isAdmin).to.be.false;

        await expect(
            marketplace.connect(user).mintAndListNFT(nftMetadata)
        ).to.be.revertedWith("Only admin can perform this action");
    })

    it("should allow owner of listing to delist the nft", async () => {
        // First, mint and list a new NFT
        let nftMetadata2 = {
            amount: 5,
            price: ethers.utils.parseEther("2"),
            title: "Title 2",
            creatorName: "Creator Name 2",
            creatorImageHash: "Creator Image 2",
            royalty: 5,
            keyMood: "Keymood 2",
            genre: "Genre 2",
            description: "Description 2",
            resourceType: 0,
            nftURI: "https://example2.com",
            nftType: 0,
            latitude: "0",
            longitude: "0",
            radius: "13.4",
            productHashes: ["", "", ""],
        };

        await marketplace.connect(admin).addGenre("Genre 2")
        await marketplace.connect(admin).addKeyMood("Keymood 2")

        await nft.connect(minter).setApprovalForAll(marketplace.address, true);
        let tx2 = await marketplace.connect(minter).mintAndListNFT(nftMetadata2);
        const receipt = await tx2.wait();

        // Retrieve the new tokenId from the emitted event
        const event = receipt.events.find(event => event.event === "NFTListed");
        listingId2 = event.args.listingId;

        let delisting = await marketplace.connect(minter).delistNFT(listingId2);

        await expect(delisting)
            .to.emit(marketplace, "NFTDelisted")
            .withArgs(listingId2, minter.address);

        const listing = await marketplace.getListingDetails(listingId2);
        expect(listing.price).to.equal(nftMetadata2.price);
    });

    it("should not allow non-owner to delist an NFT", async () => {
        await expect(
            marketplace.connect(user).delistNFT(listingId2)
        ).to.be.revertedWith("Only the owner can delist");
    });

    it("should not allow user to buy an NFT if price is not equal to listing price", async () => {
        let nftMetadata3 = {
            amount: 50,
            price: ethers.utils.parseEther("3"),
            title: "Title 3",
            creatorName: "Creator Name 3",
            creatorImageHash: "Creator Image 3",
            royalty: 5,
            keyMood: "Keymood 3",
            genre: "Genre 3",
            description: "Description 3",
            resourceType: 1,
            nftURI: "https://example3.com",
            nftType: 1,
            latitude: "12",
            longitude: "56",
            radius: "10",
            productHashes: ["qwe", "asd", "zxc"],
        };

        await marketplace.connect(admin).addGenre("Genre 3")
        await marketplace.connect(admin).addKeyMood("Keymood 3")

        await nft.connect(minter).setApprovalForAll(marketplace.address, true);
        let tx = await marketplace.connect(minter).mintAndListNFT(nftMetadata3);
        const receipt = await tx.wait();

        // Retrieve the new tokenId from the emitted event
        const event = receipt.events.find(event => event.event === "NFTListed");
        listingId3 = event.args.listingId;

        await nft.connect(user).setApprovalForAll(marketplace.address, true);
        await expect(
            marketplace.connect(user).buyNFT(listingId3, 3, { value: ethers.utils.parseEther("2") })
        ).to.be.revertedWith("Price not equal to the listing price");
    });

    it("should not allow user to buy it's own NFT", async () => {
        await expect(
            marketplace.connect(minter).buyNFT(listingId3, 3, { value: ethers.utils.parseEther("3") })
        ).to.be.revertedWith("Owner cannot buy their own NFT");
    });

    it("should allow user to buy an NFT", async () => {
        const tx = await marketplace.connect(user).buyNFT(listingId3, 10, { value: ethers.utils.parseEther("30") });
        const receipt = await tx.wait();
        const newListingId = receipt.events.find(event => event.event === "NFTSold").args[0];
        console.log("newListingId", newListingId);

        const listing = await marketplace.getListingDetails(listingId3);
        expect(listing.amountSold).to.equal(10);
        expect(listing.price).to.equal(ethers.utils.parseEther("3"));
    });

    it("should allow nft buyer to relist NFT", async () => {
        await nft.connect(user).setApprovalForAll(marketplace.address, true);

        const details = await marketplace.getListingDetails(4);
        // console.log("details", details);

        const tx = await marketplace.connect(user).reListNft(4, 5, ethers.utils.parseEther("4"));
        // Retrieve the new listing ID from the event emitted during relisting
        const receipt = await tx.wait();
        const newListingId = receipt.events.find(event => event.event === "NFTListed").args[0];
        console.log("newListingId", newListingId);

        const listing = await marketplace.getListingDetails(newListingId);
        expect(listing.price).to.equal(ethers.utils.parseEther("4"));

        const tx2 = await marketplace.connect(user).reListNft(4, 1, ethers.utils.parseEther("9"));
        const receipt2 = await tx2.wait();
        const newListingId2 = receipt2.events.find(event => event.event === "NFTListed").args[0];
        console.log("newListingId2", newListingId2);
    });

    it("should not allow other user to relist NFT", async () => {
        await expect(marketplace.connect(user2).reListNft(4, 5, ethers.utils.parseEther("4"))).to.be.revertedWith("Only NFT owner can relist")
    });

    it("should not allow user to relist NFT if NFT is already listed", async () => {
        await expect(
            marketplace.connect(user).reListNft(listingId, 5, ethers.utils.parseEther("4"))
        ).to.be.revertedWith("NFT already listed!");
    });

    it("should allow user to buy relisted NFT", async () => {
        let details = await marketplace.getListingDetails(5);
        // console.log("details", details);

        await marketplace.connect(user2).buyNFT(5, 2, { value: ethers.utils.parseEther("8") });
        const listing = await marketplace.getListingDetails(5);
        expect(listing.amount).to.equal(3);
        expect(listing.amountSold).to.equal(2);
        expect(listing.price).to.equal(ethers.utils.parseEther("4"));
    });

    it("should get all the user nfts", async () => {
        let userNfts = await marketplace.connect(user).getUserNfts(user.address);
        // console.log("userNfts", userNfts);

        let user2Nfts = await marketplace.connect(user2).getUserNfts(user2.address);
        // console.log("user2Nfts", user2Nfts);

        let minterNfts = await marketplace.connect(minter).getUserNfts(minter.address);
        // console.log("minterNfts", minterNfts);

        let phygitalNfts = await marketplace.getListedPhygitalNFTs(false);
        console.log("phygitalNfts", phygitalNfts);

        let simpleNfts = await marketplace.getListedSimpleNFTs(false);
        console.log("simpleNfts", simpleNfts);

        // change the visibility of the nft
        await marketplace.connect(admin).changeVisibility(1, false);
        await marketplace.connect(admin).changeVisibility(5, false);

        let phygitalNfts2 = await marketplace.getListedPhygitalNFTs(true);
        console.log("phygitalNfts", phygitalNfts2);

        let simpleNfts2 = await marketplace.getListedSimpleNFTs(true);
        console.log("simpleNfts", simpleNfts2);
    });

    it("should allow admin to remove genre", async () => {
        await marketplace.connect(admin).addGenre("Genre 4");
        const allGenres = await marketplace.getGenres();
        console.log("allGenres", allGenres);

        const allKeymoods = await marketplace.getKeyMoods();
        console.log("allKeymoods", allKeymoods);

        const tx = await marketplace.connect(admin).removeGenre("Genre 4");
        await tx.wait();
        await expect(marketplace.genres(3)).to.be.reverted;
    });
});
