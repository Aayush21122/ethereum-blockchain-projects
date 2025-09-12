// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

contract OnchainID {
    address public owner;

    struct Claim {
        bytes32 claimType;
        string value;
        address issuer;
    }

    mapping(bytes32 => Claim) public claims;

    mapping(address => bool) trustedIssuers;

    event ClaimAdded(bytes32 indexed claimType, string value, address indexed issuer);
    event ClaimRemoved(bytes32 indexed claimType, address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(trustedIssuers[msg.sender], "Not trusted issuer");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function addClaim(bytes32 claimType, string calldata value) external onlyIssuer {
        require(claims[claimType].issuer == address(0), "Claim already exists");
        claims[claimType] = Claim(claimType, value, msg.sender);
        emit ClaimAdded(claimType, value, msg.sender);
    }

    function removeClaim(bytes32 claimType) external onlyIssuer {
        require(claims[claimType].issuer == msg.sender, "Claim does not exist");
        delete claims[claimType];
        emit ClaimRemoved(claimType, msg.sender);
    }

    function addIssuer(address issuer) external onlyOwner {
        require(!trustedIssuers[issuer], "Issuer already trusted");
        trustedIssuers[issuer] = true;
    }

    function removeIssuer(address issuer) external onlyOwner {
        require(trustedIssuers[issuer], "Issuer not trusted");
        trustedIssuers[issuer] = false;
    }

    function getClaim(bytes32 claimType) external view returns (Claim memory) {
        return claims[claimType];
    }
}
