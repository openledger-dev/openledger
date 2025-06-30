// This would be saved as test/governance/testProposalThresholdSetting.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");
const {
  VOTING_DELAY,
  VOTING_PERIOD,
  PROPOSAL_THRESHOLD,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  TIMELOCK_DELAY,
  TIMELOCK_ADMIN_ROLE,
} = require("./constants");

describe("Proposal Threshold Setting", function () {
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
    await gOpenToken.connect(proposer).deposit({ value: depositAmount });
    await gOpenToken.connect(voter1).deposit({ value: depositAmount });
    await gOpenToken.connect(voter2).deposit({ value: depositAmount });

    await gOpenToken.connect(proposer).delegate(proposer.address);
    await gOpenToken.connect(voter1).delegate(voter1.address);
    await gOpenToken.connect(voter2).delegate(voter2.address);
    await mine(3);
  }

  describe("Initial State", function () {
    it("Should have correct initial proposal threshold", async function () {
      const currentThreshold = await openLedgerGovernor.proposalThreshold();
      expect(currentThreshold).to.equal(PROPOSAL_THRESHOLD);
      console.log(
        `    ✓ Initial proposal threshold: ${ethers.formatEther(
          currentThreshold
        )} GOPEN`
      );
    });
  });

  describe("Access Control Tests", function () {
    it("Should revert when setProposalThreshold is called directly by owner", async function () {
      const newThreshold = ethers.parseUnits("500", 18);

      await expect(
        openLedgerGovernor.connect(owner).setProposalThreshold(newThreshold)
      ).to.be.reverted;
    });

    it("Should revert when setProposalThreshold is called directly by any user", async function () {
      const newThreshold = ethers.parseUnits("500", 18);

      await expect(
        openLedgerGovernor.connect(voter1).setProposalThreshold(newThreshold)
      ).to.be.reverted;

      await expect(
        openLedgerGovernor.connect(voter2).setProposalThreshold(newThreshold)
      ).to.be.reverted;
    });
  });

  describe("Governance-based Proposal Threshold Updates", function () {
    it("Should successfully reduce proposal threshold through governance", async function () {
      const newThreshold = ethers.parseUnits("500", 18); // Reduce to 500 tokens

      // Encode the function call
      const encodedFunctionCall =
        openLedgerGovernor.interface.encodeFunctionData(
          "setProposalThreshold",
          [newThreshold]
        );

      // Create proposal
      const proposalDescription =
        "Reduce proposal threshold to 500 tokens for increased accessibility";
      const proposeTx = await openLedgerGovernor
        .connect(proposer)
        .propose(
          [openLedgerGovernor.target],
          [0],
          [encodedFunctionCall],
          proposalDescription
        );

      const proposeReceipt = await proposeTx.wait();
      const proposalId = proposeReceipt.logs[0].args.proposalId;

      await time.increase(VOTING_DELAY + 1);
      await mine(1);

      await openLedgerGovernor.connect(voter1).castVote(proposalId, 1); // Vote FOR
      await openLedgerGovernor.connect(voter2).castVote(proposalId, 1); // Vote FOR

      await time.increase(VOTING_PERIOD + 1);
      await mine(1);

      const descriptionHash = ethers.id(proposalDescription);
      await openLedgerGovernor.queue(
        [openLedgerGovernor.target],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );

      await time.increase(24 * 60 * 60 + 1);

      await openLedgerGovernor.execute(
        [openLedgerGovernor.target],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );

      // Verify the threshold was updated
      const updatedThreshold = await openLedgerGovernor.proposalThreshold();
      expect(updatedThreshold).to.equal(newThreshold);
      console.log(
        `    ✓ Proposal threshold updated to: ${ethers.formatEther(
          updatedThreshold
        )} GOPEN`
      );
    });
  });
});
