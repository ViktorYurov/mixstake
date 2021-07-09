//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is Ownable, ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }    
}