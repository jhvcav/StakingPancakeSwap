// Créez ce fichier avec la configuration PancakeSwap
export const PANCAKE_MASTERCHEF_ADDRESS = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652';
export const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

export const PANCAKE_MASTERCHEF_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pid", "type": "uint256"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pid", "type": "uint256"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_pid", "type": "uint256"}],
    "name": "harvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pid", "type": "uint256"},
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "pendingCake",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pid", "type": "uint256"},
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "userInfo",
    "outputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "rewardDebt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "poolInfo",
    "outputs": [
      {"internalType": "contract IBEP20", "name": "lpToken", "type": "address"},
      {"internalType": "uint256", "name": "allocPoint", "type": "uint256"},
      {"internalType": "uint256", "name": "lastRewardBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "accCakePerShare", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const LP_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const CAKE_TOKEN_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
export const CAKE_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Pools vérifiés PancakeSwap
export const VERIFIED_PANCAKE_POOLS = {
  2: { 
    name: 'CAKE-BNB', 
    lpToken: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0'
  },
  3: { 
    name: 'BUSD-BNB', 
    lpToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16'
  },
  4: { 
    name: 'USDT-BNB', 
    lpToken: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE'
  },
  261: { 
    name: 'ANKR-BNB', 
    lpToken: '0x3147F98B8f9C53Acdf8F16332eaD12B592a1a4ae'
  }
};