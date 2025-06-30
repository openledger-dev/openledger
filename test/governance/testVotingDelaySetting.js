const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");
const {
  VOTING_DELAY,
  EXECUTOR_ROLE,
  TIMELOCK_ADMIN_ROLE,
} = require("./constants");

describe("Voting Delay Setting", function () {
  let openLedgerGovernor;
  let gOpenToken;
  let timelock;
  let owner;
  let proposer;
  let voter1;
  let voter2;

  beforeEach(async function () {
    const deployment = await deployGovernanceFixture();
    openLedgerGovernor = deployment.openLedgerGovernor;
    gOpenToken = deployment.gOpenToken;
    timelock = deployment.timelock;
    owner = deployment.owner;
    proposer = deployment.proposer;
    voter1 = deployment.voter1;
    voter2 = deployment.voter2;
    await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
    await timelock.grantRole(TIMELOCK_ADMIN_ROLE, openLedgerGovernor.target);

    await setupVotingPower();
  });

  async function setupVotingPower() {
    const depositAmount = ethers.parseEther("101");
    await gOpenToken.connect(voter1).deposit({ value: depositAmount });
    await gOpenToken.connect(voter2).deposit({ value: depositAmount });
    await gOpenToken.connect(voter1).delegate(voter1.address);
    await gOpenToken.connect(voter2).delegate(voter2.address);
    await mine(3);
  }

  describe("Initial State", function () {
    it("Should have correct initial voting delay", async function () {
      const currentDelay = await openLedgerGovernor.votingDelay();
      expect(Number(currentDelay)).to.equal(VOTING_DELAY);
    });
  });

  describe("Access Control Tests", function () {
    it("Should revert when setVotingDelay is called directly by owner", async function () {
      await expect(openLedgerGovernor.setVotingDelay(86400))
        .to.be.revertedWithCustomError(
          openLedgerGovernor,
          "GovernorOnlyExecutor"
        )
        .withArgs(owner.address);
    });
  });

  describe("Governance-based Voting Delay Updates", function () {
    it("Should successfully reduce voting delay through governance", async function () {
      const newDelay = 12 * 60 * 60; // 12 hours

      const encodedFunctionCall =
        openLedgerGovernor.interface.encodeFunctionData("setVotingDelay", [
          newDelay,
        ]);

      const description = "Reduce voting delay to 12 hours";
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

      const proposeTx = await openLedgerGovernor
        .connect(voter1)
        .propose(
          [openLedgerGovernor.target],
          [0],
          [encodedFunctionCall],
          description
        );

      const receipt = await proposeTx.wait();
      const event = receipt.logs.find((log) => {
        try {
          return (
            openLedgerGovernor.interface.parseLog(log).name ===
            "ProposalCreated"
          );
        } catch {
          return false;
        }
      });
      const proposalId =
        openLedgerGovernor.interface.parseLog(event).args.proposalId;
      const votingDelay = await openLedgerGovernor.votingDelay();
      await mine(Number(votingDelay) + 1);

      await openLedgerGovernor.connect(voter1).castVote(proposalId, 1); // For
      await openLedgerGovernor.connect(voter2).castVote(proposalId, 1); // For

      const votingPeriod = await openLedgerGovernor.votingPeriod();
      await mine(Number(votingPeriod) + 1);
      await openLedgerGovernor.queue(
        [openLedgerGovernor.target],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );
      const timelockDelay = await timelock.getMinDelay();
      await time.increase(Number(timelockDelay) + 1);

      await openLedgerGovernor.execute(
        [openLedgerGovernor.target],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );
      const updatedDelay = await openLedgerGovernor.votingDelay();
      expect(Number(updatedDelay)).to.equal(newDelay);
    });
  });
});
