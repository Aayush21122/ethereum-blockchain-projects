// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract MarketPlace is ERC1155Holder {
    struct ListingForERC20 {
        address nftSeller;
        address erc1155Address;
        uint256 tokenId;
        address erc20Address;
        uint256 price;
        uint256 timestamp;
        uint256 buyAfterInSeconds;
        bool isListed;
        bool isSold;
        bool isRemoved;
    }

    struct ListingForETH {
        address nftSeller;
        address erc1155Address;
        uint256 tokenId;
        uint256 price;
        uint256 timestamp;
        uint256 buyAfterInSeconds;
        bool isListed;
        bool isSold;
        bool isRemoved;
    }

    event ERC1155Listed(uint256 indexed listingId);
    event ERC1155Removed(uint256 indexed listingId, bool isRemoved);

    mapping(uint256 => ListingForETH) private listingForETH;
    mapping(uint256 => ListingForERC20) private listingForERC20;

    uint256 private listingIdCounter;
    uint256 private royaltyFee = 10;
    address ownerAddress;

    constructor(address owner) {
        ownerAddress = owner;
    }

    function ERC20Listing(
        address erc1155Address,
        address erc20Address,
        uint256 tokenId,
        uint256 price,
        uint256 buyAfterInSeconds
    ) external {
        require(
            IERC1155(erc1155Address).balanceOf(msg.sender, tokenId) == 1,
            "Not enough erc1155 balance"
        );

        require(price > 0, "Price must be greater than zero");

        listingForERC20[++listingIdCounter] = ListingForERC20({
            nftSeller: msg.sender,
            erc1155Address: erc1155Address,
            tokenId: tokenId,
            erc20Address: erc20Address,
            price: price,
            isSold: false,
            isRemoved: false,
            isListed: true,
            timestamp: block.timestamp,
            buyAfterInSeconds: buyAfterInSeconds
        });

        IERC1155(erc1155Address).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            1,
            "0x"
        );

        emit ERC1155Listed(listingIdCounter);
    }

    function delistingERC20(uint256 listingId) external {
        ListingForERC20 memory listing = listingForERC20[listingId];
        require(listing.isListed, "NFT not listed for sell");
        require(listing.nftSeller == msg.sender, "You are not the owner");
        listingForERC20[listingId].isListed = false;
        listingForERC20[listingId].isRemoved = true;

        IERC1155(listing.erc1155Address).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            1,
            "0x"
        );
        emit ERC1155Removed(listingId, true);
    }

    function ETHListing(
        address erc1155Address,
        uint256 tokenId,
        uint256 price,
        uint256 buyAfterInSeconds
    ) external {
        require(
            IERC1155(erc1155Address).balanceOf(msg.sender, tokenId) == 1,
            "Not enough erc1155 balance"
        );
        require(price > 0, "Price must be greater than zero");

        listingForETH[++listingIdCounter] = ListingForETH({
            nftSeller: msg.sender,
            erc1155Address: erc1155Address,
            tokenId: tokenId,
            price: price,
            isSold: false,
            isRemoved: false,
            isListed: true,
            timestamp: block.timestamp,
            buyAfterInSeconds: buyAfterInSeconds
        });

        IERC1155(erc1155Address).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            1,
            "0x"
        );

        emit ERC1155Listed(listingIdCounter);
    }

    function delistingETH(uint256 listingId) external {
        ListingForETH memory listing = listingForETH[listingId];
        require(listing.isListed, "NFT not listed for sell");
        require(listing.nftSeller == msg.sender, "You are not the owner");

        listingForETH[listingId].isRemoved = true;
        listingForETH[listingId].isListed = false;

        IERC1155(listing.erc1155Address).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            1,
            "0x"
        );
        emit ERC1155Removed(listingId, true);
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
        require(listing.isListed, "NFT not listed for sell");
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

        listingForETH[listingId].isSold = true;
        listingForETH[listingId].isListed = false;

        (bool sentToSeller, ) = payable(seller).call{value: sellerAmount}("0x");
        require(sentToSeller, "Payment failed");

        (bool sentToDeployer, ) = payable(ownerAddress).call{value: fee}("0x");
        require(sentToDeployer, "Payment failed");

        IERC1155(listing.erc1155Address).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            1,
            "0x"
        );
    }

    function buyNFTWithERC20(uint256 listingId, uint256 amount) external {
        ListingForERC20 memory listing = listingForERC20[listingId];
        require(listing.isListed, "NFT not listed for sell");
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

        listingForERC20[listingId].isSold = true;
        listingForERC20[listingId].isListed = false;

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

        IERC1155(listing.erc1155Address).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            1,
            "0x"
        );
    }
}
