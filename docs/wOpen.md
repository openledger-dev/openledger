# WOpen Token Documentation

## Overview

The `WOpen` token is an implementation of a wrapped token with deposit and withdraw capabilities. It is designed to securely handle Ether deposits and withdrawals while mitigating vulnerabilities such as the WETH permit attack.

### Key Features
- **Deposit and Withdraw**: Users can deposit Ether to mint `WOpen` tokens and withdraw Ether by burning `WOpen` tokens.
- **Security Enhancements**: The contract includes a `receive` function to handle Ether transfers securely, avoiding fallback-based vulnerabilities.
- **Compatibility**: Built on Solidity version `0.6.12` for enhanced security and compatibility.
- **Standard Compliance**: Fully ERC20 compliant with a 1:1 peg to the native Open token.

## Changes from Previous Implementations

### Previous Implementation
- **Solidity Version**: `>=0.4.22 <0.6`
- **Fallback Function**:
  ```solidity
  function() external payable {
      deposit();
  }
  ```
  - This fallback function was used to handle Ether transfers.
  - Vulnerable to WETH permit-style exploits due to reliance on fallback behavior.

### Current Implementation
- **Solidity Version**: `0.6.12`
- **Receive Function**:
  ```solidity
  /**
   * @notice Function to receive Ether. msg.data must be empty.
   * @dev Fallbacks are avoided to reduce attack surface and prevent WETH permit-style exploits.
   */
  receive() external payable {
       deposit();
  }
  ```
  - The `receive` function explicitly handles Ether transfers when `msg.data` is empty.
  - Reduces the attack surface and mitigates vulnerabilities associated with fallback functions.

## Forked Base Contract

The `WOpen` contract is forked from the [Base Network's WETH implementation](https://basescan.org/token/0x4200000000000000000000000000000000000006#code). The primary enhancement is the addition of the `receive` function to improve security.

## Test Scenarios

### 1. **BaseWETH Vulnerability to WETH Permit Attack**
- **Objective**: Demonstrate that the original `BaseWETH` contract is vulnerable to a WETH permit attack.
- **Test**:
  - Deploy `BaseWETH` and `ERC20Bank`.
  - Use `depositWithPermit` to exploit the vulnerability.
  - Verify that the attacker can drain the user's balance.

### 2. **WOpen Resilience to WETH Permit Attack**
- **Objective**: Verify that `WOpen` is not vulnerable to a WETH permit attack.
- **Test**:
  - Deploy `WOpen` and `ERC20Bank`.
  - Attempt to exploit `depositWithPermit`.
  - Verify that the transaction reverts and the user's balance remains intact.

### 3. **Withdraw Functionality for WOpen**
- **Objective**: Verify that users can withdraw Ether by burning `WOpen` tokens.
- **Test**:
  - Deposit Ether to mint `WOpen` tokens.
  - Withdraw Ether and verify that the user's balance is updated correctly.

### 4. **Reentrancy Prevention in WOpen**
- **Objective**: Ensure that `WOpen` is not vulnerable to reentrancy attacks.
- **Test**:
  - Deploy a reentrancy attacker contract.
  - Attempt to exploit the `withdraw` function.
  - Verify that the transaction reverts and the user's balance remains intact.

## Running and Testing Flow

### 1. Compile
Run the following command to compile the smart contracts:
```bash
npx hardhat compile
```

### 2. Deploy
Use the appropriate deployment script to deploy the `WOpen` contract. For example:
```bash
npx hardhat deploy ignition/modules/deployWOPEN.js --network <network-name>
```
Replace `<network-name>` with the desired network (e.g., `hardhat`, `sepolia`, `mainnet`).

### 3. Test
Run the following command to execute the tests for `WOpen`:
```bash
npm run test:WOpen
```
This will run the test files `test/testWOPEN.js` and `test/testAttackWOPEN.js`.

---

*Note: There is no NatSpec documentation added to the contract. This decision was made to align with the format followed by other blockchain implementations.*

## Security Contact

For any security concerns or vulnerabilities, please contact: `security@openledger.xyz`


## References

1. [ERC20 Exploit with WETH](https://coinsbench.com/erc20-exploit-with-weth-1c4ea02a52d8)
2. [WETH Permit Exploit Implementation](https://github.com/wezzcoetzee/weth-permit-exploit)
3. [Solidity by Example - WETH Permit Vulnerability](https://solidity-by-example.org/hacks/weth-permit/)

---

*Note: This documentation is maintained as part of the Open Ledger project. Last updated: June 2025*
