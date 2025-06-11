require('@nomicfoundation/hardhat-toolbox')
require('solidity-coverage')
require('@nomicfoundation/hardhat-verify')
require('dotenv').config()

// RPCs must be defined in .env for the networks you want to use
const RPC_URL_OPSEPOLIA = process.env.SEPOLIA_RPC_URL
const OPEN_RPC_URL = process.env.OPEN_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x1111111111111111111111111111111111111111111111111111111111111111'
const SCAN_API_KEY_OPN = process.env.SCAN_API_KEY_OPN || 'DUMMY_KEY' // Fallback for verification
const SCAN_API_KEY_SEPOLIA = process.env.SCAN_API_KEY_SEPOLIA

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
    opSepolia: {
      url: RPC_URL_OPSEPOLIA,
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
      'OP Sepolia': SCAN_API_KEY_SEPOLIA
    },
    customChains: [
      {
        network: "openledger-testnet",
        chainId: 161201,
        urls: {
          apiURL: "https://scantn.openledger.xyz:443/api",
          browserURL: "https://scantn.openledger.xyz:443"
        }
      },
      {
        network: "OP Sepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimism.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
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
