// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MarketPlace {
    struct ListingForERC20 {
        address nftSeller;
        address nftAddress;
        uint256 tokenId;
        address erc20Address;
        uint256 price;
        uint256 timestamp;
        uint256 buyAfterInSeconds;
        bool isSold;
        bool isRemoved;
    }

    struct ListingForETH {
        address nftSeller;
        address nftAddress;
        uint256 tokenId;
        uint256 price;
        uint256 timestamp;
        uint256 buyAfterInSeconds;
        bool isSold;
        bool isRemoved;
    }

    event NFTListed(uint256 indexed listingId);
    event NFTRemoved(uint256 indexed listingId, bool isRemoved);

    mapping(uint256 => ListingForETH) private listingForETH;
    mapping(uint256 => ListingForERC20) private listingForERC20;
    mapping(address => mapping(uint256 => bool)) private isListed;
    uint256 private listingIdCounter;
    uint256 private royaltyFee = 10;
    address ownerAddress;

    constructor(address owner) {
        ownerAddress = owner;
    }

    function sellForERC20(
        address nftAddress,
        address erc20Address,
        uint256 tokenId,
        uint256 price,
        uint256 buyAfterInSeconds
    ) external {
        require(
            IERC721(nftAddress).ownerOf(tokenId) == msg.sender,
            "You are not the owner"
        );
        // require(!isListed[nftAddress][tokenId], "NFT is listed for sell");
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);
        listingForERC20[++listingIdCounter] = ListingForERC20({
            nftSeller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            erc20Address: erc20Address,
            price: price,
            isSold: false,
            isRemoved: false,
            timestamp: block.timestamp,
            buyAfterInSeconds: buyAfterInSeconds
        });
        isListed[nftAddress][tokenId] = true;

        emit NFTListed(listingIdCounter);
    }

    function removeFromSellingForERC20(uint256 listingId) external {
        ListingForERC20 memory listing = listingForERC20[listingId];
        require(
            isListed[listing.nftAddress][listing.tokenId],
            "There is no nft for selling"
        );
        require(listing.nftSeller == msg.sender, "You are not the owner");
        IERC721(listing.nftAddress).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );
        listingForERC20[listingId].isRemoved = true;
        delete isListed[listing.nftAddress][listing.tokenId];
        emit NFTRemoved(listingId, true);
    }

    function sellForETH(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        uint256 buyAfterInSeconds
    ) external {
        require(
            IERC721(nftAddress).ownerOf(tokenId) == msg.sender,
            "You are not the owner"
        );
        // require(!isListed[nftAddress][tokenId], "NFT is listed for sell");
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);
        listingForETH[++listingIdCounter] = ListingForETH({
            nftSeller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            price: price,
            isSold: false,
            isRemoved: false,
            timestamp: block.timestamp,
            buyAfterInSeconds: buyAfterInSeconds
        });

        isListed[nftAddress][tokenId] = true;

        emit NFTListed(listingIdCounter);
    }

    function removeFromSellingForETH(uint256 listingId) external {
        ListingForETH memory listing = listingForETH[listingId];
        require(
            isListed[listing.nftAddress][listing.tokenId],
            "There is no nft for selling"
        );
        require(listing.nftSeller == msg.sender, "You are not the owner");
        IERC721(listing.nftAddress).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );
        listingForETH[listingId].isRemoved = true;
        delete isListed[listing.nftAddress][listing.tokenId];
        emit NFTRemoved(listingId, true);
    }

    function getPriceofListedNFTForETH(
        uint256 listingId
    ) external view returns (ListingForETH memory) {
        return listingForETH[listingId];
    }

    function getPriceofListedNFTForERC20(
        uint256 listingId
    ) external view returns (ListingForERC20 memory) {
        return listingForERC20[listingId];
    }

    function buyNFTWithETH(uint256 listingId) external payable {
        ListingForETH memory listing = listingForETH[listingId];
        require(
            isListed[listing.nftAddress][listing.tokenId],
            "NFT not for sell"
        );
        require(
            (listing.timestamp + listing.buyAfterInSeconds) <= block.timestamp,
            "NFT not yet available for sell"
        );
        require(msg.value == listing.price, "Incorrect price");
        require(
            address(msg.sender).balance > listing.price,
            "Insufficient Balance"
        );

        uint256 fee = (msg.value * royaltyFee) / 100;
        uint256 sellerAmount = msg.value - fee;

        address seller = listing.nftSeller;

        IERC721(listing.nftAddress).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        listingForETH[listingId].isSold = true;
        delete isListed[listing.nftAddress][listing.tokenId];

        (bool sentToSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(sentToSeller, "Payment failed");

        (bool sentToDeployer, ) = payable(ownerAddress).call{value: fee}("");
        require(sentToDeployer, "Payment failed");
    }

    function buyNFTWithERC20(uint256 listingId, uint256 amount) external {
        ListingForERC20 memory listing = listingForERC20[listingId];
        require(
            isListed[listing.nftAddress][listing.tokenId],
            "NFT not for sell"
        );
        require(
            (listing.timestamp + listing.buyAfterInSeconds) <= block.timestamp,
            "NFT not yet available for sell"
        );
        require(amount == listing.price, "Incorrect price");
        require(
            IERC20(listing.erc20Address).balanceOf(msg.sender) >= amount,
            "Insufficient Balance"
        );

        uint256 fee = (amount * royaltyFee) / 100;
        uint256 sellerAmount = amount - fee;

        address seller = listing.nftSeller;

        IERC721(listing.nftAddress).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        listingForERC20[listingId].isSold = true;

        delete isListed[listing.nftAddress][listing.tokenId];

        IERC20(listing.erc20Address).transferFrom(
            msg.sender,
            seller,
            sellerAmount
        );

        IERC20(listing.erc20Address).transferFrom(
            msg.sender,
            ownerAddress,
            fee
        );
    }
}
