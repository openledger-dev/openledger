const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { VOTING_PERIOD, VOTING_DELAY, TIMELOCK_DELAY, PROPOSER_ROLE,  EXECUTOR_ROLE, PROPOSAL_STATES} = require("./constants");

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
    [owner, proposer, voter1, voter2, voter3, treasury] =
      await ethers.getSigners();

    // Deploy GOPEN token
    const GOPEN = await ethers.getContractFactory("GOPEN");
    gOpenToken = await GOPEN.deploy();

    // Deploy TimelockController
    const TimelockController = await ethers.getContractFactory(
      "TimelockController"
    );
    timelock = await TimelockController.deploy(
      TIMELOCK_DELAY,
      [], // proposers (empty initially)
      [], // executors (empty initially)
      owner.address // admin
    );

    // Deploy OpenLedgerGovernor
    const OpenLedgerGovernor = await ethers.getContractFactory(
      "OpenLedgerGovernor"
    );
    openLedgerGovernor = await OpenLedgerGovernor.deploy(
      gOpenToken.target,
      timelock.target
    );

    await timelock.grantRole(PROPOSER_ROLE, openLedgerGovernor.target);
    await timelock.grantRole(EXECUTOR_ROLE, openLedgerGovernor.target);

    // Setup voting power for participants
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
    const proposerAmount = ethers.parseEther("200");
    await gOpenToken.connect(proposer).deposit({ value: proposerAmount });
    await gOpenToken.connect(proposer).delegate(proposer.address);

    const voter1Amount = ethers.parseEther("80");
    await gOpenToken.connect(voter1).deposit({ value: voter1Amount });
    await gOpenToken.connect(voter1).delegate(voter1.address);

    const voter2Amount = ethers.parseEther("60");
    await gOpenToken.connect(voter2).deposit({ value: voter2Amount });
    await gOpenToken.connect(voter2).delegate(voter2.address);

    const voter3Amount = ethers.parseEther("40");
    await gOpenToken.connect(voter3).deposit({ value: voter3Amount });
    await gOpenToken.connect(voter3).delegate(voter3.address);

    await mine(3);
  }

  describe("Type 1: Signaling Proposals (Nothing Happens)", function () {
    it("Should create and execute signaling proposal with no on-chain action", async function () {
      const description =
        "Social Consensus: Should we implement community rewards program?";

      const tx = await openLedgerGovernor.connect(proposer).propose(
        [ethers.ZeroAddress],
        [0],
        ["0x"],
        description
      );

      const receipt = await tx.wait();
      const proposalCreatedEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      const proposalId = proposalCreatedEvent.args.proposalId;

      expect(proposalId).to.not.be.undefined;
      expect(await openLedgerGovernor.state(proposalId)).to.equal(PROPOSAL_STATES.PENDING);

      await time.increase(VOTING_DELAY + 1);
      expect(await openLedgerGovernor.state(proposalId)).to.equal(PROPOSAL_STATES.ACTIVE);

      await openLedgerGovernor.connect(voter1).castVote(proposalId, 1); // For
      await openLedgerGovernor.connect(voter2).castVote(proposalId, 1); // For
      await openLedgerGovernor.connect(voter3).castVote(proposalId, 1); // For

      await time.increase(VOTING_PERIOD + 1);
      expect(await openLedgerGovernor.state(proposalId)).to.equal(PROPOSAL_STATES.SUCCEEDED);

      const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
      await openLedgerGovernor.queue(
        [ethers.ZeroAddress],
        [0],
        ["0x"],
        descriptionHash
      );
      expect(await openLedgerGovernor.state(proposalId)).to.equal(PROPOSAL_STATES.QUEUED);
      await time.increase(TIMELOCK_DELAY + 1);
      const executeTx = await openLedgerGovernor.execute(
        [ethers.ZeroAddress],
        [0],
        ["0x"],
        descriptionHash
      );
      expect(await openLedgerGovernor.state(proposalId)).to.equal(PROPOSAL_STATES.EXECUTED);
      await expect(executeTx).to.emit(openLedgerGovernor, "ProposalExecuted");
    });

    it("Should track voting results for signaling proposals", async function () {
      const description = "Social Consensus: Change in community guidelines";

      const tx = await openLedgerGovernor
        .connect(proposer)
        .propose([ethers.ZeroAddress], [0], ["0x"], description);

      const receipt = await tx.wait();
      const proposalId = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      ).args.proposalId;

      await time.increase(VOTING_DELAY + 1);

      // Different voting patterns
      await openLedgerGovernor
        .connect(voter1)
        .castVoteWithReason(
          proposalId,
          1,
          "Strongly support this community initiative"
        );
      await openLedgerGovernor
        .connect(voter2)
        .castVoteWithReason(
          proposalId,
          0,
          "Need more discussion before implementation"
        );
      await openLedgerGovernor
        .connect(voter3)
        .castVoteWithReason(proposalId, 2, "Neutral on this topic");

      // Check vote counts
      const votes = await openLedgerGovernor.proposalVotes(proposalId);
      expect(votes.forVotes).to.equal(ethers.parseEther("80")); // voter1
      expect(votes.againstVotes).to.equal(ethers.parseEther("60")); // voter2
      expect(votes.abstainVotes).to.equal(ethers.parseEther("40")); // voter3
    });
  });
});
