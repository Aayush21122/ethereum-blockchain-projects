// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "./OnchainId.sol";

contract IdentityRegistry {
    mapping(address => address) public identities;

    event IdentityDeployed(address indexed wallet, address onchainId);

    function registerIdentity(address wallet) external returns (address) {
        require(wallet == msg.sender, "Can only register your own identity");
        require(identities[wallet] == address(0), "Identity already exists");

        OnchainID identity = new OnchainID(wallet);

        identities[wallet] = address(identity);

        emit IdentityDeployed(wallet, address(identity));

        return address(identity);
    }

    function getIdentity(address wallet) external view returns (address) {
        return identities[wallet];
    }
}
