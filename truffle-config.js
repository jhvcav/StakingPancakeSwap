/**
 * Configuration Truffle pour le déploiement des smart contracts sur BSC.
 * 
 * Remarque: Ce fichier est utilisé pour configurer le déploiement des contrats
 * sur les différents réseaux. Il faudra modifier les variables d'environnement
 * selon votre configuration.
 */

module.exports = {
    networks: {
      // Réseau de développement local
      development: {
        host: "127.0.0.1",
        port: 8545,
        network_id: "*"
      },
      
      // Réseau de test BSC (testnet)
      bscTestnet: {
        // Vous devrez configurer un fournisseur et un compte pour déployer
        provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://data-seed-prebsc-1-s1.binance.org:8545`),
        network_id: 97,
        confirmations: 10,
        timeoutBlocks: 200,
        skipDryRun: true
      },
      
      // Réseau principal BSC (mainnet)
      bscMainnet: {
        // Vous devrez configurer un fournisseur et un compte pour déployer
        provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://bsc-dataseed1.binance.org`),
        network_id: 56,
        confirmations: 10,
        timeoutBlocks: 200,
        skipDryRun: true
      }
    },
    
    // Configuration du compilateur Solidity
    compilers: {
      solc: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    },
    
    // Configuration des plugins
    plugins: [
      'truffle-plugin-verify'
    ],
    
    // Configuration pour la vérification des contrats sur BscScan
    api_keys: {
      bscscan: process.env.BSCSCAN_API_KEY
    }
  };