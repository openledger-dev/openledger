const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("GovernanceModule", (m) => {
  const minDelay = 604800; // 1 week
  const admin = m.getAccount(1);
  const proposers = [m.getAccount(2)];
  const executors = [m.getAccount(4)];

  const myToken = m.contract('GOPEN', []);
  const timelock = m.contract(
    "TimelockController",
    [minDelay, proposers, executors, admin],
    {},
  );
  const govern = m.contract(
    "OpenLedgerGovernor",
    [myToken, timelock],
    {},
  );
  return { myToken, timelock, govern };
});
