const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const LandToken = await ethers.getContractFactory("Land");
  const Mock721Token = await ethers.getContractFactory("Mock721");
  const KongERC20LandClaim = await ethers.getContractFactory("KongTokenClaim");

  // Deploy the base contracts.
  Mock721Contract = await Mock721Token.deploy(); 
  LandContract = await LandToken.deploy(Mock721Contract.address);

    // NOTE: edit the merkle root here if the JSON is modified.
  KongERC20LandClaimContract = await KongERC20LandClaim.deploy(LandContract.address, "0x1890e605cc3357b78695d105579484e1f2bc70ec4e418f0198769c8c7e3b298d")

    // Add minter and DAO roles.
  await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), KongERC20LandClaimContract.address);

  console.log("LandERC20 address:", LandContract.address);
  console.log("KongERC20LandClaim address:", KongERC20LandClaimContract.address);

  await deployer.sendTransaction({
    to: "0xdBa9A507aa0838370399FDE048752E91B5a27F06",
    value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });