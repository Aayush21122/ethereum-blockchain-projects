// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ERC20Contract is ERC20, ERC20Permit {
    constructor() ERC20("Pedalsup", "PUP") ERC20Permit("Pedalsup") {}

    mapping(address => uint256) public mintableAccounts;
    address[] public accounts;

    function mintable(address to, uint256 amount) public {
        _mint(to, amount);
        mintableAccounts[to] += amount;
        accounts.push(to);
    }

    function mintToSender(uint256 amount) public {
        _mint(msg.sender, amount);
        mintableAccounts[msg.sender] += amount;
        accounts.push(msg.sender);
    }

    function balanceOfAccount(address account) public view returns (uint256) {
        return mintableAccounts[account];
    }

    function getAllAccounts() public view returns (address[] memory) {
        return accounts;
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }
}
