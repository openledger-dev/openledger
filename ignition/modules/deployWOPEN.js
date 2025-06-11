const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')


module.exports = buildModule('WOpenDeployment', (m) => {
      console.log('Deploying WOpen token...')
    
  const wOpen = m.contract('WOPEN')
  return { wOpen }
})

