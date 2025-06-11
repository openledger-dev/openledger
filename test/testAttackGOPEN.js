const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GOpen Token - Reentrancy Security Test", function () {
    let gopen;
    let attacker;
    let owner;
    let user1;
    let attackerContract;

    beforeEach(async function () {
        [owner, user1, attacker] = await ethers.getSigners();

        // Deploy GOpen contract
        const GOpen = await ethers.getContractFactory("GOPEN");
        gopen = await GOpen.deploy();
        await gopen.waitForDeployment();

        // Deploy Attacker contract
        const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttackerGOPEN");
        attackerContract = await ReentrancyAttacker.deploy(await gopen.getAddress());
        await attackerContract.waitForDeployment();
    });

    describe("Normal Operations", function () {
        it("Should handle deposit and withdrawal correctly", async function () {
            const amount = ethers.parseEther("1.0");
            
            // Deposit
            await gopen.connect(user1).deposit({ value: amount });
            expect(await gopen.balanceOf(user1.address)).to.equal(amount);
            
            // Withdraw
            await gopen.connect(user1).withdraw(amount);
            expect(await gopen.balanceOf(user1.address)).to.equal(0);
        });

        it("Should maintain correct ETH balance in contract", async function () {
            const amount = ethers.parseEther("2.0");
            
            // Multiple users deposit
            await gopen.connect(user1).deposit({ value: amount });
            await gopen.connect(owner).deposit({ value: amount });
            
            const contractBalance = await ethers.provider.getBalance(await gopen.getAddress());
            expect(contractBalance).to.equal(amount * 2n);
            
            // Partial withdrawal
            await gopen.connect(user1).withdraw(amount);
            const newContractBalance = await ethers.provider.getBalance(await gopen.getAddress());
            expect(newContractBalance).to.equal(amount);
        });
    });

    describe("Reentrancy Attack Prevention", function () {
        it("Should prevent reentrancy attacks - no profit extraction", async function () {
            const attackAmount = ethers.parseEther("1.0");
            
            // Fund attacker contract
            await owner.sendTransaction({
                to: await attackerContract.getAddress(),
                value: attackAmount
            });
            
            // Record initial states
            const initialContractBalance = await ethers.provider.getBalance(await gopen.getAddress());
            const initialAttackerBalance = await ethers.provider.getBalance(await attackerContract.getAddress());
            
            // Execute attack
            await attackerContract.startAttack({ value: attackAmount });
            
            // Get attack results
            const results = await attackerContract.getAttackResults();
            const [initialEth, initialTokens, finalEth, finalTokens, attackCount] = results;
            
            // Verify no profit was made
            expect(finalEth).to.equal(initialEth); // No ETH profit
            expect(finalTokens).to.equal(0); // No token profit
            expect(attackCount).to.be.greaterThan(0); // Attack was attempted
            
            // Verify contract state is correct
            const finalContractBalance = await ethers.provider.getBalance(await gopen.getAddress());
            const finalAttackerTokenBalance = await gopen.balanceOf(await attackerContract.getAddress());
            
            expect(finalContractBalance).to.equal(initialContractBalance); // Contract balance unchanged
            expect(finalAttackerTokenBalance).to.equal(0); // No tokens left
        });

        it("Should burn tokens before external call", async function () {
            const amount = ethers.parseEther("0.5");
            
            // Fund and execute attack
            await owner.sendTransaction({
                to: await attackerContract.getAddress(),
                value: amount
            });
            
            await attackerContract.startAttack({ value: amount });
            
            // Verify tokens were properly burned
            const attackerTokenBalance = await gopen.balanceOf(await attackerContract.getAddress());
            expect(attackerTokenBalance).to.equal(0);
            
            // Verify attack made no profit
            const results = await attackerContract.getAttackResults();
            expect(results[2]).to.equal(results[0]); // Final ETH = Initial ETH
        });

        it("Should handle multiple reentrancy attempts", async function () {
            const amount = ethers.parseEther("2.0");
            
            await owner.sendTransaction({
                to: await attackerContract.getAddress(),
                value: amount
            });
            
            await attackerContract.startAttack({ value: amount });
            
            const results = await attackerContract.getAttackResults();
            const attackCount = results[4];
            
            // Verify multiple attempts were made but all failed
            expect(attackCount).to.be.greaterThan(1);
            expect(results[2]).to.equal(results[0]); // No profit despite multiple attempts
        });
    });

    describe("Edge Cases", function () {
        it("Should handle small amounts correctly", async function () {
            const smallAmount = ethers.parseEther("0.001");
            
            await owner.sendTransaction({
                to: await attackerContract.getAddress(),
                value: smallAmount
            });
            
            await attackerContract.startAttack({ value: smallAmount });
            
            const results = await attackerContract.getAttackResults();
            expect(results[2]).to.equal(results[0]); // No profit even with small amounts
        });

        it("Should reject zero value operations", async function () {
            await expect(gopen.deposit({ value: 0 }))
                .to.be.revertedWithCustomError(gopen, "ZeroValueNotAllowed");
            
            await expect(gopen.withdraw(0))
                .to.be.revertedWithCustomError(gopen, "ZeroValueNotAllowed");
        });
    });

    describe("State Consistency", function () {
        it("Should maintain consistent state after attack attempts", async function () {
            const amount = ethers.parseEther("1.0");
            
            // Normal user operations before attack
            await gopen.connect(user1).deposit({ value: amount });
            const user1BalanceBefore = await gopen.balanceOf(user1.address);
            
            // Execute attack
            await owner.sendTransaction({
                to: await attackerContract.getAddress(),
                value: amount
            });
            await attackerContract.startAttack({ value: amount });
            
            // Verify normal user's balance is unaffected
            const user1BalanceAfter = await gopen.balanceOf(user1.address);
            expect(user1BalanceAfter).to.equal(user1BalanceBefore);
            
            // Normal user should still be able to withdraw
            await gopen.connect(user1).withdraw(user1BalanceAfter);
            expect(await gopen.balanceOf(user1.address)).to.equal(0);
        });
    });
});