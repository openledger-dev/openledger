const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

async function deployGovernanceFixture() {
  const [owner, proposer, voter1, voter2, voter3, treasury, addr1] = 
    await ethers.getSigners();

  const GOPEN = await ethers.getContractFactory("GOPEN");
  const gOpenToken = await GOPEN.deploy();

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const TIMELOCK_DELAY = 24 * 60 * 60; // 1 day
  const timelock = await TimelockController.deploy(
    TIMELOCK_DELAY,
    [], // proposers (empty initially)
    [], // executors (empty initially)
    owner.address // admin
  );

  const OpenLedgerGovernor = await ethers.getContractFactory("OpenLedgerGovernor");
  const openLedgerGovernor = await OpenLedgerGovernor.deploy(
    gOpenToken.target,
    timelock.target
  );

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

  await timelock.grantRole(PROPOSER_ROLE, openLedgerGovernor.target);
  await timelock.grantRole(EXECUTOR_ROLE, openLedgerGovernor.target);

  return {
    gOpenToken,
    timelock,
    openLedgerGovernor,
    owner,
    proposer,
    voter1,
    voter2,
    voter3,
    treasury,
    addr1,
    PROPOSER_ROLE,
    EXECUTOR_ROLE
  };
}

module.exports = {
  deployGovernanceFixture
};
