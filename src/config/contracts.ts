// Adresses des contrats PancakeSwap V3 sur BSC Mainnet
export const PANCAKE_V3_CONTRACTS = {
  MASTERCHEF_V3: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
  POSITION_MANAGER: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
  FACTORY: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
  ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  QUOTER: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',

  // Token addresses
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // WETH sur BSC

  // Identifiants des pools V3 populaires
  // Les IDs pour les pools dans MasterChef V3
  POOL_IDS: {
    'CAKE-BNB-500': 1, // ID 1 pour la paire CAKE-BNB avec frais de 0.05%
    'CAKE-BUSD-100': 2, // ID 2 pour la paire CAKE-BUSD avec frais de 0.01%
    'ETH-BNB-500': 3,   // ID 3 pour la paire ETH-BNB avec frais de 0.05%
  }
};

// Contrats V2 existants
export const PANCAKE_V2_CONTRACTS = {
  MASTERCHEF: '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652',
  ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
};

// Tokens courants
export const COMMON_TOKENS = {
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
};