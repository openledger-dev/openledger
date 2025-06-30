const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const {
  VOTING_PERIOD,
  VOTING_DELAY,
  TIMELOCK_DELAY,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  PROPOSAL_STATES,
} = require("./constants");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");

describe("Social Consensus Proposals", function () {
  let openLedgerGovernor;
  let gOpenToken;
  let timelock;
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;
  let treasury;

  beforeEach(async function () {
    const fixture = await loadFixture(deployGovernanceFixture);
    ({
      openLedgerGovernor,
      gOpenToken,
      timelock,
      owner,
      proposer,
      voter1,
      voter2,
      voter3,
      treasury,
    } = fixture);
    await setupVotingPower();

    // Give some tokens to the timelock for transfer tests - using owner who has fresh funds
    await gOpenToken
      .connect(owner)
      .deposit({ value: ethers.parseEther("100") });
    await gOpenToken
      .connect(owner)
      .transfer(timelock.target, ethers.parseEther("50"));
  });

  async function setupVotingPower() {
    // Reduced amounts to prevent fund exhaustion
    // Give proposer enough tokens to create proposals (1000+ GOPEN)
    const proposerAmount = ethers.parseEther("101");
    await gOpenToken.connect(proposer).deposit({ value: proposerAmount });
    await gOpenToken.connect(proposer).delegate(proposer.address);

    // Give voters smaller amounts for testing
    const voter1Amount = ethers.parseEther("80");
    await gOpenToken.connect(voter1).deposit({ value: voter1Amount });
    await gOpenToken.connect(voter1).delegate(voter1.address);

    const voter2Amount = ethers.parseEther("60");
    await gOpenToken.connect(voter2).deposit({ value: voter2Amount });
    await gOpenToken.connect(voter2).delegate(voter2.address);

    const voter3Amount = ethers.parseEther("40");
    await gOpenToken.connect(voter3).deposit({ value: voter3Amount });
    await gOpenToken.connect(voter3).delegate(voter3.address);

    // Mine some blocks to make delegations effective
    await mine(3);
  }
  describe("Type 2: Action Proposals (Transfer 10 Tokens)", function () {
    it("Should create and execute proposal to transfer 10 tokens", async function () {
      const transferAmount = ethers.parseEther("10");
      const description =
        "Social Consensus: Transfer 10 GOPEN tokens to community treasury";

      // Check initial balances
      const treasuryBalanceBefore = await gOpenToken.balanceOf(
        treasury.address
      );
      const timelockBalanceBefore = await gOpenToken.balanceOf(timelock.target);

      // Create action proposal for token transfer
      const targets = [gOpenToken.target];
      const values = [0];
      const calldatas = [
        gOpenToken.interface.encodeFunctionData("transfer", [
          treasury.address,
          transferAmount,
        ]),
      ];

      const tx = await openLedgerGovernor
        .connect(proposer)
        .propose(targets, values, calldatas, description);

      const receipt = await tx.wait();
      const proposalId = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      ).args.proposalId;

      // Advance past voting delay
      await time.increase(VOTING_DELAY + 1);

      // Vote to approve the transfer
      await openLedgerGovernor.connect(voter1).castVote(proposalId, 1); // For
      await openLedgerGovernor.connect(voter2).castVote(proposalId, 1); // For
      await openLedgerGovernor.connect(voter3).castVote(proposalId, 1); // For

      // Advance past voting period
      await time.increase(VOTING_PERIOD + 1);
      expect(await openLedgerGovernor.state(proposalId)).to.equal(
        PROPOSAL_STATES.SUCCEEDED
      );

      // Queue the proposal
      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      await openLedgerGovernor.queue(
        targets,
        values,
        calldatas,
        descriptionHash
      );
      expect(await openLedgerGovernor.state(proposalId)).to.equal(
        PROPOSAL_STATES.QUEUED
      );

      // Advance past timelock delay
      await time.increase(TIMELOCK_DELAY + 1);

      // Execute the proposal - this should transfer 10 tokens
      const executeTx = await openLedgerGovernor.execute(
        targets,
        values,
        calldatas,
        descriptionHash
      );

      // Verify execution
      expect(await openLedgerGovernor.state(proposalId)).to.equal(
        PROPOSAL_STATES.EXECUTED
      );

      // Verify token transfer happened
      const treasuryBalanceAfter = await gOpenToken.balanceOf(treasury.address);
      const timelockBalanceAfter = await gOpenToken.balanceOf(timelock.target);

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(
        transferAmount
      );
      expect(timelockBalanceBefore - timelockBalanceAfter).to.equal(
        transferAmount
      );
      await expect(executeTx).to.emit(openLedgerGovernor, "ProposalExecuted");
      await expect(executeTx)
        .to.emit(gOpenToken, "Transfer")
        .withArgs(timelock.target, treasury.address, transferAmount);
    });
  });
});
