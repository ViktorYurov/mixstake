//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "./Swap.sol";

import "hardhat/console.sol";

/// @notice one user staking information (amount, apy, period index and starting time)
struct UserStake
{
  uint amount;
  uint16 apy;
  uint16 periodIndex;
  uint256 started;
}

/// @title Solo-staking token contract
/// @notice Staking token for one of pre-defined periods with different rewards and bonus APY. 
contract MixStake is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;  

  //ISwapRouter constant ROUTER = ISwapRouter(0xe5cff588c5225d5519b6a9c53d05b1c8fdd65d17);
  //address constant FACTORY = address(0x5d86475e1fc3788d6dad39facb25241587c90698);    

  mapping(address => UserStake) usersStake; // users staking information

  address public stakeToken;  // address of token
  uint16 public apy;            // current APY of rewards
  uint public rewardsReserved; // future rewards for current staking
  uint public totalStakedAmount; // total staked amount (without rewards)

  event Staked(uint indexed amount, uint indexed period, uint indexed futureRewards);  
  event Unstaked(uint indexed amount, uint indexed rewards);    

    /// @notice Creates a contract
    /// @param _stakeToken is staked token address
  constructor(address _stakeToken) {
    stakeToken = _stakeToken;
    rewardsReserved = 0;
    totalStakedAmount = 0;

    console.log("MixStake contract created for token: %s",  _stakeToken );
  }

  /// -------------------  EXTERNAL, PUBLIC, VIEW, HELPERS  -------------------  
  function periods() public pure returns (uint16[6] memory) {
    return [ 7, 14, 30, 60, 180, 300 ];  
  }

  function bonuses() public pure returns (uint8[6] memory) {
    return [ 0, 2, 5, 10, 20, 30 ];  
  }

  function userStakeInfo() public view returns (UserStake memory)
  {
    return usersStake[msg.sender];
  }

  function calcUserStakeRewards(uint amount, uint periodDays, uint periodAPY,  uint bonusAPY, uint daysLeft) public pure returns (uint rewards) {
    uint calcDays = daysLeft > periodDays ? periodDays : daysLeft;
    rewards = calcDays * amount * periodAPY/100/365 + calcDays * amount * bonusAPY/100/365;
  }

    // returns how many tokens can owner withdraw 
  function freeAmount() public view returns (uint) {
    return IERC20(stakeToken).balanceOf(address(this)) - rewardsReserved - totalStakedAmount;
  }

  /// -------------------  EXTERNAL, PUBLIC, STATE CHANGE -------------------
  function stake(uint amount, uint16 periodIndex) nonReentrant external{
    require( usersStake[msg.sender].amount == 0, "Sender has active staking");
    require( periodIndex < periods().length, "Incorrect period index" );

    uint periodDays = periods()[periodIndex];
    uint bonusAPY = bonuses()[periodIndex];    
    uint rewards = calcUserStakeRewards(amount, periodDays, apy, bonusAPY, periodDays);

    console.log( "periods: %s days, free tokens amount: %s, future rewards: %s", periodDays, freeAmount(), rewards );
    console.log( "APY - %s", apy );

    require( rewards < freeAmount(), "Insufficient token balance" );

    IERC20(stakeToken).approve(msg.sender, amount);
    IERC20(stakeToken).safeTransferFrom(msg.sender, address(this), amount);    

    totalStakedAmount += amount;
    rewardsReserved += rewards;

    UserStake memory newStake = UserStake({amount: amount, apy: apy, periodIndex: periodIndex, started: block.timestamp });
    usersStake[msg.sender] = newStake;

    emit Staked( amount, periodDays, rewards );

    console.log("User %s has been staked for %s for period of %s days", msg.sender, amount, periodDays );
  }

  function unstake() nonReentrant external {
    require( usersStake[msg.sender].amount > 0, "Sender has no active staking");    
    UserStake storage user  = usersStake[msg.sender];    
    uint timeInDays = (block.timestamp - user.started) / 60 / 60 / 24;
    console.log("Staking period in days - %s", timeInDays );
    uint periodDays = periods()[user.periodIndex];
    require(timeInDays >= periodDays, "Staking period is not finished yet" );

    uint bonusAPY = bonuses()[user.periodIndex];
    uint rewards = calcUserStakeRewards(user.amount, periodDays, user.apy, bonusAPY, periodDays);

    IERC20(stakeToken).safeTransfer(msg.sender, user.amount + rewards );        
    totalStakedAmount -= user.amount;
    rewardsReserved -= rewards;

    console.log("User has been unstaked %s  after period of %s days and claim %s tokens", user.amount, periodDays, rewards );    

    delete usersStake[msg.sender];

    emit Staked( user.amount, periodDays, rewards );    
  }

  /// ------------------- EXTERNAL OWNER FUNCTIONS -------------------
  function setAPY(uint16 newValue) onlyOwner external {
    apy = newValue;
  }

  function withdraw(address token, uint amount) onlyOwner external {
      if (token == stakeToken){
        require( amount <= freeAmount(), "Insufficient token balance" );
      }
      IERC20(token).safeTransfer(msg.sender, amount);
  }


}

// end of file