
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')


module.exports = buildModule('GOpenDeployment', (m) => {
      console.log('Deploying GOpen token...')
    
  const gOpen = m.contract('GOPEN')
  return { gOpen }
})

