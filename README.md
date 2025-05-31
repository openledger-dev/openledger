# Open Gas Token (OPEN)

Open (OPEN) is an ERC20 token designed to serve as the native gas token for an Optimism-based rollup chain. This implementation follows strict security practices and is prepared for security audits.

## Overview

- **Token Name:** Open (< 32 bytes)
- **Symbol:** OPEN (< 32 bytes)
- **Decimals:** 18 (enforced)
- **Total Supply:** 1,000,000,000 (1 billion) tokens
- **Standard:** ERC20 (OpenZeppelin v5.3.0)
- **Features:** Burnable (ERC20Burnable)
- **Solidity Version:** 0.8.27
- **Purpose:** Gas token for Optimism rollup
- **Specification:** [Optimism Custom Gas Token Standard](https://specs.optimism.io/experimental/custom-gas-token.html)

## Features

### Burn Functionality
The Open token implements ERC20Burnable, which provides the following capabilities:
- `burn(uint256 amount)`: Allows token holders to destroy their own tokens
- `burnFrom(address account, uint256 amount)`: Allows approved addresses to destroy tokens from another account

### Test Coverage
The contract maintains 100% test coverage across all functions and branches:
- ✓ Basic ERC20 functionality (transfer, approve, transferFrom)
- ✓ Burn functionality (burn, burnFrom)
- ✓ Supply management (minting in constructor, burning effects)
- ✓ Access control (permissions for burning)
- ✓ Event emission verification

## Optimism Gas Token Compliance

### Required Properties

1. **Standard ERC20 Compliance**

   - Implemented as L1 contract
   - Uses standard OpenZeppelin ERC20 implementation
   - No custom modifications to core ERC20 functionality

2. **Enforced Constraints**
   - Fixed 18 decimals (enforced on-chain)
   - Name length < 32 bytes (enforced on-chain)
   - Symbol length < 32 bytes (enforced on-chain)
   - No double entrypoint implementation

### Prohibited Features (Not Implemented)

The token explicitly DOES NOT include:

- Fee on transfer mechanisms
- Rebasing logic
- Transfer hooks
- Non-standard decimals
- External balance modification methods
- Token upgradeability

## Security Features

1. **Immutable State Variables & Functionality:**

   - Token name and symbol are declared as internal constants
   - Implementation inherits from audited OpenZeppelin contracts
   - Burn functionality is implemented through standard OpenZeppelin's ERC20Burnable
   - All token burns are tracked through standard Transfer events to address(0)

2. **Security Considerations:**

   - No mint function beyond initial supply
   - No owner privileges or special admin functions
   - No upgradeable patterns to ensure immutability
   - Fixed total supply for economic stability

3. **Audit Readiness:**
   - Complete NatSpec documentation
   - 100% test coverage
   - No external dependencies beyond OpenZeppelin
   - Follows best practices for gas tokens

## Technical Details

### Contract Architecture

```solidity
contract Open is ERC20, ERC20Burnable {
    // Inherits from OpenZeppelin's ERC20 and ERC20Burnable
    // Fixed supply minted at deployment
    // Includes standard burn functionality
    // No additional custom functionality
}
```

### Gas Token Economics

- Fixed supply model
- No inflation mechanism
- Designed for Optimism rollup gas payments
- Compatible with Optimism's L2 gas model

## Development and Testing

### Prerequisites

```bash
node >= 18.0.0
npm >= 8.0.0
```

### Installation

```bash
npm install
```

### Key Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Generate coverage report
npm run coverage

# Deploy to hardhat network
npm run deploy:hardhat
```

### Test Coverage

The contract maintains 100% test coverage across all metrics:

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## Deployment

### Hardhat Ignition Deployment

The contract uses Hardhat Ignition for deterministic deployments:

```javascript
npx hardhat ignition deploy ./ignition/modules/deployOPEN.js
```

### Verification

After deployment, verify the following:

1. Total supply is exactly 1,000,000,000 tokens
2. All tokens are initially assigned to the specified recipient
3. Contract is verified on the block explorer
4. Token metadata (name, symbol, decimals) is correct

## Security Considerations

### For Security Auditors

1. **Token Supply**

   - Initial supply is fixed
   - No additional minting capability
   - Supply cannot be reduced (no burn function)

2. **Access Control**

   - No privileged roles
   - No admin functions
   - No upgradeable patterns

3. **Standards Compliance**

   - Pure ERC20 implementation
   - Implements ERC20 events correctly
   - Uses OpenZeppelin's battle-tested implementation

4. **Gas Considerations**
   - Optimized for L2 operations
   - No unnecessary storage operations
   - Efficient transfer mechanisms

### Known Considerations

1. Once deployed, the contract is immutable
2. No ability to upgrade or modify functionality
3. No emergency pause functionality
4. Relies on L2 bridge for cross-chain operations

## L2 Gas Token Integration

### Optimism Integration Points

This token implementation strictly follows the [Optimism Custom Gas Token Standard](https://specs.optimism.io/experimental/custom-gas-token.html):

1. **Core Requirements**

   - Implemented as an L1 ERC20 contract
   - Exactly 18 decimals (on-chain enforcement)
   - Name and symbol under 32 bytes (on-chain enforcement)

2. **Prohibited Features (NOT implemented)**

   - No fee-on-transfer mechanisms
   - No rebasing functionality
   - No transfer hooks
   - No external balance modifications
   - No double entrypoint design

3. **Integration Features**
   - Compatible with Optimism's gas fee model
   - Direct integration with L2 fee mechanisms
   - Supports efficient cross-chain operations

### Cross-Chain Considerations

- L1 <-> L2 bridge compatibility
- Gas token conversion mechanisms
- Bridge security implications


## Audit Preparation Checklist

- [x] Complete test coverage
- [x] NatSpec documentation
- [x] Security considerations documented
- [x] Gas optimizations implemented
- [x] No centralization risks
- [x] No external dependencies except OpenZeppelin
- [x] Clear deployment procedures
- [x] Known limitations documented

## Optimism Gas Token Verification

Pre-deployment verification checklist:

- [ ] Verify token decimals is exactly 18
- [ ] Verify name length is less than 32 bytes
- [ ] Verify symbol length is less than 32 bytes
- [ ] Verify no fee-on-transfer mechanism exists
- [ ] Verify no rebasing logic is present
- [ ] Verify no transfer hooks are implemented
- [ ] Verify no external balance modification methods
- [ ] Verify no double entrypoint implementation
- [ ] Verify L1 contract deployment readiness
- [ ] Verify bridge compatibility
