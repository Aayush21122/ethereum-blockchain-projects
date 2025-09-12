// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract PedalsupNFT is ERC721, Ownable, ERC721Enumerable {
    uint256 private _nextTokenId;
    mapping(uint256 => address) private minters;

    constructor() ERC721("PedalsupNFT", "PUPNFT") Ownable(msg.sender) {}

    function safeMint(address to) external returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        minters[tokenId] = to;
        return tokenId;
    }

    function getAccountbyTokenId(
        uint256 tokenId
    ) public view returns (address) {
        return minters[tokenId];
    }

    // Required overrides for multiple inheritance
    function _increaseBalance(
        address account,
        uint128 amount
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
