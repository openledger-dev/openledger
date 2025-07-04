require('@nomicfoundation/hardhat-toolbox')
require('solidity-coverage')
require('@nomicfoundation/hardhat-verify')
require('dotenv').config()
const { vars } = require("hardhat/config");

// RPCs must be defined in .env for the networks you want to use
const RPC_URL_SEPOLIA = process.env.SEPOLIA_RPC_URL
const OPEN_RPC_URL = process.env.OPEN_RPC_URL
const SCAN_API_KEY_OPN = process.env.SCAN_API_KEY_OPN || 'DUMMY_KEY' // Fallback for verification
const SCAN_API_KEY_SEPOLIA = process.env.SCAN_API_KEY_SEPOLIA

// Mainnet  var set.
const RPC_URL_ETHEREUM = `https://eth-mainnet.g.alchemy.com/v2/${vars.get("RPC_KEY_ETHEREUM")}`
const SCAN_API_KEY_ETHEREUM = vars.get("SCAN_API_KEY_ETHEREUM");
const PRIVATE_KEY = vars.get("OPEN_DEPLOYER");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
            {
        version: "0.5.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, // hardhat
    },
    sepolia: {
      url: RPC_URL_SEPOLIA,
      accounts: [PRIVATE_KEY],
    },
    Ethereum: {
      url: RPC_URL_ETHEREUM,
      accounts: [PRIVATE_KEY],
    },
    'openledger-testnet': {
      url: OPEN_RPC_URL,
      accounts: [PRIVATE_KEY],
      //  accounts: {
      //   mnemonic: MNEMONIC,
      //   initialIndex: 0, // Optional: specify the initial index for HD wallet
      //   count: 25, // Optional: number of accounts to derive
      //   path: "m/44'/60'/0'/0", // Optional: HD derivation path
      //   }    
    },
  },
  etherscan: {
    apiKey: {
      'openledger-testnet': SCAN_API_KEY_OPN,
      'sepolia': SCAN_API_KEY_SEPOLIA,
      'mainnet': SCAN_API_KEY_ETHEREUM
    },
    customChains: [
      {
        network: "openledger-testnet",
        chainId: 161201,
        urls: {
          apiURL: "https://scantn.openledger.xyz:443/api",
          browserURL: "https://scantn.openledger.xyz:443"
        }
      }
    ]
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    showTimeSpent: true,
    excludeContracts: ["BaseWETH.sol", "ERC20Bank.sol","ReentrancyAttacker.sol","ReentrancyAttackerGOpen.sol","ReentrancyAttackerGWithdrwal.sol"]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 300000, // 5 minutes max for running tests
  },
}
