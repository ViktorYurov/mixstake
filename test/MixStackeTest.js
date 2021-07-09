const { expect } = require("chai");

describe("MixStake", function () {
  it("Should return the new greeting once it's changed", async function () {
    const MixStake = await ethers.getContractFactory("MixStake");
    const token = "";
    const stake = await MixStake.deploy(token);
    await stake.deployed();

    //expect(await stake.greet()).to.equal("Hello, world!");

    //const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await greeter.greet()).to.equal("Hola, mundo!");

    
  });
});
