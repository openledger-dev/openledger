const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('GOpen', function () {
  let gOpen
  let owner
  let addr1
  let addr2
  let addrs

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners()
    const GOpen = await ethers.getContractFactory('GOPEN')
    gOpen = await GOpen.deploy()
  })

  describe('Deployment', function () {
    it('Should set the right name and symbol', async function () {
      expect(await gOpen.name()).to.equal('GOpen')
      expect(await gOpen.symbol()).to.equal('GOPEN')
    })

    it('Should start with zero total supply', async function () {
      expect(await gOpen.totalSupply()).to.equal(0)
    })
  })

  describe('Deposits', function () {
    it('Should mint tokens when depositing ETH', async function () {
      const depositAmount = ethers.parseEther('1.0')
      await expect(gOpen.deposit({ value: depositAmount }))
        .to.emit(gOpen, 'Deposit')
        .withArgs(owner.address, depositAmount)

      expect(await gOpen.balanceOf(owner.address)).to.equal(depositAmount)
      expect(await ethers.provider.getBalance(gOpen.target)).to.equal(depositAmount)
    })

    it('Should handle minimum deposit of 1 wei', async function () {
      const oneWei = 1n
      await expect(gOpen.deposit({ value: oneWei }))
        .to.emit(gOpen, 'Deposit')
        .withArgs(owner.address, oneWei)
      expect(await gOpen.balanceOf(owner.address)).to.equal(oneWei)
    })

    it('Should not allow zero value deposits', async function () {
      await expect(gOpen.deposit({ value: 0 })).to.be.revertedWithCustomError(gOpen, 'ZeroValueNotAllowed')
    })

    it('Should handle large deposits', async function () {
      const largeAmount = ethers.parseEther('100') // 100 ETH is large enough for testing
      await expect(gOpen.deposit({ value: largeAmount }))
        .to.emit(gOpen, 'Deposit')
        .withArgs(owner.address, largeAmount)
      expect(await gOpen.balanceOf(owner.address)).to.equal(largeAmount)
    })
  })

  describe('Withdrawals', function () {
    const depositAmount = ethers.parseEther('2.0')
    const withdrawAmount = ethers.parseEther('1.0')

    beforeEach(async function () {
      await gOpen.deposit({ value: depositAmount })
    })

    it('Should burn tokens and return ETH when withdrawing', async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address)
      
      const tx = await gOpen.withdraw(withdrawAmount)
      const receipt = await tx.wait()
      const gasCost = receipt.gasUsed * receipt.gasPrice

      const finalBalance = await ethers.provider.getBalance(owner.address)
      
      expect(await gOpen.balanceOf(owner.address)).to.equal(depositAmount - withdrawAmount)
      expect(finalBalance + gasCost - initialBalance).to.equal(withdrawAmount)
    })

    it('Should allow withdrawing exact balance amount', async function () {
      await gOpen.withdraw(depositAmount)
      expect(await gOpen.balanceOf(owner.address)).to.equal(0)
    })

    it('Should revert when withdrawing more than balance', async function () {
      const tooMuch = depositAmount + ethers.parseEther('1.0')
      await expect(gOpen.withdraw(tooMuch))
        .to.be.revertedWithCustomError(gOpen, 'ERC20InsufficientBalance')
    })

    it('Should handle reentrancy attempts', async function () {
      // Deploy malicious contract that attempts reentrancy
      const AttackerFactory = await ethers.getContractFactory('ReentrancyAttackerGWithdrwal')
      const attacker = await AttackerFactory.deploy(gOpen.target)
      
      // Fund attacker contract with tokens and ensure contract has ETH
      const initialAmount = ethers.parseEther('1.0')
      await gOpen.deposit({ value: initialAmount })
      await gOpen.transfer(attacker.target, initialAmount)

      // Initial balance check
      expect(await gOpen.balanceOf(attacker.target)).to.equal(initialAmount)
      
      // Attempt reentrancy attack - should fail on native currency send
      await expect(attacker.attack())
        .to.be.revertedWith('Failed to send native currency')
    })

    it('Should measure gas usage for withdrawals', async function () {
      const tx = await gOpen.withdraw(withdrawAmount)
      const receipt = await tx.wait()
      console.log('Gas used for withdrawal:', receipt.gasUsed.toString())
      expect(receipt.gasUsed).to.be.below(100000n)
    })
  })

  describe('Governance and Voting', function () {
    const depositAmount = ethers.parseEther('1.0')

    beforeEach(async function () {
      await gOpen.deposit({ value: depositAmount })
      await gOpen.delegate(owner.address) // Self-delegate to get initial voting power
    })

    it('Should track votes and past votes correctly', async function () {
      const currentTime = Number(await gOpen.clock())
      expect(await gOpen.getVotes(owner.address)).to.equal(depositAmount)

      // Check past votes
      const pastVotes = await gOpen.getPastVotes(owner.address, currentTime - 1)
      expect(pastVotes).to.equal(0)
    })

    it('Should track past total supply correctly', async function () {
      const depositAmount = ethers.parseEther('1.0')
      await gOpen.deposit({ value: depositAmount })

      const currentTime = Number(await gOpen.clock())
      const pastTotalSupply = await gOpen.getPastTotalSupply(currentTime - 1)

      // Assert that the past total supply matches the deposit amount
      expect(pastTotalSupply).to.equal(depositAmount)
    })

    it('Should handle checkpoints correctly', async function () {
      const numCheckpoints = await gOpen.numCheckpoints(owner.address)
      expect(numCheckpoints).to.equal(1)
    })

    it('Should allow delegation', async function () {
      await gOpen.delegate(addr1.address)
      expect(await gOpen.delegates(owner.address)).to.equal(addr1.address)
      expect(await gOpen.getVotes(addr1.address)).to.equal(depositAmount)
    })

    it('Should simulate governance with multiple users', async function () {
      const userDeposit = ethers.parseEther('2.0')
      await gOpen.connect(addr1).deposit({ value: userDeposit })
      await gOpen.connect(addr2).deposit({ value: userDeposit })

      // Delegation
      await gOpen.connect(addr1).delegate(addr1.address)
      await gOpen.connect(addr2).delegate(addr2.address)

      // Check votes
      expect(await gOpen.getVotes(addr1.address)).to.equal(userDeposit)
      expect(await gOpen.getVotes(addr2.address)).to.equal(userDeposit)

      // Transfer and re-delegate
      await gOpen.connect(addr1).transfer(addr2.address, ethers.parseEther('1.0'))
      await gOpen.connect(addr2).delegate(addr2.address)

      expect(await gOpen.getVotes(addr2.address)).to.equal(ethers.parseEther('3.0'))
    })
  })

  describe('Permit', function () {
    it('Should permit and transfer using signature', async function () {
      const amount = ethers.parseEther('1.0')
      await gOpen.deposit({ value: amount })

      const deadline = ethers.MaxUint256
      const nonce = await gOpen.nonces(owner.address)
      const { chainId } = await ethers.provider.getNetwork()

      // Create the approval signature
      const domain = {
        name: 'GOpen',
        version: '1',
        chainId: chainId,
        verifyingContract: await gOpen.getAddress()
      }

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const value = {
        owner: owner.address,
        spender: addr1.address,
        value: amount,
        nonce: nonce,
        deadline: deadline
      }

      const signature = await owner.signTypedData(domain, types, value)
      const sig = ethers.Signature.from(signature)

      await gOpen.permit(
        owner.address,
        addr1.address,
        amount,
        deadline,
        sig.v,
        sig.r,
        sig.s
      )

      expect(await gOpen.allowance(owner.address, addr1.address)).to.equal(amount)
    })
  })

  describe('Receive Function', function () {
    it('Should mint tokens when receiving ETH directly', async function () {
      const depositAmount = ethers.parseEther('1.0')
      await expect(owner.sendTransaction({ to: gOpen.target, value: depositAmount }))
        .to.emit(gOpen, 'Deposit')
        .withArgs(owner.address, depositAmount)

      expect(await gOpen.balanceOf(owner.address)).to.equal(depositAmount)
      expect(await ethers.provider.getBalance(gOpen.target)).to.equal(depositAmount)
    })
  })

  describe('Custom Errors', function () {
    it('Should revert with ZeroValueNotAllowed on zero-value deposit', async function () {
      await expect(gOpen.deposit({ value: 0 })).to.be.revertedWithCustomError(gOpen, 'ZeroValueNotAllowed')
    })

    it('Should revert with ZeroValueNotAllowed on zero-value withdrawal', async function () {
      await expect(gOpen.withdraw(0)).to.be.revertedWithCustomError(gOpen, 'ZeroValueNotAllowed')
    })
  })

  describe('Overrides', function () {
    it('Should return the correct clock value', async function () {
      const contractTime = await gOpen.clock()
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
      expect(contractTime).to.equal(blockTimestamp)
    })


    it('Should return the correct CLOCK_MODE', async function () {
      expect(await gOpen.CLOCK_MODE()).to.equal('mode=timestamp')
    })

    it('Should update balances correctly via _update', async function () {
      const depositAmount = ethers.parseEther('1.0')
      await gOpen.deposit({ value: depositAmount })
      await gOpen.transfer(addr1.address, depositAmount)
      expect(await gOpen.balanceOf(addr1.address)).to.equal(depositAmount)
    })

    it('Should return the correct nonce for an address', async function () {
      const nonce = await gOpen.nonces(owner.address)
      expect(nonce).to.equal(0)
    })
  })
})