openledger/docs/governance.md
# OpenLedger Governance Overview

## Introduction

This document provides an overview of the governance system implemented in OpenLedger, referencing the `OpenLedgerGovernor` smart contract and the associated governance test suite. It is intended for auditors and stakeholders who require insight into the protocol’s on-chain governance mechanisms, parameters, and security considerations.

---

## Governance Architecture

OpenLedger’s governance is based on the OpenZeppelin Governor framework, extended for advanced features and robust security. The core contract, `OpenLedgerGovernor`, manages proposal creation, voting, and execution, leveraging a timelock for secure and transparent upgrades.

### Key Components

- **Governor Contract:** `OpenLedgerGovernor` (see `contracts/OpenLedgerGovernor.sol`)
- **Governance Token:** GOpen (GOPEN) — see `gOpen.md`
- **Timelock Controller:** Enforces execution delays for approved proposals
- **Voting Power:** Derived from GOpen token balances (ERC20Votes extension)
- **Test Suite:** Comprehensive tests in `test/governance/`

---

## Governance Process

### 1. Proposal Creation

- Any address holding at least the **proposal threshold** of GOpen tokens can create a proposal.
- **Proposal Threshold:** 100 GOPEN
- Proposals specify actions to be executed by the protocol if approved.

### 2. Voting

- **Voting Delay:** 1 day after proposal creation before voting starts.
- **Voting Period:** 2 weeks for token holders to cast votes.
- Each GOpen token equals one vote; voting power can be delegated.
- Votes are tracked and checkpointed for transparency.

### 3. Quorum and Approval

- **Quorum:** 25% of total GOpen supply must participate for a proposal to be valid.
- Proposals pass if they receive more "For" than "Against" votes and meet quorum.

### 4. Timelock and Execution

- **Timelock Delay:** 1 day after proposal approval before execution.
- Only proposals that pass all checks and delays are executed by the Timelock Controller.
- Timelock ensures time for review and potential intervention before changes are applied.

### 5. Proposal States

Proposals transition through the following states:

- Pending
- Active
- Canceled
- Defeated
- Succeeded
- Queued
- Expired
- Executed

---

## Security Features

- **Battle-tested Modules:** Built on OpenZeppelin Governor, Timelock, and ERC20Votes.
- **Role-Based Access:** Timelock roles (Proposer, Executor, Admin) are strictly managed.
- **Reentrancy Protection:** Follows checks-effects-interactions pattern.
- **Test Coverage:** All governance logic is covered by automated tests (see `test/governance/`).

---

## Governance Parameters

| Parameter            | Value                | Description                                 |
|----------------------|----------------------|---------------------------------------------|
| Voting Period        | 2 weeks              | Duration for voting on proposals            |
| Voting Delay         | 1 day                | Delay before voting starts                  |
| Timelock Delay       | 1 day                | Delay before execution after approval       |
| Proposal Threshold   | 100 GOPEN            | Minimum tokens to create a proposal         |
| Quorum               | 25%                  | Minimum participation for proposal validity |

---

## Commands: Install, Compile, Test, Coverage, and Deploy

To work with OpenLedger governance contracts, use the following commands from the project root:

```sh
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test test/governance/**/*.js

# Generate coverage report
npx hardhat coverage

# Deploy governance contracts (replace [network] with your target network)
npx hardhat ignition deploy ignition/modules/deployGovernor.js --network [network]
```

---

## Test Coverage

The `OpenLedgerGovernor.sol` contract, which implements the core governance logic, is covered by a comprehensive automated test suite. As of the latest coverage report:

- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

This demonstrates rigorous testing of the proposal lifecycle, parameter changes, role management, and edge cases for the governance system.

---

## Testing and Auditability

The `test/governance/` directory contains comprehensive tests for:

- Proposal lifecycle (creation, voting, queuing, execution, cancellation)
- Parameter changes (voting period, delay, threshold)
- Social consensus proposals
- Timelock and role management
- Edge cases and failure scenarios

These tests ensure the correctness and resilience of the governance system.

---

## References

- `contracts/OpenLedgerGovernor.sol` — Core governance contract
- `test/governance/` — Governance test suite
- `docs/gOpen.md` — GOpen governance token details
- OpenZeppelin Governor documentation: https://docs.openzeppelin.com/contracts/4.x/governance

---

## Contact

For security concerns or audit questions, contact: **security@openledger.xyz**