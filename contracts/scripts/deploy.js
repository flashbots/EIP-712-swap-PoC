// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat")
const hre = require("hardhat")
require("@tenderly/hardhat-tenderly");
require("dotenv").config()

async function main() {
  console.log("IM DEPLOYIIIIIIIIIING!!!")
  const deployer = new ethers.Wallet(process.env.SIGNER_KEY).connect(hre.ethers.provider)
  const SonOfASwap = await ethers.getContractFactory("SonOfASwap", deployer)
  const sonOfASwap = await SonOfASwap.deploy()
  await sonOfASwap.deployed()

  await hre.tenderly.persistArtifacts({
    name: "SonOfASwap",
    address: sonOfASwap.address,
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
