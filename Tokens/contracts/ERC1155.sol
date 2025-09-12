// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Contract is ERC1155 {
    constructor() ERC1155("") {}

    mapping(address => mapping(uint256 => uint256)) public mintableAccounts;
    address[] public accounts;

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _mint(account, id, amount, data);
        mintableAccounts[account][id] += amount;
        accounts.push(account);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            mintableAccounts[to][ids[i]] += amounts[i];
        }
        accounts.push(to);
    }

    function getMintableAmount(
        address account,
        uint256 id
    ) public view returns (uint256) {
        return mintableAccounts[account][id];
    }

    function getAllAccounts() public view returns (address[] memory) {
        return accounts;
    }
}
