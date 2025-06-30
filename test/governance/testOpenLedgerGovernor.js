const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");
const { deployGovernanceFixture } = require("./fixtures/governanceFixture");
const {
  TIMELOCK_DELAY,
  VOTING_PERIOD,
  VOTING_DELAY,
  PROPOSAL_THRESHOLD,
} = require("./constants");

describe("OpenLedgerGovernor", function () {
  let openLedgerGovernor;
  let gOpenToken;
  let timelock;
  let owner;
  let voter;

  beforeEach(async function () {
    const deployment = await deployGovernanceFixture();
    openLedgerGovernor = deployment.openLedgerGovernor;
    gOpenToken = deployment.gOpenToken;
    timelock = deployment.timelock;
    owner = deployment.owner;
    voter = deployment.voter1;
  });

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await openLedgerGovernor.name()).to.equal("OpenLedger");
    });

    it("Should set the right voting period", async function () {
      expect(await openLedgerGovernor.votingPeriod()).to.equal(VOTING_PERIOD);
    });

    it("Should set the right voting delay", async function () {
      expect(await openLedgerGovernor.votingDelay()).to.equal(VOTING_DELAY);
    });

    it("Should set the right proposal threshold", async function () {
      expect(await openLedgerGovernor.proposalThreshold()).to.equal(
        PROPOSAL_THRESHOLD
      );
    });
  });

  describe("Voting Power", function () {
    it("Should return correct voting power with getVotes", async function () {
      const depositAmount = ethers.parseEther("10");
      await gOpenToken.connect(voter).deposit({ value: depositAmount });

      const balance = await gOpenToken.balanceOf(voter.address);
      expect(balance).to.equal(depositAmount);

      await gOpenToken.connect(voter).delegate(voter.address);

      const delegatee = await gOpenToken.delegates(voter.address);
      expect(delegatee).to.equal(voter.address);

      await mine(3);

      const tokenVotes = await gOpenToken.getVotes(voter.address);
      expect(tokenVotes).to.equal(depositAmount);

      const currentTimepoint = await openLedgerGovernor.clock();

      const pastTimepoint = currentTimepoint - 1n;

      const governorVotes = await openLedgerGovernor.getVotes(
        voter.address,
        pastTimepoint
      );

      expect(governorVotes).to.equal(depositAmount);
    });
  });
});
