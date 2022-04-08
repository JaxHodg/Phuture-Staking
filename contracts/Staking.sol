// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./MyToken.sol" as MyToken;

contract Staking {
    IERC20 public Token;

    uint256 public Total;
    uint256 public S;
    mapping(address => uint256) public Staked;
    mapping(address => uint256) public S_0;

    constructor(address _token) {
        Token = IERC20(_token);
        Total = 0;
        S = 0;
    }

    function Stake(address from, uint256 amount) public {
        require(Token.transferFrom(from, address(this), amount));

        Staked[from] = amount;
        S_0[from] = S;
        Total = Total + amount;
    }

    function Unstake(
        address from,
        address to,
        uint256 amount
    ) public {
        require(msg.sender == from);

        uint256 staked = Staked[from];

        uint256 maxUnstake = MaxUnstake(from);
        require(maxUnstake >= amount);

        Staked[from] = maxUnstake - amount;
        Total = Total - staked;
        S_0[from] = S;

        require(Token.transfer(to, amount));
    }

    function MaxUnstake(address from) public view returns (uint256) {
        uint256 staked = Staked[from];
        uint256 reward = staked * (S - S_0[from]);
        return staked + reward;
    }

    function Distribute(address from, uint256 amount) public {
        require(Token.transferFrom(from, address(this), amount));

        require(Total != 0);
        S += amount / Total;
    }
}
