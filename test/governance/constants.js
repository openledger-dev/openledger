const { ethers } = require("hardhat");
module.exports = {
  VOTING_PERIOD: 2 * 7 * 24 * 60 * 60, // 2 weeks in seconds
  VOTING_DELAY: 1 * 24 * 60 * 60, // 1 day in seconds
  TIMELOCK_DELAY: 24 * 60 * 60, // 1 day
  PROPOSAL_THRESHOLD: ethers.parseUnits("100", 18),
  PROPOSER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE")),
  EXECUTOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE")),
  TIMELOCK_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")),
  PROPOSAL_STATES: {
    PENDING: 0,
    ACTIVE: 1,
    CANCELED: 2,
    DEFEATED: 3,
    SUCCEEDED: 4,
    QUEUED: 5,
    EXPIRED: 6,
    EXECUTED: 7
  }
};
