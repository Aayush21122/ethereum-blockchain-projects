const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

async function merkleTree() {
    const [user1, user2, user3, user4, user5, user6, user7] = await ethers.getSigners();

    const airdrop = [
        { address: user1.address, amount: ethers.parseUnits("100") },
        { address: user2.address, amount: ethers.parseUnits("200") },
        { address: user3.address, amount: ethers.parseUnits("300") },
        { address: user4.address, amount: ethers.parseUnits("400") },
        { address: user5.address, amount: ethers.parseUnits("500") },
        { address: user6.address, amount: ethers.parseUnits("600") },
        { address: user7.address, amount: ethers.parseUnits("1400") },
    ];

    const leafNodes = airdrop.map(users =>
        Buffer.from(
            ethers.solidityPackedKeccak256(["address", "uint256"], [users.address, users.amount]).slice(2),
            "hex"
        )
    );

    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

    const root = merkleTree.getHexRoot();
    console.log("Merkle Root:", root);

    const userProof = [];

    for (let i = 0; i < 7; i++) {
        const userLeaf = Buffer.from(
            ethers.solidityPackedKeccak256(["address", "uint256"], [airdrop[i].address, airdrop[i].amount]).slice(2),
            "hex"
        );

        const proof = merkleTree.getHexProof(userLeaf);
        userProof.push(proof);
        console.log(`Proof for user${i + 1}:`, proof);
    }
    return { root, userProof };
}

module.exports = { merkleTree };
