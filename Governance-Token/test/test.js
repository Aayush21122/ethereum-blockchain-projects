const { expect } = require("chai");
const { ethers } = require("hardhat");
const { main } = require("../scripts/deploy.js");

describe("Pedalsup Governance Flow", async () => {
    let deployer, user1, user2, user3;
    let timelock, gpup, governance, marketPlaceInstance;
    let proposalId;

    before(async () => {
        ({ timelock, gpup, governance, marketPlaceInstance } = await main());
        [deployer, user1, user2, user3] = await ethers.getSigners();

        await gpup.mint(user1.address, ethers.parseUnits("1000"));
        await gpup.mint(user2.address, ethers.parseUnits("500"));
        await gpup.mint(user3.address, ethers.parseUnits("700"));

        const proposerRole = await timelock.PROPOSER_ROLE();
        const executorRole = await timelock.EXECUTOR_ROLE();

        await timelock.grantRole(proposerRole, governance.target);
        await timelock.grantRole(executorRole, governance.target);
        await timelock.grantRole(executorRole, user1.address);
    });

    describe("Proposal Creation", () => {
        it("should allow token holders to create proposals", async () => {
            await gpup.connect(user1).delegate(user1.address);
            await gpup.connect(user2).delegate(user2.address);
            await gpup.connect(user3).delegate(user3.address);

            const currentRoyaltyFee = await marketPlaceInstance.royaltyFee();
            console.log("Current Royalty Fee: ", currentRoyaltyFee);

            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [20]
            );

            const proposeTx = await governance.connect(user1).propose(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                "Update royalty fee to 5%"
            );

            const proposeReceipt = await proposeTx.wait();
            proposalId = proposeReceipt.logs[0].args[0];

            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");

            expect(await governance.state(proposalId)).to.equal(1);
        });

        it("should allow token holders to vote", async () => {
            await governance.connect(user1).castVote(proposalId, 1);
            await governance.connect(user2).castVote(proposalId, 0);
            await governance.connect(user3).castVote(proposalId, 2);

            const proposalVotes = await governance.proposalVotes(proposalId);
            expect(proposalVotes.forVotes).to.be.equal(ethers.parseUnits("1000"));
            expect(proposalVotes.againstVotes).to.be.equal(ethers.parseUnits("500"));
            expect(proposalVotes.abstainVotes).to.be.equal(ethers.parseUnits("700"));

            for (let i = 0; i < 6; i++) {
                await ethers.provider.send("evm_mine");
            }
        });

        it("should queue successful proposal", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [20]
            );

            const descriptionHash = ethers.id("Update royalty fee to 5%");

            await governance.queue(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                descriptionHash
            );

            expect(await governance.state(proposalId)).to.equal(5);
            await ethers.provider.send("evm_increaseTime", [13]);
            await ethers.provider.send("evm_mine");
        });

        it("should execute queued proposal after timelock", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [20]
            );

            const descriptionHash = ethers.id("Update royalty fee to 5%");

            await governance.execute(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                descriptionHash
            );

            const updatedRoyaltyFee = await marketPlaceInstance.royaltyFee();
            console.log(updatedRoyaltyFee);
            expect(updatedRoyaltyFee).to.equal(20);
        });
    });

    describe("Proposals Failure", () => {
        it("Proposal should get rejected", async () => {
            await gpup.connect(user1).delegate(user1.address);
            await gpup.connect(user2).delegate(user2.address);
            await gpup.connect(user3).delegate(user3.address);

            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [30]
            );

            const descriptionHash = ethers.id("Update royalty fee to 30%");

            const proposeTx = await governance.connect(user1).propose(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                "Update royalty fee to 30%"
            );

            const proposeReceipt = await proposeTx.wait();
            proposalId = proposeReceipt.logs[0].args[0];

            for (let i = 0; i < 3; i++) {
                await ethers.provider.send("evm_mine");
            }

            await governance.connect(user1).castVote(proposalId, 2);
            await governance.connect(user2).castVote(proposalId, 1);
            await governance.connect(user3).castVote(proposalId, 0);

            for (let i = 0; i < 6; i++) {
                await ethers.provider.send("evm_mine");
            }

            expect(await governance.state(proposalId)).to.equal(3);

            await expect(
                governance.queue(
                    [marketPlaceInstance.target],
                    [0],
                    [calldata],
                    descriptionHash
                )
            ).to.be.revertedWithCustomError(governance, "GovernorUnexpectedProposalState");

            const updatedRoyaltyFee = await marketPlaceInstance.royaltyFee();
            expect(updatedRoyaltyFee).to.equal(20);
        });
    });

    describe("Edge Cases", () => {
        it("Non-token holder cannot propose", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [40]
            );

            await expect(
                governance.connect(deployer).propose(
                    [marketPlaceInstance.target],
                    [0],
                    [calldata],
                    "Attempt proposal with no voting power"
                )
            ).to.be.revertedWithCustomError(governance, "GovernorInsufficientProposerVotes");
        });

        it("Should reject double voting", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [35]
            );

            const proposeTx = await governance.connect(user2).propose(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                "Double vote test"
            );
            const receipt = await proposeTx.wait();
            const testProposalId = receipt.logs[0].args[0];

            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");

            await governance.connect(user2).castVote(testProposalId, 1);
            await expect(
                governance.connect(user2).castVote(testProposalId, 1)
            ).to.be.revertedWithCustomError(governance, "GovernorAlreadyCastVote");
        });

        it("Proposal can be canceled if proposer loses voting power", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [45]
            );

            const proposeTx = await governance.connect(user1).propose(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                "Cancel test"
            );
            const receipt = await proposeTx.wait();
            const cancelProposalId = receipt.logs[0].args[0];

            await governance.connect(user1).cancel(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                ethers.id("Cancel test")
            );

            expect(await governance.state(cancelProposalId)).to.equal(2);
        });

        // it("Proposal should expire if not executed in time", async () => {
        //     const calldata = marketPlaceInstance.interface.encodeFunctionData(
        //         "setRoyaltyFee",
        //         [50]
        //     );

        //     const proposeTx = await governance.connect(user2).propose(
        //         [marketPlaceInstance.target],
        //         [0],
        //         [calldata],
        //         "Expire test"
        //     );
        //     const receipt = await proposeTx.wait();
        //     const expireProposalId = receipt.logs[0].args[0];

        //     await ethers.provider.send("evm_mine");
        //     await ethers.provider.send("evm_mine");
        //     await ethers.provider.send("evm_mine");
        //     await governance.connect(user1).castVote(expireProposalId, 1);

        //     for (let i = 0; i < 11; i++) {
        //         await ethers.provider.send("evm_mine");
        //     }
        //     console.log("Proposal state after expiration: ", await governance.state(expireProposalId));

        //     await governance.queue(
        //         [marketPlaceInstance.target],
        //         [0],
        //         [calldata],
        //         ethers.id("Expire test")
        //     );

        //     console.log("Proposal state after expiration: ", await governance.state(expireProposalId));

        //     expect(await governance.state(expireProposalId)).to.equal(6);
        // });

        it("Proposal should fail due to quorum not met", async () => {
            const calldata = marketPlaceInstance.interface.encodeFunctionData(
                "setRoyaltyFee",
                [55]
            );

            const proposeTx = await governance.connect(user3).propose(
                [marketPlaceInstance.target],
                [0],
                [calldata],
                "Quorum fail test"
            );
            const receipt = await proposeTx.wait();
            const quorumProposalId = receipt.logs[0].args[0];

            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");
            await ethers.provider.send("evm_mine");

            await governance.connect(user2).castVote(quorumProposalId, 1);

            for (let i = 0; i < 6; i++) {
                await ethers.provider.send("evm_mine");
            }

            expect(await governance.state(quorumProposalId)).to.equal(3);
        });
    });
});
