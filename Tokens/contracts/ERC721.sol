// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ERC721Contract is ERC721, ERC721URIStorage {
    uint256 private _tokenIds;
    mapping(address => mapping(uint256 => string)) public mintableAccounts;
    address[] public accounts;

    constructor() ERC721("PedalsupNFT", "PUPNFT") {}

    function mintNFT(
        address recipient,
        string memory tokenURI
    ) public returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        mintableAccounts[recipient][newItemId] = tokenURI;
        accounts.push(recipient);
        return newItemId;
    }

    function mintNFTToSender(string memory tokenURI) public returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        mintableAccounts[msg.sender][newItemId] = tokenURI;
        accounts.push(msg.sender);
        return newItemId;
    }

    function metaDataOfNFT(
        address account,
        uint256 itemId
    ) public view returns (string memory) {
        return mintableAccounts[account][itemId];
    }

    function getAllAccounts() public view returns (address[] memory) {
        return accounts;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
