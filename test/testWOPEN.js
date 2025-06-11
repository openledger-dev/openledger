const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WOpen", function () {
  let wOpen;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const WOpen = await ethers.getContractFactory("WOPEN");
    wOpen = await WOpen.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await wOpen.name()).to.equal("Wrapped Open");
      expect(await wOpen.symbol()).to.equal("WOPEN");
      expect(await wOpen.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await wOpen.totalSupply()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should mint tokens when depositing ETH", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      // Test deposit via deposit() function
      await expect(wOpen.deposit({ value: depositAmount }))
        .to.emit(wOpen, "Deposit")
        .withArgs(owner.address, depositAmount);

      expect(await wOpen.balanceOf(owner.address)).to.equal(depositAmount);
      
      // Test deposit via fallback function
      await expect(owner.sendTransaction({
        to: wOpen.target,
        value: depositAmount
      }))
        .to.emit(wOpen, "Deposit")
        .withArgs(owner.address, depositAmount);

      expect(await wOpen.balanceOf(owner.address)).to.equal(depositAmount * 2n);
    });

    it("Should handle minimum deposit of 1 wei", async function () {
      const oneWei = 1n;
      await expect(wOpen.deposit({ value: oneWei }))
        .to.emit(wOpen, "Deposit")
        .withArgs(owner.address, oneWei);
      expect(await wOpen.balanceOf(owner.address)).to.equal(oneWei);
    });
  });

  describe("Withdrawals", function () {
    const depositAmount = ethers.parseEther("2.0");
    const withdrawAmount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await wOpen.deposit({ value: depositAmount });
    });

    it("Should burn tokens and return ETH when withdrawing", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await wOpen.withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(await wOpen.balanceOf(owner.address)).to.equal(depositAmount - withdrawAmount);
      expect(finalBalance + gasCost - initialBalance).to.equal(withdrawAmount);
    });

    it("Should revert when withdrawing more than balance", async function () {
      const tooMuch = depositAmount + ethers.parseEther("1.0");
      await expect(wOpen.withdraw(tooMuch)).to.be.reverted;
    });

    it("Should handle partial withdrawals", async function () {
      await wOpen.withdraw(withdrawAmount);
      expect(await wOpen.balanceOf(owner.address)).to.equal(depositAmount - withdrawAmount);
      await wOpen.withdraw(withdrawAmount);
      expect(await wOpen.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("Transfers", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await wOpen.deposit({ value: amount });
    });

    it("Should transfer tokens between accounts", async function () {
      await wOpen.transfer(addr1.address, amount);
      expect(await wOpen.balanceOf(addr1.address)).to.equal(amount);
      expect(await wOpen.balanceOf(owner.address)).to.equal(0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      await expect(wOpen.connect(addr1).transfer(owner.address, 1)).to.be.reverted;
    });

    it("Should handle self-transfers without checking allowance", async function () {
      // This case covers when src == msg.sender
      await expect(wOpen.transferFrom(owner.address, addr1.address, amount))
        .to.emit(wOpen, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("Should not decrease allowance when it's set to maximum (infinite approval)", async function () {
      const maxUint256 = ethers.MaxUint256;
      await wOpen.approve(addr1.address, maxUint256);
      const initialAllowance = await wOpen.allowance(owner.address, addr1.address);
      
      await wOpen.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      
      const finalAllowance = await wOpen.allowance(owner.address, addr1.address);
      expect(finalAllowance).to.equal(initialAllowance);
      expect(await wOpen.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should decrease allowance on transferFrom with finite approval", async function () {
      await wOpen.approve(addr1.address, amount);
      const initialAllowance = await wOpen.allowance(owner.address, addr1.address);
      
      await wOpen.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      
      const finalAllowance = await wOpen.allowance(owner.address, addr1.address);
      expect(finalAllowance).to.equal(initialAllowance - amount);
      expect(await wOpen.balanceOf(addr2.address)).to.equal(amount);
    });
  });

  describe("Allowances", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await wOpen.deposit({ value: amount });
    });

    it("Should update allowance on approval", async function () {
      await wOpen.approve(addr1.address, amount);
      expect(await wOpen.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should not affect allowance on transfer", async function () {
      await wOpen.approve(addr1.address, amount);
      await wOpen.transfer(addr2.address, amount);
      expect(await wOpen.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should handle infinite approvals", async function () {
      const maxUint256 = ethers.MaxUint256;
      await wOpen.approve(addr1.address, maxUint256);
      await wOpen.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      expect(await wOpen.allowance(owner.address, addr1.address)).to.equal(maxUint256);
    });
  });

  describe("Total Supply", function () {
    it("Should track total supply correctly through deposits and withdrawals", async function () {
      const amount = ethers.parseEther("1.0");
      
      // Initial deposit
      await wOpen.deposit({ value: amount });
      expect(await wOpen.totalSupply()).to.equal(amount);
      
      // Additional deposit from another account
      await wOpen.connect(addr1).deposit({ value: amount });
      expect(await wOpen.totalSupply()).to.equal(amount * 2n);
      
      // Withdrawal
      await wOpen.withdraw(amount);
      expect(await wOpen.totalSupply()).to.equal(amount);
    });
  });

  describe("Receive Function", function () {
    it("Should handle Ether sent directly to the contract", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // Send Ether directly to the contract
      await expect(
        owner.sendTransaction({
          to: wOpen.target,
          value: depositAmount,
        })
      )
        .to.emit(wOpen, "Deposit")
        .withArgs(owner.address, depositAmount);

      // Verify the balance of the sender in the contract
      expect(await wOpen.balanceOf(owner.address)).to.equal(depositAmount);
    });

    it("Should revert if msg.data is not empty", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // Attempt to send Ether with non-empty msg.data
      await expect(
        owner.sendTransaction({
          to: wOpen.target,
          value: depositAmount,
          data: "0x1234", // Non-empty data
        })
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await wOpen.deposit({ value: amount });
    });

    describe("Transfer Edge Cases", function () {
      it("Should fail transferFrom when allowance is insufficient", async function () {
        // Set allowance to less than amount
        await wOpen.approve(addr1.address, amount - 1n);
        await expect(
          wOpen.connect(addr1).transferFrom(owner.address, addr2.address, amount)
        ).to.be.reverted;
      });

      it("Should allow transfer of exact allowance amount", async function () {
        await wOpen.approve(addr1.address, amount);
        await wOpen.connect(addr1).transferFrom(owner.address, addr2.address, amount);
        expect(await wOpen.balanceOf(addr2.address)).to.equal(amount);
      });

      it("Should handle zero value transfers", async function () {
        // Zero value transfer with no allowance should still work
        await expect(wOpen.transfer(addr1.address, 0))
          .to.emit(wOpen, "Transfer")
          .withArgs(owner.address, addr1.address, 0);

        // Zero value transferFrom should work without approval
        await expect(wOpen.connect(addr1).transferFrom(owner.address, addr2.address, 0))
          .to.emit(wOpen, "Transfer")
          .withArgs(owner.address, addr2.address, 0);
      });
    });

    describe("Deposit Edge Cases", function () {
      it("Should handle zero value deposits", async function () {
        await expect(wOpen.deposit({ value: 0 }))
          .to.emit(wOpen, "Deposit")
          .withArgs(owner.address, 0);
        
        await expect(owner.sendTransaction({
          to: wOpen.target,
          value: 0
        }))
          .to.emit(wOpen, "Deposit")
          .withArgs(owner.address, 0);
      });

      it("Should handle multiple consecutive deposits", async function () {
        const initialBalance = await wOpen.balanceOf(owner.address);
        
        // Make multiple deposits
        await wOpen.deposit({ value: 1 });
        await wOpen.deposit({ value: 2 });
        await wOpen.deposit({ value: 3 });
        
        const finalBalance = await wOpen.balanceOf(owner.address);
        expect(finalBalance).to.equal(initialBalance + 6n);
      });
    });

    describe("Withdrawal Edge Cases", function () {
      it("Should handle zero value withdrawals", async function () {
        await expect(wOpen.withdraw(0))
          .to.emit(wOpen, "Withdrawal")
          .withArgs(owner.address, 0);
      });

      it("Should handle withdrawal of exact balance", async function () {
        const balance = await wOpen.balanceOf(owner.address);
        await wOpen.withdraw(balance);
        expect(await wOpen.balanceOf(owner.address)).to.equal(0);
      });
    });
  });
});
