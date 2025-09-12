// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "./IdentityRegistry.sol";
import "./OnchainId.sol";

contract Compliance {
    IdentityRegistry public identityRegistry;

    address public owner;

    mapping(address => bool) public frozen;

    event Frozen(address indexed user);
    event Unfrozen(address indexed user);

    constructor(address _identityRegistry, address _owner) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function freeze(address user) external onlyOwner {
        require(!frozen[user], "User already frozen");
        frozen[user] = true;
        emit Frozen(user);
    }

    function unfreeze(address user) external onlyOwner {
        require(frozen[user], "User not frozen");
        frozen[user] = false;
        emit Unfrozen(user);
    }

    function canTransfer(
        address from,
        address to
    ) external view returns (bool) {
        if (frozen[from] || frozen[to]) return false;

        address fromId = identityRegistry.getIdentity(from);
        address toId = identityRegistry.getIdentity(to);

        if (fromId == address(0) || toId == address(0)) {
            return false;
        }

        OnchainID fromIdentity = OnchainID(fromId);
        OnchainID toIdentity = OnchainID(toId);

        OnchainID.Claim memory fromKyc = fromIdentity.getClaim(
            keccak256("KYC")
        );
        OnchainID.Claim memory toKyc = toIdentity.getClaim(keccak256("KYC"));

        if (keccak256(bytes(fromKyc.value)) != keccak256("true")) return false;
        if (keccak256(bytes(toKyc.value)) != keccak256("true")) return false;

        return true;
    }

    function canMint(address to) external view returns (bool) {
        if (frozen[to]) return false;

        address toId = identityRegistry.getIdentity(to);
        if (toId == address(0)) {
            return false;
        } else {
            OnchainID toIdentity = OnchainID(toId);
            OnchainID.Claim memory toKyc = toIdentity.getClaim(
                keccak256("KYC")
            );
            if (keccak256(bytes(toKyc.value)) != keccak256("true"))
                return false;

            return true;
        }
    }
}
