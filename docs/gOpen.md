# GOpen Token Documentation

## Overview

GOpen (GOPEN) is a governance token that represents wrapped OPN tokens at a 1:1 ratio. It extends the standard ERC20 functionality with governance capabilities through OpenZeppelin's ERC20Votes extension, enabling token holders to participate in on-chain governance.

## Features

### 1. Token Details
- **Name**: GOpen
- **Symbol**: GOPEN
- **Decimals**: 18
- **Total Supply**: Dynamic (based on OPN deposits)

### 2. Core Functionalities

#### Wrapping Mechanism
- **Deposit**: Users can deposit OPN to receive GOPEN tokens at a 1:1 ratio
- **Withdraw**: Users can burn their GOPEN tokens to receive back OPN at a 1:1 ratio

#### Governance Features
- **Voting Power**: Each GOPEN token represents one vote
- **Vote Delegation**: Token holders can delegate their voting power to other addresses
- **Vote Tracking**: Historical voting power is tracked through checkpoints
- **ERC20Permit**: Gasless token approvals through off-chain signatures

### 3. Security Features

#### Smart Contract Security
- Follows checks-effects-interactions pattern
- Built on audited OpenZeppelin contracts
- Includes reentrancy protection through state management
- Balance validations for deposits and withdrawals

## Technical Integration

### Contract Addresses
- Mainnet: [To be deployed]
- Testnet (Sepolia): [To be deployed]

### Key Functions

```solidity
// Deposit OPN to receive GOPEN
function deposit() public payable

// Withdraw OPN by burning GOPEN
function withdraw(uint amt) public

// Delegate votes to another address
function delegate(address delegatee) public virtual

// Get current votes for an account
function getVotes(address account) public view returns (uint256)

// Get voting power at a past block
function getPastVotes(address account, uint256 blockNumber) public view returns (uint256)
```

### Governance Integration

1. **Vote Delegation**
```typescript
// Delegate votes to self
await gOpen.delegate(userAddress);

// Delegate to another address
await gOpen.delegate(delegateAddress);
```

2. **Checking Voting Power**
```typescript
// Get current voting power
const votes = await gOpen.getVotes(userAddress);

// Get historical voting power
const pastVotes = await gOpen.getPastVotes(userAddress, blockNumber);
```

3. **Using Permit**
```typescript
// Generate permit signature off-chain
const signature = await generatePermitSignature({
    owner,
    spender,
    value,
    nonce,
    deadline
});

// Submit permit transaction
await gOpen.permit(
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s
);
```

## Usage as a Governance Token

### Governance Mechanism

1. **Token Distribution**
- GOPEN tokens are minted when users deposit OPN
- 1 OPN = 1 GOPEN = 1 Vote
- Voting power is activated when tokens are self-delegated

2. **Voting Power**
- Voting power is determined by token balance
- Users must delegate their voting power (to themselves or others)
- Historical snapshots enable voting based on past balances

3. **Governance Participation**
- Proposal Creation (through governance contract)
- Voting on Proposals
- Vote Delegation
- Quorum Tracking

### Best Practices

1. **For Token Holders**
- Always delegate your voting power (even if to yourself)
- Monitor proposal deadlines
- Check voting power before important governance events

2. **For Integrators**
- Verify contract interactions
- Implement proper error handling
- Monitor events for state changes

## Events

```solidity
event Deposit(address indexed sender, uint256 amt);
event Withdrawal(address indexed sender, uint256 amt);
// Additional ERC20 and voting events inherited from OpenZeppelin
```

## Security Considerations

1. **Collateral Management**
- Contract always maintains 1:1 backing of GOPEN:OPN
- Withdrawals are checked against contract balance
- No minting without corresponding OPN deposit

2. **Governance Safety**
- Delegation changes take effect on next block
- Vote counting follows checkpoints for accurate historical data
- Protected against flash loan attacks through snapshot mechanism

3. **Technical Safeguards**
- Comprehensive input validation
- Protected against reentrancy attacks
- Emergency controls (if implemented in governance)

## Development and Testing

### Local Development
```bash
# Install dependencies
npm install

# Run tests
npm run test:GOpen

# Deploy contract
npx hardhat deploy --network [network] ignition/modules/deployGOPEN.js
```

### Testing Coverage
- Unit tests cover all core functionalities
- Integration tests for governance features
- Security tests for edge cases and attack vectors

## License
MIT License