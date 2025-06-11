const { ethers } = require("hardhat");
const { expect } = require("chai");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("GOpen Token Complete Checkpoint Test", function () {
    let gOpen;
    let owner;
    let user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();
        
        // Deploy GOpen contract
        const GOpen = await ethers.getContractFactory("GOPEN");
        gOpen = await GOpen.deploy();
        await mine(1); // Mine a block to ensure deployment is complete
    });

    it("should demonstrate all checkpoint and voting scenarios", async function () {
        // Initial supply checks
        const initialTotalSupply = await gOpen.totalSupply();
        const currentTime = Number(await gOpen.clock());
        console.log("\nInitial State:");
        console.log("Total Supply:", ethers.formatEther(initialTotalSupply));
        console.log("Current Time:", currentTime);

        const pastTotalSupply = await gOpen.getPastTotalSupply(currentTime - 1);
        console.log("Past Total Supply:", ethers.formatEther(pastTotalSupply));

        // User1 deposits 1 ether
        console.log("\nDeposit 1 ETH:");
        await gOpen.connect(user1).deposit({ value: ethers.parseEther("1") });
        console.log("Deposit completed at time:", Number(await gOpen.clock()));

        // Skip 2 blocks
        await mine(2);
        console.log("\nAfter 2 blocks:");

        // Check user1 balance
        const user1Balance = await gOpen.balanceOf(user1.address);
        console.log("User1 Balance:", ethers.formatEther(user1Balance));

        // User1 delegates to themselves
        console.log("\nDelegate to self:");
        await gOpen.connect(user1).delegate(user1.address);
        console.log("Delegation completed at time:", Number(await gOpen.clock()));

        // Check delegation
        const delegatee = await gOpen.delegates(user1.address);
        console.log("User1's delegatee:", delegatee);

        // Skip 2 blocks
        await mine(2);
        console.log("\nAfter 2 more blocks:");

        // Check current votes
        const currentVotes = await gOpen.getVotes(user1.address);
        console.log("User1 Current Votes:", ethers.formatEther(currentVotes));

        // Skip 2 more blocks
        await mine(2);
        const timeForPastVotes = Number(await gOpen.clock());
        console.log("\nChecking past votes at time", timeForPastVotes);

        // Check past votes
        const pastVotes = await gOpen.getPastVotes(user1.address, timeForPastVotes - 1);
        console.log("User1 Past Votes:", ethers.formatEther(pastVotes));

        // Log total supply before withdrawal
        const totalSupplyBeforeWithdrawal = await gOpen.totalSupply();
        console.log("Total Supply before withdrawal:", ethers.formatEther(totalSupplyBeforeWithdrawal));

        // Withdraw 1 ETH
        console.log("\nWithdrawing 1 ETH:");
        await gOpen.connect(user1).withdraw(ethers.parseEther("1"));
        console.log("Withdrawal completed at time:", Number(await gOpen.clock()));

        // Skip 2 blocks
        await mine(2);
        console.log("\nAfter withdrawal and 2 blocks:");

        // Check votes after withdrawal
        const votesAfterWithdraw = await gOpen.getVotes(user1.address);
        console.log("User1 Votes after withdrawal:", ethers.formatEther(votesAfterWithdraw));

        // Skip 2 more blocks
        await mine(2);
        const finalTime = Number(await gOpen.clock());
        console.log("\nFinal checks at time", finalTime);

        // Check past votes after withdrawal
        const pastVotesAfterWithdraw = await gOpen.getPastVotes(user1.address, finalTime - 1);
        console.log("User1 Past Votes after withdrawal:", ethers.formatEther(pastVotesAfterWithdraw));

        // Get checkpoint count
        const numCheckpoints = await gOpen.numCheckpoints(user1.address);
        console.log("\nCheckpoint Information:");
        console.log("Number of checkpoints for User1:", numCheckpoints.toString());

        // Final supply checks
        const finalTotalSupply = await gOpen.totalSupply();
        const finalPastTotalSupply = await gOpen.getPastTotalSupply(finalTime - 1);
        console.log("\nFinal Supply State:");
        console.log("Final Total Supply:", ethers.formatEther(finalTotalSupply));
        console.log("Final Past Total Supply:", ethers.formatEther(finalPastTotalSupply));
        
        // Assertions to verify the behavior
        expect(user1Balance).to.equal(ethers.parseEther("1"), "Initial balance should be 1 ETH");
        expect(currentVotes).to.equal(ethers.parseEther("1"), "Votes after delegation should be 1");
        expect(votesAfterWithdraw).to.equal(0, "Votes after withdrawal should be 0");
        expect(finalTotalSupply).to.equal(0, "Final supply should be 0");
    });
});