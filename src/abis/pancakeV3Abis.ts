export const MASTERCHEF_V3_ABI = [
  // Récupérer les positions stakées de l'utilisateur
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "tokenIdsOf",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
    ],
  },
  // Déposer (staker) une position - version sans poolId
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs":[
      {"internalType":"address","name":"owner","type":"address"},
      {"internalType":"uint256","name":"index","type":"uint256"}],
      "name":"tokenOfOwnerByIndex",
      "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
      "stateMutability":"view","type":"function"
    },
  // Déposer (staker) une position - version avec poolId
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "_pid", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Retirer (unstaker) une position
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "address", "name": "_to", "type": "address"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Récolter les récompenses
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "address", "name": "_to", "type": "address"}
    ],
    "name": "harvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Récompenses CAKE en attente
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"}
    ],
    "name": "pendingCake",
    "outputs": [
      {"internalType": "uint256", "name": "pending", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Infos sur une position stakée
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "userPositionInfos",
    "outputs": [
      {"internalType": "uint128", "name": "liquidity", "type": "uint128"},
      {"internalType": "uint128", "name": "boostLiquidity", "type": "uint128"},
      {"internalType": "int24", "name": "tickLower", "type": "int24"},
      {"internalType": "int24", "name": "tickUpper", "type": "int24"},
      {"internalType": "uint256", "name": "rewardGrowthInside", "type": "uint256"},
      {"internalType": "uint256", "name": "reward", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Nombre total de pools
  {
    "inputs": [],
    "name": "poolLength",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Récupérer les positions stakées de l'utilisateur
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "tokenIdsOf",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Déposer (staker) une position - version sans poolId
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs":[
      {"internalType":"address","name":"owner","type":"address"},
      {"internalType":"uint256","name":"index","type":"uint256"}],
      "name":"tokenOfOwnerByIndex",
      "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
      "stateMutability":"view","type":"function"
    },
  // Déposer (staker) une position - version avec poolId
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "_pid", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Retirer (unstaker) une position
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "address", "name": "_to", "type": "address"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Récolter les récompenses
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"},
      {"internalType": "address", "name": "_to", "type": "address"}
    ],
    "name": "harvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // FONCTION CORRECTE: Collecter les frais de trading
  {
    "inputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint128", "name": "amount0Max", "type": "uint128"},
          {"internalType": "uint128", "name": "amount1Max", "type": "uint128"}
        ],
        "internalType": "struct INonfungiblePositionManagerStruct.CollectParams",
        "name": "params",
        "type": "tuple"
      },
      {"internalType": "address", "name": "to", "type": "address"}
    ],
    "name": "collectTo",
    "outputs": [
      {"internalType": "uint256", "name": "amount0", "type": "uint256"},
      {"internalType": "uint256", "name": "amount1", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Récompenses CAKE en attente
  {
    "inputs": [
      {"internalType": "uint256", "name": "_tokenId", "type": "uint256"}
    ],
    "name": "pendingCake",
    "outputs": [
      {"internalType": "uint256", "name": "pending", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Infos sur une position stakée
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "userPositionInfos",
    "outputs": [
      {"internalType": "uint128", "name": "liquidity", "type": "uint128"},
      {"internalType": "uint128", "name": "boostLiquidity", "type": "uint128"},
      {"internalType": "int24", "name": "tickLower", "type": "int24"},
      {"internalType": "int24", "name": "tickUpper", "type": "int24"},
      {"internalType": "uint256", "name": "rewardGrowthInside", "type": "uint256"},
      {"internalType": "uint256", "name": "reward", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "pid", "type": "uint256"},
      {"internalType": "uint256", "name": "boostMultiplier", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Nombre total de pools
  {
    "inputs": [],
    "name": "poolLength",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const POSITION_MANAGER_ABI = [
  "function name() external view returns (string)",
  // Fonctions de lecture
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  
  // Fonctions d'approbation
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  
  // Fonctions de gestion des positions
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)",
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  "function burn(uint256 tokenId) external payable",
  
  // Événements
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
];

export const QUOTER_ABI = [
  // Fonction pour obtenir le prix actuel
  {
    "inputs": [
      {"internalType": "address", "name": "tokenIn", "type": "address"},
      {"internalType": "address", "name": "tokenOut", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"},
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
      {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
      {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI standard pour les tokens ERC20
export const ERC20_ABI = [
  // Lecture du solde
  "function balanceOf(address owner) view returns (uint256)",
  // Lecture des décimales
  "function decimals() view returns (uint8)",
  // Lecture du symbole
  "function symbol() view returns (string)",
  // Lecture du nom
  "function name() view returns (string)",
  // Lecture de l'allowance
  "function allowance(address owner, address spender) view returns (uint256)",
  // Approbation
  "function approve(address spender, uint256 value) returns (bool)",
  // Transfert
  "function transfer(address to, uint256 value) returns (bool)",
  // Transfert depuis
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  // Événement Transfer
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  // Événement Approval
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Ajouter au fichier src/abis/pancakeV3Abis.ts

// ABI complet du Router PancakeSwap V3
export const ROUTER_ABI = [
  // Functions for quotes
  "function quoteExactInput(bytes path, uint256 amountIn) external view returns (uint256 amountOut)",
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external view returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  "function quoteExactOutput(bytes path, uint256 amountOut) external view returns (uint256 amountIn)",
  "function quoteExactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external view returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  
  // Functions for swaps
  "function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactOutput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)",
  "function exactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)",
  
  // Functions for add/remove liquidity
  "function createAndInitializePoolIfNecessary(address tokenA, address tokenB, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
  "function increaseLiquidity(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function decreaseLiquidity(tuple(uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external returns (uint256 amount0, uint256 amount1)",
  "function collect(tuple(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external returns (uint256 amount0, uint256 amount1)",
  
  // Functions for unwrapping/sweeping
  "function unwrapWETH9(uint256 amountMinimum, address recipient) external",
  "function sweepToken(address token, uint256 amountMinimum, address recipient) external",
  "function refundETH() external",
  
  // Functions for multicall and other utilities
  "function multicall(bytes[] data) external payable returns (bytes[] results)",
  "function selfPermit(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable",
  "function selfPermitAllowed(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external payable",
  "function selfPermitAllowedIfNecessary(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external payable",
  "function selfPermitIfNecessary(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable",
  
  // Factory address
  "function factory() external view returns (address)",
  
  // WETH9 address
  "function WETH9() external view returns (address)",
  
  // Pool initialization code hash
  "function INIT_CODE_HASH() external view returns (bytes32)",
  
  // Function to get pool address
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

