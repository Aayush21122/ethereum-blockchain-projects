Ethereum Blockchain Projects
A comprehensive collection of my smart contract projects on the Ethereum blockchain, showcasing various functionalities from token standards to decentralized applications (dApps). Each project is self-contained in its own directory, complete with its Solidity code and a dedicated README file for detailed information.

📁 Project Structure
This repository is organized into distinct folders, with each folder representing a separate project.





.
├── airdrop/
├── erc1155-marketplace/
├── erc3643-token/
├── governance-token/
├── nft-marketplace/
├── staking/
├── tokens/
└── README.md





📜 Project Descriptions
Here is a brief overview of each project included in this repository.

🪙 Tokens
A foundational project exploring various token standards. This folder contains implementations of:

ERC-20: The most common token standard, used for fungible tokens.

ERC-721: The standard for non-fungible tokens (NFTs).

ERC-1155: A multi-token standard that allows for both fungible and non-fungible tokens within a single contract.

💰 Staking
A decentralized application (dApp) that allows users to stake a specific ERC-20 token and earn rewards over time. The project demonstrates:

Secure token locking and unlocking.

Reward calculation based on time and amount staked.

Withdrawal of staked tokens and earned rewards.

🖼️ NFT MarketPlace
A fully functional NFT marketplace smart contract. This project includes core features such as:

Listing and selling NFTs.

Bidding on NFTs.

Transfer of ownership upon purchase.

Royalty distribution to creators.

🗳️ Governance Token
A smart contract for a governance token, enabling on-chain decentralized governance. Key features include:

A token that grants voting power to its holders.

A voting system for proposals.

Time-weighted voting to prevent flash loan attacks.

🏦 ERC3643
An implementation of the ERC-3643 standard for Tokenized Assets. This project focuses on a permissioned token, ideal for regulated environments. It includes:

Role-based access control for minting, burning, and transferring tokens.

A built-in identity registry for KYC/AML compliance.

Compliance with the Token Taxonomy Framework.

🏬 ERC1155 MarketPlace
A specialized marketplace for trading ERC-1155 multi-tokens. This contract allows users to:

List both fungible and non-fungible tokens from an ERC-1155 contract.

Buy/sell various types of assets with a single contract.

Efficiently manage multiple token IDs and balances.

🎁 Airdrop
A smart contract for distributing tokens to multiple addresses at once. This project demonstrates:

A secure and gas-efficient method for mass token distribution.

Prevention of duplicate airdrops to the same address.

Batch processing of addresses and token amounts.

🚀 Getting Started
To explore a project, simply navigate to its respective folder. Each folder contains the Solidity source code and a dedicated README.md file with instructions on how to compile, deploy, and interact with the smart contract.

Prerequisites
Node.js & npm

Truffle or Hardhat (for development environment)

MetaMask (for browser interaction)

Compilation & Deployment
(This is a general guideline. Refer to each project's individual README for specifics.)

# Example for a Hardhat project

npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia

🤝 Acknowledgments
Thanks to the open-source community for providing excellent tools and libraries.

Inspired by the work of various blockchain developers and educators.

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

🌐 Connect with Me
GitHub: [Aayush21122](https://github.com/Aayush21122)

LinkedIn: [www.linkedin.com/in/paghadar-aayush-837a50263](www.linkedin.com/in/paghadar-aayush-837a50263)

Gmail: paayush192@gmail.com
