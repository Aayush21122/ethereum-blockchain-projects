const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC3643 Style Token System", function () {
  let OnchainIDFactory, IdentityRegistryFactory, ComplianceFactory, TokenFactory;
  let registry, compliance, token;
  let owner, issuer, user1, user2, user3, user4, user5, user4Id;

  before(async () => {
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

    await registry.connect(user1).registerIdentity(user1.address);
    await registry.connect(user2).registerIdentity(user2.address);
    await registry.connect(user4).registerIdentity(user4.address);

    OnchainIDFactory = await ethers.getContractFactory("OnchainID");

    const kycType = ethers.keccak256(ethers.toUtf8Bytes("KYC"));

    const user1IdAddr = await registry.getIdentity(user1.address);
    const user1Id = OnchainIDFactory.attach(user1IdAddr);
    await user1Id.connect(user1).addIssuer(issuer.address);
    await user1Id.connect(issuer).addClaim(kycType, "true");

    const user2IdAddr = await registry.getIdentity(user2.address);
    const user2Id = OnchainIDFactory.attach(user2IdAddr);
    await user2Id.connect(user2).addIssuer(issuer.address);
    await user2Id.connect(issuer).addClaim(kycType, "true");
    const user4IdAddr = await registry.getIdentity(user4.address);
    user4Id = OnchainIDFactory.attach(user4IdAddr);
  });

  it("Should revert due to non-owner trying to add issuer or non-issuer trying to add claim", async () => {
    const kycType = ethers.keccak256(ethers.toUtf8Bytes("KYC"));
    await expect(user4Id.connect(user3).addIssuer(issuer.address)).to.be.revertedWith("Not owner");
    await expect(user4Id.connect(user4).addClaim(kycType, "true")).to.be.revertedWith("Not trusted issuer");
    await user4Id.connect(user4).addIssuer(issuer.address);
    await user4Id.connect(issuer).addClaim(kycType, "true");
  });

  it("Should revert due to adding same issuer twice", async () => {
    await expect(user4Id.connect(user4).addIssuer(issuer.address)).to.be.revertedWith("Issuer already trusted");
  });

  it("Should revert due to adding same claim twice", async () => {
    const kycType = ethers.keccak256(ethers.toUtf8Bytes("KYC"));
    await expect(user4Id.connect(issuer).addClaim(kycType, "true")).to.be.revertedWith("Claim already exists");
  });

  it("Should revert due to removing non-existing issuer or claim", async () => {
    const nonExistentClaimType = ethers.keccak256(ethers.toUtf8Bytes("NON_EXISTENT_CLAIM"));
    await expect(user4Id.connect(issuer).removeClaim(nonExistentClaimType)).to.be.revertedWith("Claim does not exist");
    await expect(user4Id.connect(user4).removeIssuer(user3.address)).to.be.revertedWith("Issuer not trusted");
  });

  it("Should allow removing existing issuer and claim", async () => {
    const kycType = ethers.keccak256(ethers.toUtf8Bytes("KYC"));
    await user4Id.connect(issuer).removeClaim(kycType);
    await expect(user4Id.connect(issuer).removeClaim(kycType)).to.be.revertedWith("Claim does not exist");
    await user4Id.connect(issuer).addClaim(kycType, "true");
  });

  it("Should revert due to user is trying to register other user", async () => {
    await expect(registry.connect(user1).registerIdentity(user2.address)).to.be.revertedWith("Can only register your own identity");
  });

  it("Should revert due to user is trying to register twice", async () => {
    await expect(registry.connect(user1).registerIdentity(user1.address)).to.be.revertedWith("Identity already exists");
  });

  it("should revert due to non-compliance (Unregistered user)", async () => {
    await expect(token.connect(owner).mint(await user5.address, ethers.parseUnits("1000"))).to.be.revertedWith("Mint not compliant");
  });

  it("should revert due to non-compliance (Frozen account)", async () => {
    await compliance.connect(owner).freeze(await user1.address);
    await expect(token.connect(owner).mint(await user1.address, ethers.parseUnits("1000"))).to.be.revertedWith("Mint not compliant");
  });

  it("Should revert when non owner trying to mint tokens", async () => {
    await expect(token.connect(user1).mint(await user1.address, ethers.parseUnits("1000"))).to.be.revertedWith("Not owner");
  });

  it("should mint tokens to a verified user", async () => {
    await compliance.connect(owner).unfreeze(await user1.address);
    await token.connect(owner).mint(await user1.address, ethers.parseUnits("1000"));
    expect(await token.balanceOf(await user1.address)).to.equal(ethers.parseUnits("1000"));
  });

  it("should transfer tokens between verified users", async () => {
    await token.connect(user1).transfer(await user2.address, ethers.parseUnits("500"));

    expect(await token.balanceOf(await user1.address)).to.equal(ethers.parseUnits("500"));
    expect(await token.balanceOf(await user2.address)).to.equal(ethers.parseUnits("500"));
  });

  it("should fail transfer if recipient is not registered or not KYC'd", async () => {
    await token.connect(owner).mint(await user1.address, ethers.parseUnits("1000"));
    await expect(token.connect(user1).transfer(await user3.address, ethers.parseUnits("100"))).to.be.revertedWith("Transfer not compliant");
  });

  it("should fail transfer if amount is zero", async () => {
    await expect(token.connect(user1).transfer(await user2.address, 0)).to.be.revertedWith("Amount must be greater than zero");
  });

  it("should fail transfer if sender has insufficient balance", async () => {
    await expect(token.connect(user3).transfer(await user1.address, ethers.parseUnits("100"))).to.be.revertedWith("Insufficient balance");
  });

  it("should fail transfer if recipient is frozen, and succeed after unfreeze", async () => {
    await compliance.connect(owner).freeze(await user2.address);
    await expect(token.connect(user1).transfer(await user2.address, ethers.parseUnits("100"))).to.be.revertedWith("Transfer not compliant");

    await compliance.connect(owner).unfreeze(await user2.address);
    await token.connect(user1).transfer(await user2.address, ethers.parseUnits("100"));
    expect(await token.balanceOf(await user2.address)).to.equal(ethers.parseUnits("600"));
  });

  it("Should revert when trying to unfreeze a non-frozen account", async () => {
    await expect(compliance.connect(owner).unfreeze(await user3.address)).to.be.revertedWith("User not frozen");
  });

  it("Should revert when trying to freeze a frozen account", async () => {
    await compliance.connect(owner).freeze(await user3.address);
    await expect(compliance.connect(owner).freeze(await user3.address)).to.be.revertedWith("User already frozen");
    await compliance.connect(owner).unfreeze(await user3.address);
  });

  it("Should revert when non owner trying to freeze or unfreeze an account", async () => {
    await expect(compliance.connect(user3).freeze(await user3.address)).to.be.revertedWith("Not owner");
    await expect(compliance.connect(user3).unfreeze(await user3.address)).to.be.revertedWith("Not owner");
  });

  it("should allow burn of user tokens", async () => {
    const kycType = ethers.keccak256(ethers.toUtf8Bytes("KYC"));
    await registry.connect(user3).registerIdentity(user3.address);
    const user3IdAddr = await registry.getIdentity(user3.address);
    const user3Id = OnchainIDFactory.attach(user3IdAddr);
    await user3Id.connect(user3).addIssuer(issuer.address);
    await user3Id.connect(issuer).addClaim(kycType, "true");
    await token.connect(owner).mint(await user3.address, ethers.parseUnits("1000"));
    await token.connect(user3).burn(ethers.parseUnits("400"));
    expect(await token.balanceOf(await user3.address)).to.equal(ethers.parseUnits("600"));
  });

  it("Should revert when trying to burn more than balance", async () => {
    await expect(token.connect(user3).burn(ethers.parseUnits("700"))).to.be.revertedWith("Insufficient balance to burn");
  });

  it("Should revert when trying to approve zero amount", async () => {
    await expect(token.connect(user2).approve(await user4.address, 0)).to.be.revertedWith("Amount must be greater than zero");
  });

  it("should handle approve and transferFrom", async () => {
    await token.connect(owner).mint(await user4.address, ethers.parseUnits("1000"));

    await token.connect(user4).approve(await user2.address, ethers.parseUnits("200"));

    await token.connect(user2).transferFrom(await user4.address, await user2.address, ethers.parseUnits("200"));

    expect(await token.balanceOf(await user2.address)).to.equal(ethers.parseUnits("800"));
    expect(await token.allowance(await user4.address, await user2.address)).to.equal("0");
  });

  it("Should revert when trying to approve more than balance", async () => {
    await expect(token.connect(user4).approve(await user2.address, ethers.parseUnits("900"))).to.be.revertedWith("Insufficient balance to approve");
  });

  it("Should revert when trying to  transferFrom more than allowance", async () => {
    await expect(token.connect(user2).transferFrom(await user4.address, await user2.address, ethers.parseUnits("200"))).to.be.revertedWith("Allowance exceeded");
  });

  it("Should revert when zero amount is transferred via transferFrom", async () => {
    await expect(token.connect(user2).transferFrom(await user4.address, await user2.address, 0)).to.be.revertedWith("Amount must be greater than zero");
  });

  it("Should revert when trying to transferFrom more than balance", async () => {
    await token.connect(user4).approve(await user2.address, ethers.parseUnits("500"));
    await token.connect(user4).burn(ethers.parseUnits("400"));
    await expect(token.connect(user2).transferFrom(await user4.address, await user2.address, ethers.parseUnits("500"))).to.be.revertedWith("Insufficient balance");
  });

  it("Should revert when trying to transferFrom to a non-compliant account", async () => {
    await expect(token.connect(user2).transferFrom(await user4.address, await user5.address, ethers.parseUnits("100"))).to.be.revertedWith("Transfer not compliant");
  });
});
