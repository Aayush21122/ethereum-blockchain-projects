// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ICustomERC721 is IERC721 {
    function safeMint(address to) external returns (uint256);

    function nftTransfer(address from, address to, uint256 tokenId) external;
}
