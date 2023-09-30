const hre = require("hardhat");

async function main() {
  //STACKING CONRACT
  const tokenStaking = await hre.ethers.deployContract("TokenStaking");
  await tokenStaking.waitForDeployment();

  // TOKEN CONTRACT
  const theblockchaincoders = await hre.ethers.deployContract("Theblockchaincoders");
  await theblockchaincoders.waitForDeployment();

  //CONTRACT ADDRESS
  console.log(` STACKING: ${tokenStaking.target}`);
  console.log(` TOKEN: ${theblockchaincoders.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
