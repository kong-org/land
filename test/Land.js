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

  // Create test accounts.
  let owner;
  let dao;
  let minter;
  let citizenFrom;
  let citizenTo;
  let nonCitizen;
  let anyone;

  before(async function () {

    LandToken = await ethers.getContractFactory("Land");
    Mock721Token = await ethers.getContractFactory("Mock721");

    [owner, dao, minter, citizenFrom, citizenTo, nonCitizen, anyone] = await ethers.getSigners();

    // Deploy the base contracts.
    Mock721Contract = await Mock721Token.deploy(); 
    LandContract = await LandToken.deploy(Mock721Contract.address);

    // Add minter and DAO roles.
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), minter.address);
    await LandContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DAO_ROLE')), dao.address);

    // Mint Mock $CITIZEN tokens.
    await Mock721Contract.safeMint(citizenTo.address);
    await Mock721Contract.safeMint(citizenFrom.address);
  });

  describe('\n\tLandToken', () => {
    it("Is token public?.", async function () {
      let publicTransfer = await LandContract._publicTransfer()
      expect(publicTransfer, "Public transfer should be false.").to.be.false;
    }); 

    it("Is token capped at 1,407,230,468?.", async function () {
      expect(await LandContract.cap()).to.equal(ethers.BigNumber.from("10").pow(18).mul("1407230468"));
    });

    it("Is supply after mint 552,607,918?.", async function () {
      expect(await LandContract.totalSupply()).to.equal(ethers.BigNumber.from("10").pow(18).mul("552607918"));
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
      await Mock721Contract.connect(citizenTo).transferFrom(citizenTo.address, citizenFrom.address, 0);

      await expect(LandContract.connect(citizenTo).transfer(citizenFrom.address, 250)).to.be.revertedWith("Sender needs a $CITIZEN or to be whitelisted.");
    });

    it("It should remove from whitelist.", async function () {
      await LandContract.connect(dao).removeWhitelistAddress(dao.address);

      expect(await LandContract.onWhitelist(dao.address)).to.be.false;
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

      // 1407230468 - 552607918 = 854622550 - 2300 - 250 + 1000
      await LandContract.connect(minter).mint(anyone.address, ethers.BigNumber.from("10").pow(18).mul("854620100"));

      // Cap is unchanged.
      expect(await LandContract.cap()).to.equal(ethers.BigNumber.from("10").pow(18).mul("1407230468"));
    });    
  });

});
