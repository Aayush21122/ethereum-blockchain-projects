// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICustomERC20 is IERC20 {
    function mint(address to, uint256 amount) external;

    function tokenTransfer(address from, address to, uint256 amount) external;
}
