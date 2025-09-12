// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Pedalsup1155 is ERC1155, Ownable {
    constructor() ERC1155("") Ownable(msg.sender) {}

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
    {
        _mint(account, id, amount, data);
    }
}