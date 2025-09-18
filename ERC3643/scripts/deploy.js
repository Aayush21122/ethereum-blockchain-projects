const { ethers } = require("hardhat");

async function main() {
    [owner, issuer, user1, user2, user3, user4, user5] = await ethers.getSigners();

    IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
    registry = await IdentityRegistryFactory.connect(owner).deploy();
    await registry.waitForDeployment();

    ComplianceFactory = await ethers.getContractFactory("Compliance");
    compliance = await ComplianceFactory.connect(owner).deploy(registry.target, owner.address);
    await compliance.waitForDeployment();

    TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.connect(owner).deploy(
      "Test Token",
      "TTN",
      registry.target,
      compliance.target
    );
    await token.waitForDeployment();

    return { registry, compliance, token };
}

module.exports = { main };