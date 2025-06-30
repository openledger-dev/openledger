const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");
const {
  TIMELOCK_DELAY,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  PROPOSAL_STATES,
} = require("./constants");

describe("Proposal Cancellation", function () {
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
    const voter1Amount = ethers.parseEther("50");
    await gOpenToken.connect(voter1).deposit({ value: voter1Amount });
    await gOpenToken.connect(voter1).delegate(voter1.address);

    // Mine some blocks to make delegations effective
    await mine(3);
  });

  describe("Cancel Proposal", function () {
    it("Should allow proposer to cancel their own proposal", async function () {
      const description = "Test proposal to be canceled by proposer";
      const targets = [ethers.ZeroAddress];
      const values = [0];
      const calldatas = ["0x"];

      // Create a proposal
      const tx = await openLedgerGovernor
        .connect(proposer)
        .propose(targets, values, calldatas, description);

      const receipt = await tx.wait();
      const proposalId = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      ).args.proposalId;

      // Verify proposal is created and in Pending state
      expect(await openLedgerGovernor.state(proposalId)).to.equal(
        PROPOSAL_STATES.PENDING
      );

      // Proposer cancels their own proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

      const cancelTx = await openLedgerGovernor
        .connect(proposer)
        .cancel(targets, values, calldatas, descriptionHash);

      // Verify the proposal is canceled
      expect(await openLedgerGovernor.state(proposalId)).to.equal(
        PROPOSAL_STATES.CANCELED
      );

      // Verify ProposalCanceled event was emitted
      await expect(cancelTx)
        .to.emit(openLedgerGovernor, "ProposalCanceled")
        .withArgs(proposalId);
    });
  });
});
