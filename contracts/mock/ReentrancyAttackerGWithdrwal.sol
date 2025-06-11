// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "../GOPEN.sol";

contract ReentrancyAttackerGWithdrwal {
    GOPEN  public gOpen;
    bool public attacking;

    constructor(address payable _gOpen) {
        gOpen = GOPEN(_gOpen);
    }

    // Function to start the attack
    function attack() external {
        require(gOpen.balanceOf(address(this)) > 0, "No tokens to attack with");
        uint256 balance = gOpen.balanceOf(address(this));
        attacking = true;
        // Attempt first withdrawal
        gOpen.withdraw(balance);
    }

    // Fallback function that attempts reentrancy
    receive() external payable {
        if (attacking) {
            attacking = false; // Prevent infinite recursion
            // Try to withdraw again - should fail as tokens are already burned
            gOpen.withdraw(msg.value);
        }
    }
}
