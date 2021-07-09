//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./Swap.sol";

import "hardhat/console.sol";

/// @notice one user stacking information (amount, apy, period index and starting time)
struct UserStake
{
  uint16 amount;
  uint16 apy;
  uint16 periodIndex;
  uint256 started;
}

/// @title Solo-stacking token contract
/// @notice Stacking token for one of pre-defined periods with different rewards and bonus APY. 
contract MixStake is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;  

  ISwapRouter constant ROUTER = ISwapRouter(0xe5cff588c5225d5519b6a9c53d05b1c8fdd65d17);
  address constant FACTORY = address(0x5d86475e1fc3788d6dad39facb25241587c90698);    

  mapping(uint256 => UserStake) usersStake; // users stacking information

  uint256 public stakeToken;  // address of stack token
  uint public apy;            // current APY of rewards
  uint public rewardsReserved; // future rewards for current stacking
  uint public totalStackedAmount; // total stacked amount (without rewards)

  event Stacked(uint indexed amount, uint indexed period, uint indexed futureRewards);  
  event Unstacked(uint indexed amount, uint indexed rewards);    

    /// @notice Creates a contract
    /// @param _stakeToken is stacked token address
  constructor(uint256 _stakeToken) {
    stakeToken = _stakeToken;
    rewardsReserved = 0;
    totalStackedAmount = 0;

    console.log("MixStake contract created for token: " + _stakeToken );
  }

  /// -------------------  EXTERNAL, PUBLIC, VIEW  -------------------  
  function periods() public pure returns (uint16[6] memory) {
    return [ 7, 14, 30, 60, 180, 300 ];  
  }

  function bonuses() public pure returns (uint8[6] memory) {
    return [ 0, 2, 5, 10, 20, 30 ];  
  }

  function periodStakeConfig(uint periodIndex) public pure returns (uint16 periodDays, uint16 bonusAPY) {
    periodDays = periods()[periodIndex];
    bonusAPY = bonuses()[periodIndex];
  }

  function calcUserStakeRewards(uint amount, uint periodDays, uint periodAPY,  uint bonusAPY, uint daysLeft) public pure returns (uint rewards) {
    uint calcDays = daysLeft > periodDays ? periodDays : daysLeft;
    rewards = calcDays * periodAPY/365 + calcDays * bonusAPY/365;
  }

  /// -------------------  EXTERNAL, PUBLIC, STATE CHANGE -------------------
  function stake(uint amount, uint periodIndex) nonReentrant external{
    require( periodIndex < periods().length, "Incorrect period index" );
    (uint periodDays, uint bonusAPY) = periodStakeConfig(periodIndex);
    uint rewards = calcUserStakeRewards(amount, periodDays, apy, bonusAPY, periodDays);
    require( rewards < (IERC20(stakeToken).balanceOf(address(this) - rewardsReserved - totalStackedAmount), "Insufficient token balance" );

    IERC20(stakeToken).safeTransferFrom(msg.sender, address(this), amount);    

    totalStackedAmount += amount;
    rewardsReserved += rewards;

    UserStake memory newStake = UserStake({apy: apy, periodIndex: periodIndex, started: block.timestamp });
    usersStake[msg.sender] = newStake;

    emit Stacked( amount, periodDays, rewards );

    console.log("User " + msg.sender + " has been stacked for " + amount + " for period of " + periodDays + " days" );
  }

  function unstake() nonReentrant external {
    UserStake stake storage = usersStake[msg.sender];    
    uint timeInDays = (block.timestamp - stake.started) / 60 / 60 / 24;
    uint periodDays = periods()[stake.periodIndex];
    require(timeInDays > periodDays );

    uint bonusAPY = bonuses()[stake.periodIndex];
    uint rewards = calcUserStakeRewards(stake.amount, periodDays, stake.apy, bonusAPY, periodDays);

    IERC20(stakeToken).safeTransfer(msg.sender, stake.amount + rewards );        

    totalStackedAmount -= amount;
    rewardsReserved -= rewards;

    emit Stacked( amount, periodDays, rewards );    

    console.log("User " + msg.sender + " has been unstacked for " + amount + " after period of " + periodDays + " days and claim " + rewards );
  }

  function userStakeInfo() public view returns (UserStake)
  {
    return usersStake[msg.sender];
  }


  /// ------------------- EXTERNAL OWNER FUNCTIONS -------------------
  function setAPY(uint newValue) onlyOwner external {
    apy = newValue;
  }

  function withdraw(address token, uint amount) onlyOwner external {
      if (token == stackeToken){
        require( amount < (IERC20(stakeToken).balanceOf(address(this) - rewardsReserved - totalStackedAmount), "Insufficient token balance" );
      }
      IERC20(token).safeTransfer(msg.sender, amount);
  }


}

// end of file