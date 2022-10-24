const { ethers, upgrades } = require("hardhat");

const CITIZEN_ERC721_MAINNET = "0x355929193308e157760824ba860390924d77fab9"

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const LandToken = await ethers.getContractFactory("Land");
  // const Mock721Token = await ethers.getContractFactory("Mock721");
  const KongERC20LandClaim = await ethers.getContractFactory("KongTokenClaim");
  const CitizenERC721Claim = await ethers.getContractFactory("CitizenTokenClaim");

  // const LandContract = await new ethers.Contract(
  //   "0x72f29a3fdC7Fe0d4D1d69E4a16763919Dd9d7817",
  //   ["function grantRole(bytes32 role, address citizenERC721) external"],
  //   await ethers.getSigner()
  // );

  // Deploy the base contracts.
  Mock721Contract = await Mock721Token.deploy(); 
  LandContract = await LandToken.deploy(CITIZEN_ERC721_MAINNET);

    // NOTE: edit the merkle root here if the JSON is modified.
  // KongERC20LandClaimContract = await KongERC20LandClaim.deploy(LandContract.address, "0x1890e605cc3357b78695d105579484e1f2bc70ec4e418f0198769c8c7e3b298d", 1665532799, 1680393599)
  CitizenERC721ClaimContract = await CitizenERC721Claim.deploy("0x72f29a3fdC7Fe0d4D1d69E4a16763919Dd9d7817", CITIZEN_ERC721_MAINNET, 1665532799, 1680393599)

    // Add minter and DAO roles.
  // await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), KongERC20LandClaimContract.address);
  await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), CitizenERC721ClaimContract.address);

  // console.log("LandERC20 address:", LandContract.address);
  // console.log("KongERC20LandClaim address:", KongERC20LandClaimContract.address);
  console.log("CitizenERC721Claim address:", CitizenERC721ClaimContract.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });