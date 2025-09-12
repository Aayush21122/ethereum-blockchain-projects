// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Pedalsup is ERC20, Ownable, ERC20Permit {
    constructor()
        ERC20("Pedalsup", "PUP")
        Ownable(msg.sender)
        ERC20Permit("Pedalsup")
    {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
