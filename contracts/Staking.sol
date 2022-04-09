// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./MyToken.sol" as MyToken;

contract Staking {
    IERC20 public asset;

    uint256 public totalAssets;
    uint256 public s_num;
    uint256 public s_den;
    mapping(address => uint256) public staked;
    mapping(address => uint256) public s_0_num;
    mapping(address => uint256) public s_0_den;

    constructor(address _asset) {
        asset = IERC20(_asset);
        totalAssets = 0;
        s_num = 0;
        s_den = 1;
    }

    /**
     * @notice Function to stake a specific amount of tokens
     * @param assets number of tokens to stake
     * @param receiver address to stake tokens for
     * @return success boolean of whether stake was unsuccessful
     */
    function stake(uint256 assets, address receiver) public returns (bool) {
        require(assets != 0);
        require(asset.transferFrom(receiver, address(this), assets));

        uint256 maxAssets = maxUnstake(receiver);
        uint256 rewards = maxRewards(receiver);
        if (maxAssets != 0) {
            totalAssets += assets + rewards;
            staked[receiver] += assets + rewards;
        } else {
            totalAssets += assets;
            staked[receiver] = assets;
        }
        s_0_num[receiver] = s_num;
        s_0_den[receiver] = s_den;

        return true;
    }

    /**
     * @notice Function to unstake a specfic amount of tokens staked + rewards
     * @param assets number of tokens to be withdrawn
     * @param receiver address to transfer tokens to
     * @param owner address to withdraw stake and rewards from
     * @return success boolean of whether unstake was unsuccessful
     */
    function unstake(
        uint256 assets,
        address receiver,
        address owner
    ) public returns (bool) {
        require(msg.sender == owner);

        uint256 maxAssets = maxUnstake(owner);
        require(maxAssets >= assets);

        totalAssets = totalAssets - staked[owner] + maxAssets - assets;
        staked[owner] = maxAssets - assets;

        s_0_num[owner] = s_num;
        s_0_den[owner] = s_den;

        require(asset.transfer(receiver, assets));
        return true;
    }

    /**
     * @notice Function to calculate the maximum tokens withdrawable
     * @param owner address to calculate rewards for
     * @return maxAssets number of tokens that be withdrawn for the address
     */
    function maxUnstake(address owner) public view returns (uint256) {
        if (staked[owner] == 0) {
            return 0;
        }
        uint256 reward = maxRewards(owner);
        return staked[owner] + reward;
    }

    /**
     * @notice Function to calculate current rewards owed on stake
     * @param owner address to calculate rewards for
     * @return maxRewards number of tokens assigned as rewards
     */
    function maxRewards(address owner) public view returns (uint256) {
        if (staked[owner] == 0) {
            return 0;
        }
        uint256 reward_a = staked[owner] * (s_num);
        reward_a /= s_den;
        uint256 reward_b = staked[owner] * s_0_num[owner];
        reward_b /= s_0_den[owner];

        return reward_a - reward_b;
    }

    function whatMaxRewards(address owner) public view returns (uint256) {
        if (staked[owner] == 0) {
            return 0;
        }
        uint256 reward = ((staked[owner] * s_num) / s_den) -
            ((staked[owner] * s_0_num[owner]) / s_0_den[owner]);

        return reward;
    }

    /**
     * @notice Function to distribute rewards to stakers
     * @param assets amount of reward tokens to transfer
     * @param sender address to transfer reward tokens from (must have approval)
     */
    function distribute(uint256 assets, address sender) public returns (bool) {
        require(asset.transferFrom(sender, address(this), assets));

        require(totalAssets != 0);

        s_num = s_num * totalAssets + s_den * assets;
        s_den = s_den * totalAssets;

        uint256 divisor = gcf(s_num, s_den);
        s_num /= divisor;
        s_den /= divisor;

        return true;
    }

    /**
     * @notice Function to calculate the greatest common factor of two numbers
     * @param a the first number
     * @param b the second number
     * @return gcf the greatest common factor of the two numbers
     */
    function gcf(uint256 a, uint256 b) private pure returns (uint256) {
        uint256 r = a % b;
        while (r != 0) {
            a = b;
            b = r;
            r = a % b;
        }
        return b;
    }
}
