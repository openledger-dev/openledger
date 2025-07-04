const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('OpenTokenDeployment', (m) => {
 
  const initialHolder = "0xe4Ad6Ef943Bc8aecc80F304EC21761CE36437977";
   console.log(initialHolder,"initialHolder")
  const open = m.contract('Open', [initialHolder]);
  return { open };
});
