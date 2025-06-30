const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");

describe("ProposalNeedsQueuing", function () {
  let openLedgerGovernor;
  let gOpenToken;
  let proposer;
  let voter1;

  beforeEach(async function () {
    const deployment = await deployGovernanceFixture();
    openLedgerGovernor = deployment.openLedgerGovernor;
    gOpenToken = deployment.gOpenToken;
    proposer = deployment.proposer;
    voter1 = deployment.voter1;
    const proposerAmount = ethers.parseEther("150"); // Above 100 threshold
    await gOpenToken.connect(proposer).deposit({ value: proposerAmount });
    await gOpenToken.connect(proposer).delegate(proposer.address);

    // Setup voting power for voter1
    const voter1Amount = ethers.parseEther("100");
    await gOpenToken.connect(voter1).deposit({ value: voter1Amount });
    await gOpenToken.connect(voter1).delegate(voter1.address);

    // Mine some blocks to make delegations effective
    await mine(3);
  });

  describe("Proposal Needs Queuing", function () {
    it("Should return true for signaling proposals (no action)", async function () {
      const description =
        "Signaling Proposal: Should we implement new feature?";

      // Create signaling proposal with no actual action
      const targets = [ethers.ZeroAddress];
      const values = [0];
      const calldatas = ["0x"];

      const tx = await openLedgerGovernor
        .connect(proposer)
        .propose(targets, values, calldatas, description);

      const receipt = await tx.wait();
      const proposalId = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      ).args.proposalId;

      // Test proposalNeedsQueuing function
      const needsQueuing = await openLedgerGovernor.proposalNeedsQueuing(
        proposalId
      );

      // Signaling proposals should need queuing in timelock governance
      expect(needsQueuing).to.be.true;
    });
  });
});
