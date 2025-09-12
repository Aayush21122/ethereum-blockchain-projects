// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {console} from "hardhat/console.sol";

contract Staking is Ownable {
    struct pool {
        address owner;
        uint256 duration;
        address erc20Address;
        uint256 apyNumerator;
        uint256 apyDenominator;
        uint256 totalStaked;
        uint256 totalAmount;
        uint256 totalFunds;
        bool isFlexible;
        bool isRemoved;
    }
    struct user {
        uint256 stakeId;
        address stakerAddress;
        uint256 amountStaked;
        uint256 amountRewarded;
        uint256 poolId;
        bool isClaimed;
        bool requestUnstake;
        bool unstaked;
        uint256 stakeTimestamp;
        uint256 unstakeTimestamp;
    }
    struct fundUser {
        uint256 poolId;
        uint256 amountFunded;
    }
    mapping(address => bool) public whiteListed;
    mapping(uint256 => pool) public pools;
    mapping(uint256 => user) public users;
    mapping(address => fundUser) public fundUsers;
    event PoolCreated(
        uint256 indexed poolId,
        address indexed owner,
        uint256 duration,
        uint256 apyNumerator,
        uint256 apyDenominator,
        uint256 funds
    );

    struct individualReward {
        uint256 stakeId;
        uint256 rewardAmount;
    }

    struct RewardInfo {
        uint256 totalReward;
        uint256 rewardCount;
        individualReward[] individualRewards;
    }

    event FlexiblePoolCreated(
        uint256 indexed poolId,
        address indexed owner,
        uint256 apyNumerator,
        uint256 apyDenominator,
        uint256 funds
    );

    event Staked(
        uint256 indexed stakeId,
        address user,
        uint256 indexed poolId,
        uint256 amount
    );

    event claimReward(
        uint256 indexed stakeId,
        address user,
        uint256 rewardAmount
    );

    uint256 public poolId;
    uint256 public stakeId;

    constructor(address owner) Ownable(owner) {
        whiteListed[owner] = true;
    }

    function whiteListUser(address user) external onlyOwner {
        require(!whiteListed[user], "Already whiteListed");
        whiteListed[user] = true;
    }

    function createPool(
        uint256 duration,
        uint256 apyNumerator,
        uint256 apyDenominator,
        uint256 funds,
        address erc20Address,
        bool isFlexible
    ) external {
        require(whiteListed[msg.sender], "Not whiteListed");
        require(funds >= 100000000000000000000, "Add Atleast 100 funds");
        require(
            IERC20(erc20Address).balanceOf(msg.sender) >= funds,
            "Insufficient Balance"
        );
        require(apyDenominator > 0, "Denominator cannot be less than zero");
        if (!isFlexible) {
            require(duration > 0, "Duration should be greater than zero");
        }
        pools[++poolId] = pool({
            owner: msg.sender,
            duration: duration,
            apyNumerator: apyNumerator,
            apyDenominator: apyDenominator,
            totalStaked: 0,
            totalAmount: funds,
            totalFunds: funds,
            erc20Address: erc20Address,
            isFlexible: isFlexible,
            isRemoved: false
        });
        fundUsers[msg.sender] = fundUser({poolId: poolId, amountFunded: funds});
        IERC20(erc20Address).transferFrom(msg.sender, address(this), funds);
        if (isFlexible) {
            emit FlexiblePoolCreated(
                poolId,
                msg.sender,
                apyNumerator,
                apyDenominator,
                funds
            );
        } else {
            emit PoolCreated(
                poolId,
                msg.sender,
                duration,
                apyNumerator,
                apyDenominator,
                funds
            );
        }
    }

    function calculateTotalReward(
        uint256 poolId
    ) internal view returns (RewardInfo memory) {
        uint256 apyNumerator = pools[poolId].apyNumerator;
        uint256 apyDenominator = pools[poolId].apyDenominator;
        uint256 totalReward = 0;
        individualReward[] memory individualRewards = new individualReward[](
            stakeId
        );
        uint256 rewardCount = 0;
        for (uint256 i = 1; i <= stakeId; i++) {
            user memory userInfo = users[i];
            if (
                userInfo.poolId == poolId &&
                !userInfo.unstaked &&
                !userInfo.isClaimed
            ) {
                // console.log("User Info Reward Calculation: ", userInfo.stakeId);
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.amountStaked
                // );
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.amountRewarded
                // );
                // console.log("User Info Reward Calculation: ", userInfo.poolId);
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.isClaimed
                // );
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.requestUnstake
                // );
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.unstaked
                // );
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.stakeTimestamp
                // );
                // console.log(
                //     "User Info Reward Calculation: ",
                //     userInfo.unstakeTimestamp
                // );
                // console.log("-------------------------");
                uint256 amount = calculateReward(
                    userInfo.amountStaked,
                    apyNumerator,
                    apyDenominator,
                    block.timestamp - userInfo.stakeTimestamp,
                    true
                );
                totalReward += amount;
                individualRewards[rewardCount] = individualReward({
                    stakeId: userInfo.stakeId,
                    rewardAmount: amount
                });
                rewardCount++;
            }
        }

        return
            RewardInfo({
                totalReward: totalReward,
                rewardCount: rewardCount,
                individualRewards: individualRewards
            });
    }

    function removePool(uint256 poolId) external {
        pool memory poolInfo = pools[poolId];

        require(!poolInfo.isRemoved, "Pool already removed");

        require(
            msg.sender == poolInfo.owner,
            "Only Owner of the pool can remove"
        );

        RewardInfo memory rewardInfo;

        if (!poolInfo.isFlexible) {
            require(
                poolInfo.totalStaked == 0,
                "Cannot remove pool with active stakes"
            );
        } else {
            rewardInfo = calculateTotalReward(poolId);
            require(
                rewardInfo.totalReward < poolInfo.totalFunds,
                "Total rewards exceed available funds"
            );
        }

        if (poolInfo.isFlexible) {
            uint256 apyNumerator = poolInfo.apyNumerator;
            uint256 apyDenominator = poolInfo.apyDenominator;

            pools[poolId].isRemoved = true;
            for (uint256 i = 0; i < rewardInfo.rewardCount; i++) {
                individualReward memory individualInfo = rewardInfo
                    .individualRewards[i];
                // console.log("Individual Info: ", individualInfo.rewardAmount);
                // console.log("Individual Info: ", individualInfo.stakeId);

                user memory userInfo = users[individualInfo.stakeId];
                // console.log("User Info: ", userInfo.stakeId);
                // console.log("User Info: ", userInfo.amountStaked);
                // console.log("User Info: ", userInfo.amountRewarded);
                // console.log("User Info: ", userInfo.poolId);
                // console.log("User Info: ", userInfo.isClaimed);
                // console.log("User Info: ", userInfo.requestUnstake);
                // console.log("User Info: ", userInfo.unstaked);
                // console.log("User Info: ", userInfo.stakeTimestamp);
                // console.log("User Info: ", userInfo.unstakeTimestamp);

                // console.log("------------------");

                uint256 userAmount = userInfo.amountStaked;

                uint256 totalAmount = userAmount + individualInfo.rewardAmount;

                pools[poolId].totalAmount -= totalAmount;

                pools[poolId].totalFunds -= individualInfo.rewardAmount;

                pools[poolId].totalStaked -= userAmount;

                users[individualInfo.stakeId].isClaimed = true;

                users[individualInfo.stakeId].amountRewarded += individualInfo
                    .rewardAmount;

                users[individualInfo.stakeId].requestUnstake = true;
                users[individualInfo.stakeId].unstaked = true;
                users[individualInfo.stakeId].unstakeTimestamp = block
                    .timestamp;

                // console.log("User Info After: ", userInfo.stakeId);
                // console.log("User Info After: ", userInfo.amountStaked);
                // console.log("User Info After: ", userInfo.amountRewarded);
                // console.log("User Info After: ", userInfo.poolId);
                // console.log("User Info After: ", userInfo.isClaimed);
                // console.log("User Info After: ", userInfo.requestUnstake);
                // console.log("User Info After: ", userInfo.unstaked);
                // console.log("User Info After: ", userInfo.stakeTimestamp);
                // console.log("User Info After: ", userInfo.unstakeTimestamp);

                // console.log("------------------");

                IERC20(pools[poolId].erc20Address).transfer(
                    userInfo.stakerAddress,
                    totalAmount
                );
            }
        } else {
            pools[poolId].isRemoved = true;
        }
    }

    function calculateReward(
        uint256 amountStaked,
        uint256 apyNumerator,
        uint256 apyDenominator,
        uint256 duration,
        bool isFlexible
    ) internal pure returns (uint256) {
        if (isFlexible) {
            return
                (amountStaked * apyNumerator * duration) /
                (apyDenominator * 100 * 365 days);
        } else {
            return (amountStaked * apyNumerator) / (apyDenominator * 100);
        }
    }

    function addFunds(uint256 poolId, uint256 amount) external {
        require(whiteListed[msg.sender], "Not White Listed");
        require(!pools[poolId].isRemoved, "Pool is removed");
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC20(pools[poolId].erc20Address).balanceOf(msg.sender) >= amount,
            "Insufficient Balance"
        );
        pools[poolId].totalAmount += amount;
        pools[poolId].totalFunds += amount;
        if (fundUsers[msg.sender].poolId == poolId) {
            fundUsers[msg.sender].amountFunded += amount;
        } else {
            fundUsers[msg.sender] = fundUser({
                poolId: poolId,
                amountFunded: amount
            });
        }
        IERC20(pools[poolId].erc20Address).transferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    function stake(uint256 poolId, uint256 amount) external {
        require(!whiteListed[msg.sender], "White Listed users cannot stake");
        require(!pools[poolId].isRemoved, "Pool is removed");
        require(amount > 0, "Amount must be greater than 0");
        uint256 updatedStakeId = ++stakeId;
        users[updatedStakeId] = user({
            stakeId: updatedStakeId,
            stakerAddress: msg.sender,
            amountStaked: amount,
            poolId: poolId,
            isClaimed: false,
            stakeTimestamp: block.timestamp,
            unstakeTimestamp: 0,
            unstaked: false,
            requestUnstake: false,
            amountRewarded: 0
        });
        pools[poolId].totalAmount += amount;
        pools[poolId].totalStaked += amount;
        IERC20(pools[poolId].erc20Address).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        emit Staked(stakeId, msg.sender, poolId, amount);
    }

    function unstake(uint256 stakeId) external {
        user memory userInfo = users[stakeId];
        pool memory poolInfo = pools[userInfo.poolId];
        require(userInfo.stakerAddress == msg.sender, "You are not the staker");
        require(!userInfo.unstaked, "Already unstaked");
        require(
            userInfo.amountStaked <= poolInfo.totalAmount &&
                userInfo.amountStaked <= poolInfo.totalStaked,
            "Please unstake in future"
        );
        if (!poolInfo.isFlexible) {
            require(
                block.timestamp > userInfo.stakeTimestamp + poolInfo.duration,
                "Staking period not yet over"
            );
        } else if (!userInfo.requestUnstake) {
            users[stakeId].requestUnstake = true;
            users[stakeId].unstakeTimestamp = block.timestamp;
            return;
        } else {
            require(
                block.timestamp > userInfo.unstakeTimestamp + 5 days,
                "Unstaking is locked: 5 days not passed since unstake request"
            );
        }
        pools[users[stakeId].poolId].totalAmount -= userInfo.amountStaked;
        pools[users[stakeId].poolId].totalStaked -= userInfo.amountStaked;
        if (!poolInfo.isFlexible) {
            users[stakeId].unstakeTimestamp = block.timestamp;
        }
        users[stakeId].unstaked = true;
        IERC20(pools[users[stakeId].poolId].erc20Address).transfer(
            msg.sender,
            userInfo.amountStaked
        );
    }

    function claimRewards(uint256 stakeId) external {
        user memory userInfo = users[stakeId];
        pool memory poolInfo = pools[userInfo.poolId];
        require(userInfo.stakerAddress == msg.sender, "You are not the staker");
        require(userInfo.unstaked, "Please first unstake your amount");
        require(!userInfo.isClaimed, "Already claimed");
        uint256 rewardAmount;
        if (poolInfo.isFlexible) {
            rewardAmount = calculateReward(
                userInfo.amountStaked,
                poolInfo.apyNumerator,
                poolInfo.apyDenominator,
                userInfo.unstakeTimestamp - userInfo.stakeTimestamp,
                true
            );
            require(
                rewardAmount <= poolInfo.totalAmount &&
                    rewardAmount <= poolInfo.totalFunds,
                "Please claim your reward in future"
            );
        } else {
            rewardAmount = calculateReward(
                userInfo.amountStaked,
                poolInfo.apyNumerator,
                poolInfo.apyDenominator,
                0,
                false
            );
            require(
                rewardAmount <= poolInfo.totalAmount &&
                    rewardAmount <= poolInfo.totalFunds,
                "Please claim your reward in future"
            );
        }

        pools[users[stakeId].poolId].totalAmount -= rewardAmount;
        pools[users[stakeId].poolId].totalFunds -= rewardAmount;
        users[stakeId].isClaimed = true;
        users[stakeId].amountRewarded = rewardAmount;
        IERC20(poolInfo.erc20Address).transfer(msg.sender, rewardAmount);

        emit claimReward(stakeId, userInfo.stakerAddress, rewardAmount);
    }
}
