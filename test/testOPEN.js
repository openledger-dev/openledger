const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Open', function () {
  let open
  let owner
  let addr1
  let addr2
  let addrs

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    ;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()
    const Open = await ethers.getContractFactory('Open')
    open = await Open.deploy(owner.address)
  })

  describe('Deployment', function () {
    it('Should set the right name and symbol', async function () {
      expect(await open.name()).to.equal('Open')
      expect(await open.symbol()).to.equal('OPEN')
    })

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await open.balanceOf(owner.address)
      expect(await open.totalSupply()).to.equal(ownerBalance)
    })

    it('Should have correct total supply', async function () {
      const expectedSupply = ethers.parseUnits('1000000000', 18) // 1 billion tokens with 18 decimals
      expect(await open.totalSupply()).to.equal(expectedSupply)
    })
  })

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      const amount = ethers.parseUnits('50', 18)

      // Transfer from owner to addr1
      await open.transfer(addr1.address, amount)
      expect(await open.balanceOf(addr1.address)).to.equal(amount)

      // Transfer from addr1 to addr2
      await open.connect(addr1).transfer(addr2.address, amount)
      expect(await open.balanceOf(addr2.address)).to.equal(amount)
    })

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await open.balanceOf(owner.address)
      await expect(open.connect(addr1).transfer(owner.address, 1)).to.be.revertedWithCustomError(
        open,
        'ERC20InsufficientBalance',
      )
    })

    it('Should update allowances on approval', async function () {
      const amount = ethers.parseUnits('100', 18)
      await open.approve(addr1.address, amount)
      expect(await open.allowance(owner.address, addr1.address)).to.equal(amount)
    })
  })

  describe('TransferFrom', function () {
    it('Should transfer tokens using transferFrom', async function () {
      const amount = ethers.parseUnits('100', 18)
      await open.approve(addr1.address, amount)

      await open.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      expect(await open.balanceOf(addr2.address)).to.equal(amount)
    })

    it('Should fail if trying to transferFrom more than allowed', async function () {
      const amount = ethers.parseUnits('100', 18)
      await open.approve(addr1.address, amount)

      await expect(
        open.connect(addr1).transferFrom(owner.address, addr2.address, amount * 2n),
      ).to.be.revertedWithCustomError(open, 'ERC20InsufficientAllowance')
    })
  })

  describe('Burning', function () {
    it('Should burn tokens and reduce total supply', async function () {
      const burnAmount = ethers.parseUnits('100', 18)
      const initialSupply = await open.totalSupply()
      const initialBalance = await open.balanceOf(owner.address)

      await open.burn(burnAmount)

      expect(await open.totalSupply()).to.equal(initialSupply - burnAmount)
      expect(await open.balanceOf(owner.address)).to.equal(initialBalance - burnAmount)
    })

    it('Should allow users to burn their own tokens', async function () {
      const transferAmount = ethers.parseUnits('200', 18)
      const burnAmount = ethers.parseUnits('100', 18)

      // Transfer tokens to addr1
      await open.transfer(addr1.address, transferAmount)

      // addr1 burns half of their tokens
      await open.connect(addr1).burn(burnAmount)

      expect(await open.balanceOf(addr1.address)).to.equal(transferAmount - burnAmount)
    })

    it('Should fail if trying to burn more tokens than owned', async function () {
      const burnAmount = ethers.parseUnits('2000000000', 18) // More than total supply
      await expect(open.burn(burnAmount)).to.be.revertedWithCustomError(
        open,
        'ERC20InsufficientBalance',
      )
    })

    it('Should emit Transfer event on burn', async function () {
      const burnAmount = ethers.parseUnits('100', 18)
      await expect(open.burn(burnAmount))
        .to.emit(open, 'Transfer')
        .withArgs(owner.address, ethers.ZeroAddress, burnAmount)
    })
  })
})
