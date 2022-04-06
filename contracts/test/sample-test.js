const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});

// describe("SonOfASwap", function () {
//   it("Should verify a signature and increment the status variable by 1", async function () {
//     const SonOfASwap = await ethers.getContractFactory("SonOfASwap");
//     const sonOfASwap = await SonOfASwap.deploy();
//     await sonOfASwap.deployed();
//     const order = {
//       sender: '0x0000000000b42d0692e4cde6add2b3bcccde864f',
//       functionName: 'swapEthForExactToken',
//       value: '0x4563918244f40000'
//     }
//     const v = 27
//     const r = "0x726e3f3246a6b41823768e078f6e36883d0b287f50a3743f380a16810b51b334"
//     const s = "0x0ac3a4993dc7bba5096f36b0596ae1466ce57eea4fd22765738058dcccf4211a"    

//     const verifyTx = await sonOfASwap.setIfValidSignature(order, v, r, s);

//     // wait until the transaction is mined
//     await verifyTx.wait();

//     expect(await sonOfASwap.status()).to.equal(1);
//   });
// });

describe("SonOfASwap2", function () {
  it("Should verify a signature", async function () {
    const SonOfASwap = await ethers.getContractFactory("SonOfASwap2");
    const sonOfASwap = await SonOfASwap.deploy();
    await sonOfASwap.deployed();
    const order = {
      sender: '0x0000000000b42d0692e4cde6add2b3bcccde864f',
      functionName: 'swapEthForExactToken',
      value: '0x4563918244f40000'
    }
    const v = 27
    const r = "0x726e3f3246a6b41823768e078f6e36883d0b287f50a3743f380a16810b51b334"
    const s = "0x0ac3a4993dc7bba5096f36b0596ae1466ce57eea4fd22765738058dcccf4211a"    

    expect(await sonOfASwap.verify(order, v, r, s)).to.equal(true);
  });
});
