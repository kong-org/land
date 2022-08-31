// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

interface IERC721 is IERC165 {
    // Only import the balanceOf function from the $CITIZEN ERC721.
    function balanceOf(address owner) external view returns (uint256 balance);
}

contract Land is ERC20Burnable, ERC20Capped, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    // Flag that allows for public transfers of the token if the DAO votes to support this.
    bool public _publicTransfer;

    // Addresses without $CITIZEN that can transfer or receive $LAND.
    mapping (address => bool) public _whitelist;

    IERC721 public _citizenERC721;

    event whitelistAddition(
        address transferer
    );

    event whitelistRemoval(
        address transferer
    );

    event TransferUnlocked();

    // Expected the $CITIZEN ERC721 address at the time of deployment. Maximuim 1407230468 $LAND. 
    constructor(IERC721 citizenERC721) ERC20("Land", "LAND") ERC20Capped(1407230468 * 10 ** 18) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DAO_ROLE, msg.sender);

        _publicTransfer = false;
        _citizenERC721 = citizenERC721;

        // Whitelist the KONG Land treasury and early contributor accounts.
        addWhitelistAddress(0xbdC95cA05cC25342Ae9A96FB12Cbe937Efe2e28C);
        addWhitelistAddress(0xAB35D3476251C6b614dC2eb36380D7AF1232D822);

        _revokeRole(DAO_ROLE, msg.sender);

        _mint(0xbdC95cA05cC25342Ae9A96FB12Cbe937Efe2e28C, 500000000 * 10 ** 18); // KONG Land Treasury
        _mint(0xAB35D3476251C6b614dC2eb36380D7AF1232D822, 17607918 * 10 ** 18); // Early $KONG contributors
        _mint(0xAB35D3476251C6b614dC2eb36380D7AF1232D822, 35000000 * 10 ** 18); // $CITIZEN recognition
    }
  
    // Add an address to the whitelist.
    function addWhitelistAddress(address transferer) public onlyRole(DAO_ROLE) {
        _whitelist[transferer] = true;
        emit whitelistAddition(transferer);
    }

    // Remove an address from the whitelist.
    function removeWhitelistAddress(address transferer) public onlyRole(DAO_ROLE) {
        _whitelist[transferer] = false;
        emit whitelistRemoval(transferer);
    }

    // See if an address is on the whitelist.
    function onWhitelist(address transferer) public view returns (bool) {
        return _whitelist[transferer];
    }

    // Allow the DAO to remove transfer restrictions.
    function unlockTransfer() public onlyRole(DAO_ROLE) {
        _publicTransfer = true;
        emit TransferUnlocked();
    }

    // See if the sender is either on a whiteliss or if they have at least one $CITIZEN.
    function _validSender(address from) public view returns (bool) {
        require(_whitelist[from] == true || _citizenERC721.balanceOf(from) >= 1, "Sender needs a $CITIZEN or to be whitelisted.");
        return true;
    }

    // See if the recipient is either on a whiteliss or if they have at least one $CITIZEN.
    function _validRecipient(address to) public view returns (bool) {
        require(_whitelist[to] == true || _citizenERC721.balanceOf(to) >= 1, "Recipient needs a $CITIZEN or to be whitelisted.");
        return true;
    }

    function _mint(address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Capped) 
    {
        super._mint(to, amount);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._beforeTokenTransfer(from, to, amount);

        // If the sender is not the 0 address nor and publicTransfer is not enabled, check if sender and recipient are valid.
        if (from != address(0) && to != address(0) && _publicTransfer == false) {
            require(_validSender(from), "Invalid sender.");
            require(_validRecipient(to), "Invalid recipient.");
        }

    }
}
