const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')

module.exports = buildModule('OpenTokenDeployment', (m) => {
  const open = m.contract('Open', [m.getAccount(0)])
  return { open }
})
