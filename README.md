# MixStake

![alt text](https://github.com/ViktorYurov/mixstake/blob/main/MixStake.jpg?raw=true)

## What is this?

This is simple contract that provide ability to stake any ERC20 token for one of pre-defined time periods in days (7,14,30,60,100,300). Each period has its own addititional bonus (0, 2, 5, 10, 20, 30). The final user rewords for selected period calculated by formula: R = amount * (days * (APY + bonus) / 100 / 365).

## Before start
Before stacking owner has to set APY and transfer some amount of tokens to the contract for future reward claimings. Otherwise stake() call will be reverted with error. The contract has parameter APY. Owner can change APY at any time, but new APY value will be applied for only new stakings. MixStake contract has ability to transfer ownership (see transferOwnership() function) and withdraw (see withdraw() function) free tokens (not reserved for rewards). 

## Staking
User call stake() function for start stacking and unstake() function after period has been ended. 

## How to play with it?

## Prerequisites
Node.js (version 16.4.2 or higher recomended)
Infura API key (for deploy contract to live networks)

## Commands
### Install node js modules
Project are developed with hardhat framework. To start playing with code you have to clone this repo and install nessesary modules by running command
npm i 

### Run tests
npx hardhat test

### Run local node
npx hardhat node

### Run in fork (see https://hardhat.org/guides/mainnet-forking.html)
npx hardhat node --fork <url>
  
### Deploy to local hardhat node
npx hardhat run scripts/test-deploy.js

### Deploy to live network (see https://hardhat.org/tutorial/deploying-to-a-live-network.html)
Before deploy you have to change tokenAddress in main-deploy.js (set your appropriate token address)
npx hardhat run scripts/main-deploy.js --network <any network, that you can add to hardhat.config.js> 
