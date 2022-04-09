// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./MyToken.sol";

contract Staking {
    // Address for staked ERC20 token
    IERC20 public asset;
    // Number of staked tokens
    uint256 public totalAssets;

    // S_t function used to calculate staking rewards, seperated into numerator
    // and denominator
    uint256 public s_num;
    uint256 public s_den;
    mapping(address => uint256) public s_0_num;
    mapping(address => uint256) public s_0_den;

    // Map from each address to number of staked tokens
    mapping(address => uint256) public staked;

    /**
     * @notice Constructor for staking contract
     * @param asset_ Address for staked ERC20 token
     */
    constructor(address asset_) {
        asset = IERC20(asset_);
        totalAssets = 0;
        s_num = 0;
        s_den = 1;
    }

    /**
     * @notice Stakes a specific amount of tokens
     * @param assets number of tokens to stake
     * @param sender address of the staked tokens' owner
     * @return success boolean of whether stake was successful
     */
    function stake(uint256 assets, address sender) public returns (bool) {
        require(assets > 0);
        require(asset.transferFrom(sender, address(this), assets));

        if (staked[sender] > 0) {
            uint256 rewards = maxRewards(sender);
            totalAssets += assets + rewards;
            staked[sender] += assets + rewards;
        } else {
            totalAssets += assets;
            staked[sender] = assets;
        }
        s_0_num[sender] = s_num;
        s_0_den[sender] = s_den;

        return true;
    }

    /**
     * @notice Unstakes a specfic amount of tokens and their rewards
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
        require(assets > 0);
        require(msg.sender == owner);

        uint256 maxAssets = maxUnstake(owner);
        require(assets <= maxAssets);

        uint256 rewards = maxRewards(owner);
        totalAssets = totalAssets + rewards - assets;
        staked[owner] = staked[owner] + rewards - assets;

        s_0_num[owner] = s_num;
        s_0_den[owner] = s_den;

        require(asset.transfer(receiver, assets));

        return true;
    }

    /**
     * @notice Calculates the maximum number of tokens withdrawable
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
    function gcf(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 r = a % b;
        while (r != 0) {
            a = b;
            b = r;
            r = a % b;
        }
        return b;
    }
}
