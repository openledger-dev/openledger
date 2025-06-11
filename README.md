# Openledger Ecosystem

## Overview

This repository contains the core smart contracts for the Openledger ecosystem, featuring the native OPN token, WOPEN and its governance wrapper GOPEN.

## Smart Contracts

### Open.sol (OPN Token)
- Native token of the Openledger ecosystem with advanced ERC20 capabilities
- Implements EIP-2612 permit functionality for gasless approvals
- Features built-in decimals (18) and standard transfer/approval mechanisms
- Designed with security-first approach following OpenZeppelin standards
- Powers the core functionality of the Openledger ecosystem

### GOpen.sol (Governance Token)
- Governance wrapper for OPN tokens maintaining 1:1 backing ratio
- Implements ERC20Votes for on-chain governance capabilities
- Features vote delegation and historical vote tracking through checkpoints
- Allows secure wrapping and unwrapping of OPN tokens
- Protects against common attack vectors with comprehensive security measures


### WOpen.sol (WOPEN Wrapped Ether-Compatible Token)
- Implementation of a wrapped token with deposit and withdrawal capabilities
- Users can deposit Ether to mint WOpen tokens and withdraw Ether by burning them
- Security enhancements: Uses a receive() function to securely handle Ether deposits and prevent fallback-based vulnerabilities like the WETH permit attack
- Compatibility: Built on Solidity 0.6.12 for security and compatibility guarantees
- Fully ERC20-compliant with a 1:1 peg to the native Open token


## Network Information

The contracts are deployed on:
- Openledger Testnet (ChainID: 161201)
- Openledger mainnet (ChainID: 1612) (Planned)
- Ethereum Sepolia Testnet
- Ethereum Mainnet (Planned)

## Development

```bash
# Install dependencies
npm install

# Run tests
npx hardhat test

# Deploy contracts
npx hardhat ignition deploy ignition/modules/deployOPEN.js --network sepolia
npx hardhat ignition deploy ignition/modules/deployGOPEN.js --network openledger-testnet
npx hardhat ignition deploy ignition/modules/deployWOPEN.js --network openledger-testnet
```

# list networks
 npx hardhat verify --list-networks

## Security

- All contracts use OpenZeppelin's battle-tested implementations
- Comprehensive test coverage for all functionality
- Follows best practices for smart contract development
- Regular security audits (recommended before mainnet deployment)

## Documentation

For detailed documentation:

- [Open Token Documentation](./docs/open.md)
- [WOPEN Token Documentation](./docs/wOpen.md)
- [GOpen Token Documentation](./docs/gOpen.md)
