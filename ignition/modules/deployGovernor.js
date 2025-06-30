const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("GovernanceModule", (m) => {
  const minDelay = 3600;
  const proposers = [];
  const executors = [];
  const holder = m.getAccount(0);
  const admin = m.getAccount(1);

  const myToken = m.contract('GOPEN', []);
  const timelock = m.contract(
    "TimelockController",
    [minDelay, [], [], admin],
    {},
  );
  const govern = m.contract(
    "OpenLedgerGovernor",
    [myToken, timelock],
    {},
  );
  return { myToken, timelock, govern };
});
