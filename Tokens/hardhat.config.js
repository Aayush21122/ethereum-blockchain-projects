require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      accounts: ["822f9a2daf22b3d4979ec60ed289d4a1ceb6e0d172a16d38b39be9ae1f95a572"],
      url: "https://eth-sepolia.g.alchemy.com/v2/Z3H_vDR9a0t1k5PJ_DAkK"
    }
  },
  etherscan: {
    apiKey: "8ZEEGE44U229N3KQXGQYRJVJUHMIFYH891",
  },
};
