require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
      // Ajoutez ces paramètres pour résoudre l'erreur de transaction sous-évaluée
      gasPrice: 5000000000, // 5 Gwei
      maxPriorityFeePerGas: 1000000000 // 1 Gwei (minimum requis selon l'erreur)
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY
  }
};