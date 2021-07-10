const { Contract, ContractFactory } = require("@ethersproject/contracts");

const { expect } = require('chai');

describe("MixStake", function () {

  beforeEach(async function () {
    this.deployer = (await ethers.getSigners())[0];
    this.user1 = (await ethers.getSigners())[1];
    this.user2 = (await ethers.getSigners())[2];    
    this.user3 = (await ethers.getSigners())[3];        
    
    const tERC20 = await ethers.getContractFactory("TestERC20");    
    this.token = await tERC20.deploy("SomeToken", "ST");
    await this.token.deployed();

    const MixStake = await ethers.getContractFactory("MixStake");
    this.stake = await MixStake.deploy(this.token.address);
    await this.stake.deployed();

    const apy = 150;
    const setAPYTx = await this.stake.setAPY(apy);
    await setAPYTx.wait();

    // send some tokens to owner
    this.initMinted = 1000;
    await this.token.mint(this.deployer.address, this.initMinted );
  });

  it("Set APY", async function () {

    const apy = 200;
    const setAPYTx = await this.stake.setAPY(apy);
    await setAPYTx.wait();
    var _apy = await this.stake.apy();
    console.log("APY contract value : " + _apy);    
    expect(_apy).to.equal(apy);   

  });

  it("Change owner", async function () {

    await this.stake.transferOwnership(this.user1.address);
    expect( await this.stake.owner()).to.equal( this.user1.address );      
    console.log( "Owner changed successfuly!");

  });  

  it("Double stake", async function () {

    // deployer send tokens to contract
    const initForStakeAmount =  500;
    await this.token.transfer(this.stake.address, initForStakeAmount);
    var _stakeBalance = await this.token.balanceOf(this.stake.address);
    console.log(_stakeBalance);
    console.log("MixStake contract balance after transfer: " + _stakeBalance);
    expect(_stakeBalance).to.equal(initForStakeAmount);       
    var _deployerBalance = await this.token.balanceOf(this.deployer.address);
    console.log("Deployer balance after transfer: " + _deployerBalance);
    expect(_deployerBalance).to.equal(this.initMinted - initForStakeAmount);       

    // send tokens to user1
    var initForUserAmount = 100;
    await this.token.transfer(this.user1.address, initForUserAmount);
    await this.token.transfer(this.user2.address, initForUserAmount);
    await this.token.transfer(this.user3.address, initForUserAmount);        

    var _userBalance = await this.token.balanceOf(this.user1.address);
    console.log("user1 balance after transfer: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount);       

    // user send tokens to staking
    var stakeAmount = 50;
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user1).stake(stakeAmount,3);
    var ui = await this.stake.connect(this.user1).userStakeInfo()
    console.log("user1 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );
    
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);    
    await expect(
      this.stake.connect(this.user1).stake(stakeAmount,1)
    ).to.be.revertedWith("Sender has active staking");        

    console.log( "Second call stake reverted!" );    

  });


  it("Double unstake", async function () {

    // deployer send tokens to contract
    var initForStakeAmount = 500;
    await this.token.transfer(this.stake.address, initForStakeAmount);
    var _stakeBalance = await this.token.balanceOf(this.stake.address);
    console.log("MixStake contract balance after transfer: " + _stakeBalance);
    expect(_stakeBalance).to.equal(initForStakeAmount);       
    var _deployerBalance = await this.token.balanceOf(this.deployer.address);
    console.log("Deployer balance after transfer: " + _deployerBalance);
    expect(_deployerBalance).to.equal(this.initMinted - initForStakeAmount);       

    // send tokens to user1
    var initForUserAmount = 100;
    await this.token.transfer(this.user1.address, initForUserAmount);
    var _userBalance = await this.token.balanceOf(this.user1.address);
    console.log("user1 balance after transfer: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount);       

    // user send tokens to staking
    var stakeAmount = 50;
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user1).stake(stakeAmount,3);
    var ui = await this.stake.connect(this.user1).userStakeInfo()
    console.log("user1 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );
    
    // emulate 70 days after
    await network.provider.send("evm_increaseTime", [3600 * 24 * 70])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 


    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);    
    await this.stake.connect(this.user1).unstake();

    await expect(
      this.stake.connect(this.user1).unstake()
    ).to.be.revertedWith("Sender has no active staking");        

    console.log( "Second call unstake reverted!" ); 

  });  

  it("COMPLEX TEST. Staking full cycle with owner withdraw", async function () {

    // deployer send tokens to contract
    var initForStakeAmount = 500;
    await this.token.transfer(this.stake.address, initForStakeAmount);
    var _stakeBalance = await this.token.balanceOf(this.stake.address);
    console.log("MixStake contract balance after transfer: " + _stakeBalance);
    expect(_stakeBalance).to.equal(initForStakeAmount);       
    var _deployerBalance = await this.token.balanceOf(this.deployer.address);
    console.log("Deployer balance after transfer: " + _deployerBalance);
    expect(_deployerBalance).to.equal(this.initMinted - initForStakeAmount);       

    // send tokens to user1
    var initForUserAmount = 100;
    await this.token.transfer(this.user1.address, initForUserAmount);    
    await this.token.transfer(this.user2.address, initForUserAmount);    
    await this.token.transfer(this.user3.address, initForUserAmount);    

    var _userBalance = await this.token.balanceOf(this.user1.address);
    console.log("user1 balance after transfer: " + _userBalance);    
    expect(_userBalance).to.equal(initForUserAmount);       

    _userBalance = await this.token.balanceOf(this.user2.address);
    console.log("user2 balance after transfer: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount);       

    _userBalance = await this.token.balanceOf(this.user3.address);
    console.log("user3 balance after transfer: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount); 

    // ONE USER STAKING

    // user send tokens to staking
    var stakeAmount = '50';
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user1).stake(stakeAmount,3);

    _userBalance = await this.token.balanceOf(this.user1.address);
    console.log("user1 balance after stake: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount - stakeAmount);       

    var ui = await this.stake.connect(this.user1).userStakeInfo()
    console.log("user1 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );

    // user try to unstake before period is finished 
    await network.provider.send("evm_increaseTime", [3600 * 24 ])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);    
    await expect(
      this.stake.connect(this.user1).unstake()
    ).to.be.revertedWith("Staking period is not finished yet");  
    console.log("Unstake before period has left cause revert. Its ok");

    // emulate 60 days after
    await network.provider.send("evm_increaseTime", [3600 * 24 * 60])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    // user unstake tokens
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);    
    await this.stake.connect(this.user1).unstake();      

    // 3 USERS STAKING
    // user send tokens to staking
    var stakeAmount = '50';
    var _user1BalanceBefore = await this.token.balanceOf(this.user1.address);    
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user1).stake(stakeAmount,0); // 7 days
    await this.token.connect(this.user2).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user2).stake(stakeAmount,1); // 14 days

    console.log("Change APY to 200 before user3 call stake()!");
    await this.stake.setAPY(200);
    await this.token.connect(this.user3).approve(this.stake.address,stakeAmount);
    await this.stake.connect(this.user3).stake(stakeAmount,2); // 30 days

    _userBalance = await this.token.balanceOf(this.user1.address);
    console.log("user1 balance after stake: " + _userBalance);
    expect(_userBalance).to.equal(_user1BalanceBefore - stakeAmount );       
    var ui = await this.stake.connect(this.user1).userStakeInfo()
    console.log("user1 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );

    _userBalance = await this.token.balanceOf(this.user2.address);
    console.log("user2 balance after stake: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount - stakeAmount);       
    var ui = await this.stake.connect(this.user2).userStakeInfo()
    console.log("user2 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );

    _userBalance = await this.token.balanceOf(this.user3.address);
    console.log("user3 balance after stake: " + _userBalance);
    expect(_userBalance).to.equal(initForUserAmount - stakeAmount);       
    var ui = await this.stake.connect(this.user3).userStakeInfo()
    console.log("user3 stake info - apy: %s, periodIndex: %s, started: %s", ui.apy, ui.periodIndex, ui.started );

    // emulate 7 days after
    console.log("7 days delay");                
    await network.provider.send("evm_increaseTime", [3600 * 24 * 7])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    // user1 unstake tokens
    console.log("user1 unstake()");
    await this.stake.connect(this.user1).unstake();      
    await this.token.connect(this.user1).approve(this.stake.address,stakeAmount);    
   
    // emulate 7 days after
    console.log("7 days delay")        
    await network.provider.send("evm_increaseTime", [3600 * 24 * 7])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    // user2 unstake tokens
    console.log("user2 unstake()");    
    await this.stake.connect(this.user2).unstake();      
    await this.token.connect(this.user2).approve(this.stake.address,stakeAmount);    

    // emulate 16 days after
    console.log("16 days delay")            
    await network.provider.send("evm_increaseTime", [3600 * 24 * 16])
    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp 

    // user3 unstake tokens
    console.log("user2 unstake()");        
    await this.stake.connect(this.user3).unstake();      
    await this.token.connect(this.user3).approve(this.stake.address,stakeAmount);    

    // owner withdraw all rest tokens
    var restBalance = await this.token.balanceOf(this.stake.address);
    console.log( "Rest MixStake contract balance - %s, avaiable for withdraw - %s", restBalance, await this.stake.freeAmount() );
    await this.stake.withdraw(this.token.address,  restBalance );
  });

});