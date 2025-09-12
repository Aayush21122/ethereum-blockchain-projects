const { ethers } = require("hardhat");
const { expect } = require("chai");
const { main } = require("../scripts/deploy.js");

describe("Minting Tokens", async () => {
    let erc20, stakingInstance, deployer, user1, user2, user3, user4, user5, user6, user7, user8, user9, poolId, stake1, stake2;
    before(async () => {
        ({ erc20, stakingInstance } = await main());
        [deployer, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners();
        await erc20.mint(deployer, ethers.parseUnits("5000"));
        await erc20.mint(user1, ethers.parseUnits("5000"));
        await erc20.mint(user2, ethers.parseUnits("5000"));
        await erc20.mint(user3, ethers.parseUnits("5000"));
        await erc20.mint(user4, ethers.parseUnits("5000"));
        await erc20.mint(user5, ethers.parseUnits("5000"));
        await erc20.mint(user6, ethers.parseUnits("5000"));
        await erc20.mint(user7, ethers.parseUnits("5000"));
        await erc20.mint(user8, ethers.parseUnits("5000"));
        await erc20.mint(user9, ethers.parseUnits("5000"));
    });

    describe("White List User", async () => {
        it("Should white list user", async () => {
            await stakingInstance.whiteListUser(user1.address);
            await stakingInstance.whiteListUser(user2.address);
            await stakingInstance.whiteListUser(user5.address);
            await stakingInstance.whiteListUser(user6.address);
            await expect(
                stakingInstance.connect(user1).whiteListUser(user4.address)
            ).to.be.revertedWithCustomError(stakingInstance, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);
            expect(await stakingInstance.whiteListed(user1.address)).to.equal(true);
            expect(await stakingInstance.whiteListed(user2.address)).to.equal(true);
        });

        it("Should revert due to already whiteListed user", async () => {
            await expect(stakingInstance.whiteListUser(user1.address)).to.be.revertedWith("Already whiteListed");
        });
    });

    describe("Create Pool", async () => {
        it("Should revert due to creation of pool by non-whitelisted user", async () => {
            await expect(stakingInstance.connect(user3).createPool(3600, 10, 1, ethers.parseUnits("200"), erc20.target, false)).to.be.revertedWith("Not whiteListed");
        });

        it("Should revert due to lower funds transfer", async () => {
            await expect(stakingInstance.connect(user1).createPool(3600, 10, 1, ethers.parseUnits("99"), erc20.target, false)).to.be.revertedWith("Add Atleast 100 funds");
        });

        it("Should revert due to insufficient balance", async () => {
            await expect(stakingInstance.connect(user1).createPool(3600, 10, 1, ethers.parseUnits("6000"), erc20.target, false)).to.be.revertedWith("Insufficient Balance");
        });

        it("Should revert due to denominator 0", async () => {
            await expect(stakingInstance.connect(user1).createPool(3600, 10, 0, ethers.parseUnits("100"), erc20.target, false)).to.be.revertedWith("Denominator cannot be less than zero");
        });

        it("Should revert due to duration is less than 0", async () => {
            await expect(stakingInstance.connect(user1).createPool(0, 10, 1, ethers.parseUnits("100"), erc20.target, false)).to.be.revertedWith("Duration should be greater than zero");
        });

        it("Should create pool", async () => {
            await erc20.connect(user1).approve(stakingInstance.target, ethers.parseUnits("100"));
            const staking = await stakingInstance.connect(user1).createPool(3600, 65, 10, ethers.parseUnits("100"), erc20.target, false);
            const receipt = await staking.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "PoolCreated");
            poolId = event.args[0];
            const owner = event.args[1];
            const duration = event.args[2];
            const apyNumerator = event.args[3];
            const apyDenominator = event.args[4];
            const funds = event.args[5];
            expect(poolId).to.exist;
            expect(user1.address).to.equal(owner);
            expect(duration).to.equal(3600);
            expect(apyNumerator).to.equal(65);
            expect(apyDenominator).to.equal(10);
            expect(funds).to.equal(ethers.parseUnits("100"));
        });
    });

    describe("Add Funds", async () => {
        it("Should revert due to non-whitelisted user adding funds to the pool", async () => {
            await expect(stakingInstance.connect(user3).addFunds(poolId, ethers.parseUnits("200"))).to.be.revertedWith("Not White Listed");
        });

        it("Should revert due to amount is not greater than 0", async () => {
            await expect(stakingInstance.connect(user1).addFunds(poolId, ethers.parseUnits("0"))).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should revert due to insufficient balance", async () => {
            await expect(stakingInstance.connect(user1).addFunds(poolId, ethers.parseUnits("6000"))).to.be.revertedWith("Insufficient Balance");
        });

        it("Should add funds into the pool", async () => {
            await erc20.connect(user1).approve(stakingInstance.target, ethers.parseUnits("1"));
            await stakingInstance.connect(user1).addFunds(poolId, ethers.parseUnits("1"));
            await erc20.connect(user2).approve(stakingInstance.target, ethers.parseUnits("2"));
            await stakingInstance.connect(user2).addFunds(poolId, ethers.parseUnits("2"));
            const pool = await stakingInstance.pools(poolId);
            expect(pool.totalFunds).to.equal(ethers.parseUnits("103"));

            const fund1 = await stakingInstance.fundUsers(user1.address);
            expect(fund1.amountFunded).to.equal(ethers.parseUnits("101"));

            const fund2 = await stakingInstance.fundUsers(user2.address);
            expect(fund2.amountFunded).to.equal(ethers.parseUnits("2"));
        });
    });

    describe("Stake", async () => {
        it("Should revert due to stakingInstance by white listed user", async () => {
            await expect(stakingInstance.connect(user1).stake(poolId, ethers.parseUnits("100"))).to.be.revertedWith("White Listed users cannot stake");
        });

        it("Should revert due to stakingInstance with amount 0", async () => {
            await expect(stakingInstance.connect(user3).stake(poolId, ethers.parseUnits("0"))).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should stake", async () => {
            await erc20.connect(user3).approve(stakingInstance.target, ethers.parseUnits("1700"));
            const staking = await stakingInstance.connect(user3).stake(poolId, ethers.parseUnits("1700"));
            const receipt = await staking.wait();
            let event = receipt.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake1 = event.args[0];
            await erc20.connect(user4).approve(stakingInstance.target, ethers.parseUnits("500"));
            const staking2 = await stakingInstance.connect(user4).stake(poolId, ethers.parseUnits("500"));
            const receipt2 = await staking2.wait();
            event = receipt2.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake2 = event.args[0];

            expect(await stakingInstance).to.emit("Staked").withArgs(stake1, user3.address, poolId, ethers.parseUnits("1100"));
            expect(await stakingInstance).to.emit("Staked").withArgs(stake2, user4.address, poolId, ethers.parseUnits("500"));
        });
    });

    describe("Unstake", async () => {
        it("Should revert due to unstaking by non-staker", async () => {
            await expect(stakingInstance.connect(user4).unstake(stake1)).to.be.revertedWith("You are not the staker");
        });

        it("Should revert due to stakingInstance period not over yet", async () => {
            await expect(stakingInstance.connect(user3).unstake(stake1)).to.be.revertedWith("Staking period not yet over");
        });

        it("Should unstake", async () => {
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine");

            await stakingInstance.connect(user3).unstake(stake1);
            await stakingInstance.connect(user4).unstake(stake2);
            const stakeInfo1 = await stakingInstance.users(stake1);
            expect(stakeInfo1.unstaked).to.equal(true);

            const stakeInfo2 = await stakingInstance.users(stake2);
            expect(stakeInfo2.unstaked).to.equal(true);
        });

        it("Should revert due to already unstaked", async () => {
            await expect(stakingInstance.connect(user3).unstake(stake1)).to.be.revertedWith("Already unstaked");
        });
    });

    describe("Claim Rewards", async () => {
        it("Should revert due to claiming by non-staker", async () => {
            await expect(stakingInstance.connect(user4).claimRewards(stake1)).to.be.revertedWith("You are not the staker");
        });

        it("Should revert due to insufficient funds in the pool", async () => {
            await expect(stakingInstance.connect(user3).claimRewards(stake1)).to.be.revertedWith("Please claim your reward in future");
        });

        it("Should claim rewards", async () => {
            await stakingInstance.connect(user4).claimRewards(stake2);
            const stakeInfo = await stakingInstance.users(stake2);
            expect(stakeInfo.isClaimed).to.equal(true);
            expect(await stakingInstance).to.emit("claimReward").withArgs(stake2, user4.address, ethers.parseUnits("32.5"));
        });

        it("Should revert due to already claimed reward", async () => {
            await expect(stakingInstance.connect(user4).claimRewards(stake2)).to.be.revertedWith("Already claimed");
        });
    });

    describe("Remove Pool", async () => {
        it("Should revert due to non-owner removing the pool", async () => {
            await erc20.connect(user2).approve(stakingInstance.target, ethers.parseUnits("100"));
            const staking = await stakingInstance.connect(user2).createPool(3600, 65, 10, ethers.parseUnits("100"), erc20.target, false);
            const receipt = await staking.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "PoolCreated");
            poolId = event.args[0];
            await expect(stakingInstance.connect(user9).removePool(poolId)).to.be.revertedWith("Only Owner of the pool can remove");
        });

        it("Should revert due to active stakes", async () => {
            await erc20.connect(user3).approve(stakingInstance.target, ethers.parseUnits("1000"));
            const staking = await stakingInstance.connect(user3).stake(poolId, ethers.parseUnits("1000"));
            const receipt = await staking.wait();
            let event = receipt.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake1 = event.args[0];
            await expect(stakingInstance.connect(user2).removePool(poolId)).to.be.revertedWith("Cannot remove pool with active stakes");
        });

        it("Should remove pool", async () => {
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine");

            await stakingInstance.connect(user3).unstake(stake1);
            await stakingInstance.connect(user3).claimRewards(stake1);
            await stakingInstance.connect(user2).removePool(poolId);
            const pool = await stakingInstance.pools(poolId);
            expect(pool.isRemoved).to.equal(true);
        });

        it("Should revert due to already removed", async () => {
            await expect(stakingInstance.connect(user2).removePool(poolId)).to.be.revertedWith("Pool already removed");
        });

        it("Cannot Add funds due to Pool is removed", async () => {
            await expect(stakingInstance.connect(user1).addFunds(poolId, ethers.parseUnits("1"))).to.be.revertedWith("Pool is removed");
        });
    });

    describe("Flexible Pool", async () => {
        it("Should claim flexible pool reward", async () => {
            await erc20.connect(user5).approve(stakingInstance.target, ethers.parseUnits("200"));
            const staking = await stakingInstance.connect(user5).createPool(0, 723, 100, ethers.parseUnits("200"), erc20.target, true);
            const receipt = await staking.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "FlexiblePoolCreated");
            poolId = event.args[0];
            await erc20.connect(user7).approve(stakingInstance.target, ethers.parseUnits("1700"));
            const staking1 = await stakingInstance.connect(user7).stake(poolId, ethers.parseUnits("1700"));
            const receipt1 = await staking1.wait();
            let event1 = receipt1.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake1 = event1.args[0];
            await ethers.provider.send("evm_increaseTime", [10512000]);
            await ethers.provider.send("evm_mine");

            await stakingInstance.connect(user7).unstake(stake1);
            await expect(stakingInstance.connect(user7).unstake(stake1)).to.be.revertedWith("Unstaking is locked: 5 days not passed since unstake request");
            await ethers.provider.send("evm_increaseTime", [432000]);
            await ethers.provider.send("evm_mine");
            await stakingInstance.connect(user7).unstake(stake1);
            const staking2 = await stakingInstance.connect(user7).claimRewards(stake1);
            const receipt2 = await staking2.wait();
            let event2 = receipt2.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "claimReward");
            console.log(ethers.formatUnits(event2.args[2]));
            expect(Number(ethers.formatUnits(event2.args[2])).toFixed(2)).to.be.equal('40.97');
        });

        it("Should revert while removing pool with not enough funds for rewards", async () => {
            await erc20.connect(user8).approve(stakingInstance.target, ethers.parseUnits("1700"));
            const staking1 = await stakingInstance.connect(user8).stake(poolId, ethers.parseUnits("1700"));
            const receipt1 = await staking1.wait();
            let event1 = receipt1.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake1 = event1.args[0];

            await erc20.connect(user9).approve(stakingInstance.target, ethers.parseUnits("1700"));
            const staking2 = await stakingInstance.connect(user9).stake(poolId, ethers.parseUnits("1700"));
            const receipt2 = await staking2.wait();
            let event2 = receipt2.logs
                .map(log => {
                    try {
                        return stakingInstance.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === "Staked");
            stake2 = event2.args[0];
            await ethers.provider.send("evm_increaseTime", [105120000]);
            await ethers.provider.send("evm_mine");
            await expect(stakingInstance.connect(user5).removePool(poolId)).to.be.revertedWith("Total rewards exceed available funds");
        });

        it("Remove pool", async () => {
            await erc20.connect(user5).approve(stakingInstance.target, ethers.parseUnits("1500"));
            await stakingInstance.connect(user5).addFunds(poolId, ethers.parseUnits("1500"));
            await stakingInstance.connect(user5).removePool(poolId);
            const stakeInfo1 = await stakingInstance.users(stake1);
            expect(Number(ethers.formatUnits(stakeInfo1.amountRewarded)).toFixed(2)).to.equal("409.70");
            expect(stakeInfo1.unstaked).to.equal(true);
            const stakeInfo2 = await stakingInstance.users(stake2);
            expect(stakeInfo2.unstaked).to.equal(true);
            expect(Number(ethers.formatUnits(stakeInfo2.amountRewarded)).toFixed(2)).to.equal("409.70");
        });
    });
});

