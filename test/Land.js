const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { ethers, upgrades } = require("hardhat");


describe("LandTests", function () {
  // Create token contracts. Mock721 represents $CITIZEN.
  let LandToken;
  let Mock721Token;
  let KongTokenClaim;
  let CitizenTokenClaim;

  // Create test accounts.
  let owner;
  let dao;
  let minter;
  let citizenFrom;
  let citizenTo;
  let alphaClaim;
  let citizenClaim;
  let nonCitizen;
  let anyone;
  let kongERC20Claimer;

  before(async function () {

    LandToken = await ethers.getContractFactory("Land");
    Mock721Token = await ethers.getContractFactory("Mock721");
    KongTokenClaim = await ethers.getContractFactory("KongTokenClaim");
    CitizenTokenClaim = await ethers.getContractFactory("CitizenTokenClaim");

    [owner, dao, minter, citizenFrom, citizenTo, alphaClaim, citizenClaim, nonCitizen, anyone, kongERC20Claimer] = await ethers.getSigners();

    // Deploy the base contracts.
    Mock721Contract = await Mock721Token.deploy(); 
    LandContract = await LandToken.deploy(Mock721Contract.address);

    // NOTE: edit the merkle root here if the JSON is modified.
    KongTokenClaimContract = await KongTokenClaim.deploy(LandContract.address, "0x1890e605cc3357b78695d105579484e1f2bc70ec4e418f0198769c8c7e3b298d", 1563686528, 1763686528)
    CitizenTokenClaimContract = await CitizenTokenClaim.deploy(LandContract.address, Mock721Contract.address, 1563686528, 1763686528)

    // Add minter and DAO roles.
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), minter.address);
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), KongTokenClaimContract.address);
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), CitizenTokenClaimContract.address);
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DAO_ROLE')), dao.address);

    // Mint Mock $CITIZEN tokens.
    await Mock721Contract.safeMint(citizenTo.address, 1);
    await Mock721Contract.safeMint(citizenFrom.address, 2);
    await Mock721Contract.safeMint(alphaClaim.address, 238);
    await Mock721Contract.safeMint(citizenClaim.address, 1001);
  });

  describe('\n\tLandToken', () => {
    it("Is token public?.", async function () {
      let publicTransfer = await LandContract.publicTransfer()
      expect(publicTransfer, "Public transfer should be false.").to.be.false;
    }); 

    it("Is token capped at 1,407,230,468?.", async function () {
      expect(await LandContract.cap()).to.equal(ethers.BigNumber.from("10").pow(18).mul("1407230468"));
    });

    it("Is supply after mint 599,459,004?.", async function () {
      expect(await LandContract.totalSupply()).to.equal(ethers.BigNumber.from("10").pow(18).mul("726498004"));
    });


    it("It should have minted 500,000,000 to early contributors.", async function () {
      expect(await LandContract.balanceOf("0xbdC95cA05cC25342Ae9A96FB12Cbe937Efe2e28C")).to.equal(ethers.BigNumber.from("10").pow(18).mul("500000000"));
    });

    it("It should mint.", async function () {
      await LandContract.connect(minter).mint(dao.address, ethers.BigNumber.from("10").pow(18).mul(2300));

      expect(await LandContract.balanceOf(dao.address)).to.equal(ethers.BigNumber.from("10").pow(18).mul(2300));
    });    

    it("It should mint to $CITIZEN.", async function () {
      await LandContract.connect(minter).mint(citizenTo.address, ethers.BigNumber.from("10").pow(18).mul(250));

      expect(await LandContract.balanceOf(citizenTo.address)).to.equal(ethers.BigNumber.from("10").pow(18).mul(250));
    }); 

    it("It should transfer from DAO to Citizens.", async function () {
      await LandContract.connect(dao).addWhitelistAddress(dao.address);
      await LandContract.connect(dao).transfer(citizenFrom.address, 500);

      expect(await LandContract.connect(dao).transfer(citizenTo.address, 500)).to.emit(LandContract, "Transfer");
    });    
    
    it("DAO should be whitelisted.", async function () {
      expect(await LandContract.onWhitelist(dao.address)).to.be.true;
    });

    it("It should transfer from Citizen to Citizen.", async function () {
      expect(await LandContract.connect(citizenFrom).transfer(citizenTo.address, 250)).to.emit(LandContract, "Transfer");
    });

    it("It should fail to transfer to non-Citizen.", async function () {
      await expect(LandContract.connect(dao).transfer(nonCitizen.address, 500)).to.be.revertedWith("Recipient needs a $CITIZEN or to be whitelisted.");
    }); 

    it("It should fail to transfer with Citizen removed.", async function () {
      await Mock721Contract.connect(citizenTo).transferFrom(citizenTo.address, citizenFrom.address, 1);

      await expect(LandContract.connect(citizenTo).transfer(citizenFrom.address, 250)).to.be.revertedWith("Sender needs a $CITIZEN or to be whitelisted.");
    });

    it("It should remove from whitelist.", async function () {
      await LandContract.connect(dao).removeWhitelistAddress(dao.address);

      expect(await LandContract.onWhitelist(dao.address)).to.be.false;
    });    
    
    // NOTE: the merkle claim params here match data in merkle/kong_erc20.json.
    it("It should mint from merkel claim.", async function () {
      expect(await KongTokenClaimContract.claim(
        "0xdBa9A507aa0838370399FDE048752E91B5a27F06", ethers.BigNumber.from("10").pow(18).mul(16384000),
        ['0x8ca7635b13c2ecfd4258181240a99550552a92fa9d7422e4705f86b1cdae0a42', 
        '0x8885c058816b6fd42acb31c9d744d83dc27dd2c495df0d362affa1d8a19deed4', 
        '0xcbbcb07463de9b7cc89e2c770deebfb3bb684c8db4160b2aa9a6e82900a74272', 
        '0xc422c32e4044f094d9bdc18f0d9b48df8be06df010a8883beb9db385e712a2e9', 
        '0x2ac97e5cb629e78794188fa01579dcb68285faba3ea24dc77a042e7e9f8470f0', 
        '0x32c947d8b160d35b182c4e718029cbfaab3f9e4c2d662a4e4362cfd7fa2000a7', 
        '0xc357366821dc4f3b1b87d1e39d5b5560965d506f67800b0b1c8523a945a5ecde'])).to.emit(KongTokenClaimContract, "Claim");
    });    

    it("It should mint 500,000 to Alphas under 238.", async function() {
      await CitizenTokenClaimContract.connect(alphaClaim).claim(238);

      expect(await LandContract.balanceOf(alphaClaim.address)).to.equal(ethers.BigNumber.from("10").pow(18).mul("500000"));      
    });
    it("It should mint 50,000 to $CITIZENS > 500.", async function() {
      await CitizenTokenClaimContract.connect(citizenClaim).claim(1001);

      expect(await LandContract.balanceOf(citizenClaim.address)).to.equal(ethers.BigNumber.from("10").pow(18).mul("50000"));      
    });

    it("It should not mint to Alpha again.", async function() {
      await expect(CitizenTokenClaimContract.connect(alphaClaim).claim(238)).to.be.revertedWith("Already claimed.");   
    });

    it("It should not mint to anyone.", async function() {
      await expect(CitizenTokenClaimContract.connect(anyone).claim(1)).to.be.revertedWith("Only token holder can claim.");   
    });

    it("It should open transfer.", async function () {
      expect(await LandContract.connect(dao).unlockTransfer()).to.emit(LandContract, "TranferUnlocked");
    });  

    it("It should transfer when public.", async function () {
      await LandContract.connect(citizenTo).transfer(nonCitizen.address, 750);
      await LandContract.connect(citizenFrom).transfer(nonCitizen.address, 250);

      await expect(LandContract.connect(nonCitizen).transfer(anyone.address, 1000)).to.emit(LandContract, "Transfer");
    });

    // NOTE: combining ERC20Capped and ERC20Burnable means that burned coins can be "reminted" by minters.
    it("It should retain cap when burned.", async function () {
      await LandContract.connect(citizenTo).burn(ethers.BigNumber.from("10").pow(18).mul(100));

      // 1407230468 - 726498004 - 16384000 - 500000 - 50000 - 2300 - 250 + 100 -> 663796015 should fail.
      await LandContract.connect(minter).mint(anyone.address, ethers.BigNumber.from("10").pow(18).mul("663796014"));

      // Cap is unchanged.
      expect(await LandContract.cap()).to.equal(ethers.BigNumber.from("10").pow(18).mul("1407230468"));
    });

  });
});
