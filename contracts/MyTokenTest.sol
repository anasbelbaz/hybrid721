// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyTokenTest is ERC20 {

    constructor() ERC20("ERC20basic", "ABCDE") {
        _mint(msg.sender, 400000);
    }

   function decimals() public view virtual override returns (uint8) {
     return 18;  // eg. return 12;
   }
}