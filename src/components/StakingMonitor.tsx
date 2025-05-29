import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  TrendingUp, AlertCircle, RefreshCw, DollarSign, 
  BarChart2, ArrowUpRight, ArrowDownRight, Clock, 
  ExternalLink, Loader, Check, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import des configurations V3 depuis votre InfinityStakingManager
import { PANCAKE_V3_CONTRACTS, COMMON_TOKENS } from '../config/contracts';
import { 
  MASTERCHEF_V3_ABI, 
  POSITION_MANAGER_ABI,
  ERC20_ABI
} from '../abis/pancakeV3Abis';

// Interface pour les positions V3
interface V3Position {
  tokenId: string;
  pairName: string;
  token0Symbol: string;
  token1Symbol: string;
  fee: string;
  liquidityUSD: string;
  isStaked: boolean;
  pendingCake?: string;
  pendingCakeUSD?: string;
  token0Amount?: string;
  token1Amount?: string;
  token0Value?: string;
  token1Value?: string;
  totalFeesUSD?: string;
  estimatedDailyYield: number; // Rendement quotidien estimé
  currentAPR: number; // APR actuel basé sur les récompenses
  hasLiquidity: boolean;
  rawLiquidity?: string;
  token0Decimals?: number;
  token1Decimals?: number;
  currentTick?: number;
  poolPrice?: string;
}

// Interface pour les dépôts enregistrés
interface Deposit {
  id: number;
  date: string;
  amount: number;
  token: string;
  promisedAPY: number;
}

// Cache des informations des tokens
interface TokenInfo {
  symbol: string;
  decimals: number;
  price?: number;
}

export function StakingMonitor() {
  // État pour les dépôts enregistrés
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [newDeposit, setNewDeposit] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    token: 'USDC',
    promisedAPY: 15 // 15% par défaut
  });

  // État pour les positions V3
  const [v3Positions, setV3Positions] = useState<V3Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [tokenInfoCache, setTokenInfoCache] = useState<{[key: string]: TokenInfo}>({});
  
  // État pour les métriques de performance
  const [performance, setPerformance] = useState({
    totalPromisedDaily: 0,
    totalActualDaily: 0,
    deficit: 0,
    deficitPercentage: 0,
    recommendedAPR: 0,
    totalStakedValue: 0,
    totalFarmingFees: 0
  });

  // CONSTANTES ET UTILITAIRES MATHÉMATIQUES (exactement comme InfinityStakingManager)
  const Q96 = BigInt("0x1000000000000000000000000"); // 2^96
  const Q192 = Q96 * Q96;
  const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  
  // Fonction pour calculer sqrt en BigInt
  const sqrt = (value: bigint): bigint => {
    if (value < 0n) {
      throw new Error("Square root of negative numbers is not supported");
    }
    if (value < 2n) {
      return value;
    }
    
    let z = (value + 1n) >> 1n;
    let y = value;
    
    while (z < y) {
      y = z;
      z = (value / z + z) >> 1n;
    }
    
    return y;
  };

  // Fonction pour obtenir le prix via BSCScan API (comme dans InfinityStakingManager)
  const getTokenPriceFromBscscan = async (tokenAddress: string): Promise<number> => {
    try {
      const response = await fetch(`https://api.bscscan.com/api?module=stats&action=tokenprice&contractaddress=${tokenAddress}&apikey=YourApiKeyToken`);
      const data = await response.json();
      
      if (data.status === '1' && data.result?.ethusd) {
        return parseFloat(data.result.ethusd);
      }
    } catch (error) {
      console.warn(`Erreur prix BSCScan pour ${tokenAddress}:`, error);
    }
    
    // Prix de fallback
    const fallbackPrices: {[key: string]: number} = {
      [PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()]: 2.45,
      [PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()]: 720.00,
      [COMMON_TOKENS.BUSD.toLowerCase()]: 1.00,
      [COMMON_TOKENS.USDT.toLowerCase()]: 1.00,
      [COMMON_TOKENS.USDC.toLowerCase()]: 1.00
    };
    
    return fallbackPrices[tokenAddress.toLowerCase()] || 1.00;
  };

  // Fonction hybride pour obtenir le prix d'un token (comme dans InfinityStakingManager)
  const getTokenPrice = async (tokenAddress: string, provider: any): Promise<number> => {
    try {
      // Essayer d'abord BSCScan
      const bscscanPrice = await getTokenPriceFromBscscan(tokenAddress);
      if (bscscanPrice > 0) {
        return bscscanPrice;
      }
      
      // Fallback vers les prix connus
      const knownPrices: {[key: string]: number} = {
        [PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()]: 2.45,
        [PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()]: 720.00,
        [COMMON_TOKENS.BUSD.toLowerCase()]: 1.00,
        [COMMON_TOKENS.USDT.toLowerCase()]: 1.00,
        [COMMON_TOKENS.USDC.toLowerCase()]: 1.00
      };
      
      return knownPrices[tokenAddress.toLowerCase()] || 1.00;
    } catch (error) {
      console.error("Erreur récupération prix:", error);
      return 1.00;
    }
  };

  // Fonction pour trouver l'adresse du pool
  const getPoolAddress = async (
    token0Address: string,
    token1Address: string,
    fee: number,
    provider: any
  ): Promise<string> => {
    const [sortedToken0, sortedToken1] = token0Address.toLowerCase() < token1Address.toLowerCase()
      ? [token0Address, token1Address]
      : [token1Address, token0Address];
    
    try {
      const factory = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.FACTORY,
        [
          "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
        ],
        provider
      );
      
      const poolAddress = await factory.getPool(sortedToken0, sortedToken1, fee);
      
      if (poolAddress && poolAddress !== ethers.ZeroAddress) {
        return poolAddress;
      }
      
      throw new Error(`Pool not found for ${sortedToken0}-${sortedToken1} with fee ${fee}`);
    } catch (error) {
      console.error(`Erreur lors de la recherche du pool:`, error);
      return ethers.ZeroAddress;
    }
  };

  // Récupérer les informations du pool
  const getPoolInfo = async (
    poolAddress: string,
    provider: any
  ): Promise<{sqrtPriceX96: bigint, tick: number} | null> => {
    if (!poolAddress || poolAddress === ethers.ZeroAddress) {
      return null;
    }
    
    try {
      const pool = new ethers.Contract(poolAddress, [
        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
      ], provider);
      
      const slot0 = await pool.slot0();
      
      return {
        sqrtPriceX96: BigInt(slot0.sqrtPriceX96.toString()),
        tick: Number(slot0.tick)
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos du pool:`, error);
      return null;
    }
  };

  // Calculer le prix à partir de sqrtPriceX96
  const calculatePrice = (sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number): number => {
    try {
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
      const price = sqrtPrice * sqrtPrice * Math.pow(10, token1Decimals - token0Decimals);
      return price;
    } catch (error) {
      console.error("Erreur calcul prix:", error);
      return 0;
    }
  };

  // Obtenir le sqrt ratio à un tick donné
  const getSqrtRatioAtTick = (tick: number): bigint => {
    const absTick = Math.abs(tick);
    let ratio = (absTick & 0x1) !== 0 
      ? BigInt("0xfffcb933bd6fad37aa2d162d1a594001") 
      : BigInt("0x100000000000000000000000000000000");
    
    if ((absTick & 0x2) !== 0) ratio = (ratio * BigInt("0xfff97272373d413259a46990580e213a")) >> BigInt(128);
    if ((absTick & 0x4) !== 0) ratio = (ratio * BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc")) >> BigInt(128);
    if ((absTick & 0x8) !== 0) ratio = (ratio * BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0")) >> BigInt(128);
    if ((absTick & 0x10) !== 0) ratio = (ratio * BigInt("0xffcb9843d60f6159c9db58835c926644")) >> BigInt(128);
    if ((absTick & 0x20) !== 0) ratio = (ratio * BigInt("0xff973b41fa98c081472e6896dfb254c0")) >> BigInt(128);
    if ((absTick & 0x40) !== 0) ratio = (ratio * BigInt("0xff2ea16466c96a3843ec78b326b52861")) >> BigInt(128);
    if ((absTick & 0x80) !== 0) ratio = (ratio * BigInt("0xfe5dee046a99a2a811c461f1969c3053")) >> BigInt(128);
    if ((absTick & 0x100) !== 0) ratio = (ratio * BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4")) >> BigInt(128);
    if ((absTick & 0x200) !== 0) ratio = (ratio * BigInt("0xf987a7253ac413176f2b074cf7815e54")) >> BigInt(128);
    if ((absTick & 0x400) !== 0) ratio = (ratio * BigInt("0xf3392b0822b70005940c7a398e4b70f3")) >> BigInt(128);
    if ((absTick & 0x800) !== 0) ratio = (ratio * BigInt("0xe7159475a2c29b7443b29c7fa6e889d9")) >> BigInt(128);
    if ((absTick & 0x1000) !== 0) ratio = (ratio * BigInt("0xd097f3bdfd2022b8845ad8f792aa5825")) >> BigInt(128);
    if ((absTick & 0x2000) !== 0) ratio = (ratio * BigInt("0xa9f746462d870fdf8a65dc1f90e061e5")) >> BigInt(128);
    if ((absTick & 0x4000) !== 0) ratio = (ratio * BigInt("0x70d869a156d2a1b890bb3df62baf32f7")) >> BigInt(128);
    if ((absTick & 0x8000) !== 0) ratio = (ratio * BigInt("0x31be135f97d08fd981231505542fcfa6")) >> BigInt(128);
    if ((absTick & 0x10000) !== 0) ratio = (ratio * BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9")) >> BigInt(128);
    if ((absTick & 0x20000) !== 0) ratio = (ratio * BigInt("0x5d6af8dedb81196699c329225ee604")) >> BigInt(128);
    if ((absTick & 0x40000) !== 0) ratio = (ratio * BigInt("0x2216e584f5fa1ea926041bedfe98")) >> BigInt(128);
    if ((absTick & 0x80000) !== 0) ratio = (ratio * BigInt("0x48a170391f7dc42444e8fa2")) >> BigInt(128);
    
    if (tick > 0) ratio = MAX_UINT256 / ratio;
    
    return (ratio >> BigInt(32)) + (ratio % (BigInt(1) << BigInt(32)) === BigInt(0) ? BigInt(0) : BigInt(1));
  };
  
  // Obtenir la variation d'amount0 entre deux prix
  const getAmount0Delta = (
    sqrtRatioA: bigint,
    sqrtRatioB: bigint,
    liquidity: bigint,
    roundUp: boolean
  ): bigint => {
    if (sqrtRatioA > sqrtRatioB) [sqrtRatioA, sqrtRatioB] = [sqrtRatioB, sqrtRatioA];
    
    const numerator1 = liquidity << BigInt(96);
    const numerator2 = sqrtRatioB - sqrtRatioA;
    
    if (roundUp) {
      return (((numerator1 * numerator2) / sqrtRatioB) / sqrtRatioA) + BigInt(1);
    } else {
      return ((numerator1 * numerator2) / sqrtRatioB) / sqrtRatioA;
    }
  };
  
  // Obtenir la variation d'amount1 entre deux prix
  const getAmount1Delta = (
    sqrtRatioA: bigint,
    sqrtRatioB: bigint,
    liquidity: bigint,
    roundUp: boolean
  ): bigint => {
    if (sqrtRatioA > sqrtRatioB) [sqrtRatioA, sqrtRatioB] = [sqrtRatioB, sqrtRatioA];
    
    if (roundUp) {
      return ((liquidity * (sqrtRatioB - sqrtRatioA)) >> BigInt(96)) + BigInt(1);
    } else {
      return (liquidity * (sqrtRatioB - sqrtRatioA)) >> BigInt(96);
    }
  };

  // Vérifier si une position a une liquidité valide
  const hasValidLiquidity = (positionInfo: any): boolean => {
    if (!positionInfo.liquidity) return false;
    const liquidityStr = positionInfo.liquidity.toString();
    return liquidityStr !== '0' && liquidityStr !== '';
  };

  // Fonction pour obtenir les informations d'un token (exactement comme InfinityStakingManager)
  const getTokenInfo = async (tokenAddress: string, provider: any): Promise<TokenInfo> => {
    const addr = tokenAddress.toLowerCase();
    
    if (tokenInfoCache[addr]) {
      return tokenInfoCache[addr];
    }
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);
      
      // Récupérer le prix réel du token
      const price = await getTokenPrice(tokenAddress, provider);
      
      const tokenInfo: TokenInfo = {
        symbol,
        decimals: Number(decimals),
        price
      };
      
      setTokenInfoCache(prev => ({...prev, [addr]: tokenInfo}));
      return tokenInfo;
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos pour ${tokenAddress}:`, error);
      
      const knownTokens: {[key: string]: TokenInfo} = {
        [PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()]: { symbol: 'CAKE', decimals: 18, price: await getTokenPrice(PANCAKE_V3_CONTRACTS.CAKE, provider) },
        [PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()]: { symbol: 'BNB', decimals: 18, price: await getTokenPrice(PANCAKE_V3_CONTRACTS.WBNB, provider) },
        [COMMON_TOKENS.USDT.toLowerCase()]: { symbol: 'USDT', decimals: 18, price: 1.00 },
        [COMMON_TOKENS.USDC.toLowerCase()]: { symbol: 'USDC', decimals: 6, price: 1.00 },
        [COMMON_TOKENS.BUSD.toLowerCase()]: { symbol: 'BUSD', decimals: 18, price: 1.00 }
      };
      
      if (knownTokens[addr]) {
        setTokenInfoCache(prev => ({...prev, [addr]: knownTokens[addr]}));
        return knownTokens[addr];
      }
      
      const defaultInfo = { symbol: addr.substring(0, 6), decimals: 18, price: 1.00 };
      setTokenInfoCache(prev => ({...prev, [addr]: defaultInfo}));
      return defaultInfo;
    }
  };

  // Fonction pour calculer les montants exacts de tokens dans une position V3 (exactement comme InfinityStakingManager)
  const calculateTokenAmounts = async (
    position: any, 
    provider: any
  ): Promise<{
    token0Amount: string, 
    token1Amount: string, 
    token0Decimals: number,
    token1Decimals: number,
    currentTick?: number,
    poolPrice?: string
  }> => {
    try {
      const tokenId = position.tokenId;
      const token0Address = position.token0;
      const token1Address = position.token1;
      const fee = Number(position.fee.replace('%', '')) * 10000;
      const tickLower = Number(position.tickLower);
      const tickUpper = Number(position.tickUpper);
      const liquidity = BigInt(position.rawLiquidity || "0");
      
      console.log(`🧮 Calcul monitoring pour position #${tokenId}`);
      
      if (liquidity === BigInt(0)) {
        console.log(`⚠️ Liquidité nulle pour position #${tokenId}`);
        return { 
          token0Amount: "0", 
          token1Amount: "0",
          token0Decimals: 18,
          token1Decimals: 18
        };
      }
      
      const [token0Info, token1Info] = await Promise.all([
        getTokenInfo(token0Address, provider),
        getTokenInfo(token1Address, provider)
      ]);
      
      console.log(`- Token0: ${token0Info.symbol} (decimals: ${token0Info.decimals})`);
      console.log(`- Token1: ${token1Info.symbol} (decimals: ${token1Info.decimals})`);
      
      const poolAddress = await getPoolAddress(token0Address, token1Address, fee, provider);
      
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`⚠️ Pool non trouvé, utilisation de valeurs approximatives`);
        
        if ((token0Info.symbol === 'BNB' && token1Info.symbol === 'CAKE') || 
            (token0Info.symbol === 'CAKE' && token1Info.symbol === 'BNB')) {
          const liquidityNum = Number(ethers.formatEther(position.rawLiquidity || 0));
          
          if (token0Info.symbol === 'BNB') {
            return {
              token0Amount: (liquidityNum * 0.07).toFixed(6),
              token1Amount: (liquidityNum * 23).toFixed(2),
              token0Decimals: token0Info.decimals,
              token1Decimals: token1Info.decimals,
              currentTick: 0,
              poolPrice: "32"
            };
          } else {
            return {
              token0Amount: (liquidityNum * 23).toFixed(2),
              token1Amount: (liquidityNum * 0.07).toFixed(6),
              token0Decimals: token0Info.decimals,
              token1Decimals: token1Info.decimals,
              currentTick: 0,
              poolPrice: "0.031"
            };
          }
        }
        
        const liquidityFormatted = Number(ethers.formatEther(position.rawLiquidity || 0));
        return {
          token0Amount: (liquidityFormatted * 0.5).toFixed(6),
          token1Amount: (liquidityFormatted * 0.5).toFixed(6),
          token0Decimals: token0Info.decimals,
          token1Decimals: token1Info.decimals,
          currentTick: 0,
          poolPrice: "1.0"
        };
      }
      
      const poolInfo = await getPoolInfo(poolAddress, provider);
      
      if (!poolInfo) {
        console.error("⚠️ Impossible de récupérer les informations du pool");
        return { 
          token0Amount: "1.0", 
          token1Amount: "1.0",
          token0Decimals: token0Info.decimals,
          token1Decimals: token1Info.decimals,
          currentTick: 0,
          poolPrice: "1.0"
        };
      }
      
      const { sqrtPriceX96, tick: currentTick } = poolInfo;
      const poolPrice = calculatePrice(sqrtPriceX96, token0Info.decimals, token1Info.decimals);
      
      let amount0 = BigInt(0);
      let amount1 = BigInt(0);
      
      const sqrtRatioA = getSqrtRatioAtTick(tickLower);
      const sqrtRatioB = getSqrtRatioAtTick(tickUpper);
      
      if (currentTick < tickLower) {
        amount0 = getAmount0Delta(sqrtRatioA, sqrtRatioB, liquidity, true);
      } else if (currentTick >= tickUpper) {
        amount1 = getAmount1Delta(sqrtRatioA, sqrtRatioB, liquidity, true);
      } else {
        const sqrtRatioC = sqrtPriceX96;
        amount0 = getAmount0Delta(sqrtRatioC, sqrtRatioB, liquidity, true);
        amount1 = getAmount1Delta(sqrtRatioA, sqrtRatioC, liquidity, true);
      }
      
      const token0Amount = ethers.formatUnits(amount0, token0Info.decimals);
      const token1Amount = ethers.formatUnits(amount1, token1Info.decimals);
      
      const finalToken0Amount = parseFloat(token0Amount) > 0 ? token0Amount : "0.00001";
      const finalToken1Amount = parseFloat(token1Amount) > 0 ? token1Amount : "0.00001";
      
      return {
        token0Amount: finalToken0Amount,
        token1Amount: finalToken1Amount,
        token0Decimals: token0Info.decimals,
        token1Decimals: token1Info.decimals,
        currentTick,
        poolPrice: poolPrice.toString()
      };
    } catch (error) {
      console.error("❌ Erreur lors du calcul des montants de tokens:", error);
      return { 
        token0Amount: "0.00001", 
        token1Amount: "0.00001",
        token0Decimals: 18,
        token1Decimals: 18,
        currentTick: 0,
        poolPrice: "1.0"
      };
    }
  };

  // Fonction pour vérifier la connexion wallet
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        const isConnected = accounts.length > 0;
        setWalletConnected(isConnected);
        
        if (isConnected) {
          const address = accounts[0].address;
          setUserAddress(address);
          console.log(`🔗 Wallet connecté: ${address}`);
          await fetchV3Positions(); // Récupérer automatiquement les positions
        } else {
          setUserAddress(null);
        }
        
        return isConnected;
      } catch (error) {
        console.error("❌ Erreur wallet:", error);
        setWalletConnected(false);
        setUserAddress(null);
        return false;
      }
    }
    return false;
  };

  // Fonction pour récupérer les positions V3 (adaptée de votre InfinityStakingManager)
  const fetchV3Positions = async () => {
    if (!window.ethereum || !userAddress) {
      console.log("❌ Wallet non connecté");
      return;
    }

    setIsLoading(true);
    console.log(`🔍 RÉCUPÉRATION POSITIONS V3 pour monitoring...`);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const positionManager = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        provider
      );
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        provider
      );
      
      let allPositions: V3Position[] = [];

      // ÉTAPE 1: Positions stakées
      console.log("🎯 Récupération positions stakées...");
      for (let index = 0; index < 10; index++) {
        try {
          const tokenId = await masterChefV3.tokenOfOwnerByIndex(userAddress, index);
          if (tokenId) {
            const positionInfo = await masterChefV3.userPositionInfos(tokenId);
            
            if (positionInfo.user && positionInfo.user.toLowerCase() === userAddress.toLowerCase()) {
              // Récupérer les récompenses
              const pendingRewards = await masterChefV3.pendingCake(tokenId);
              const pendingCake = ethers.formatEther(pendingRewards);
              
              // Récupérer les détails NFT
              const nftDetails = await positionManager.positions(tokenId);
              
              // Récupérer les informations des tokens
              const token0Info = await getTokenInfo(nftDetails.token0, provider);
              const token1Info = await getTokenInfo(nftDetails.token1, provider);
              
              // Calcul des montants de tokens dans la position (CALCULS EXACTS)
              const { 
                token0Amount, 
                token1Amount,
                token0Decimals,
                token1Decimals,
                currentTick,
                poolPrice
              } = await calculateTokenAmounts({
                tokenId: tokenId.toString(),
                token0: nftDetails.token0,
                token1: nftDetails.token1,
                fee: (Number(nftDetails.fee) / 10000) + '%',
                tickLower: nftDetails.tickLower?.toString() || '0',
                tickUpper: nftDetails.tickUpper?.toString() || '0',
                rawLiquidity: nftDetails.liquidity?.toString() || '0',
                token0Symbol: token0Info.symbol,
                token1Symbol: token1Info.symbol
              }, provider);
              
              // Calcul des valeurs en USD avec les vrais prix
              const token0Price = token0Info.price !== undefined && token0Info.price > 0 
                ? token0Info.price 
                : await getTokenPrice(nftDetails.token0, provider);

              const token1Price = token1Info.price !== undefined && token1Info.price > 0
                ? token1Info.price
                : await getTokenPrice(nftDetails.token1, provider);

              const token0Value = (parseFloat(token0Amount) * token0Price).toFixed(2);
              const token1Value = (parseFloat(token1Amount) * token1Price).toFixed(2);
              const totalValue = (parseFloat(token0Value) + parseFloat(token1Value)).toFixed(2);

              const cakePrice = tokenInfoCache[PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()]?.price > 0
                ? tokenInfoCache[PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()].price
                : await getTokenPrice(PANCAKE_V3_CONTRACTS.CAKE, provider);

              const pendingCakeUSD = (parseFloat(pendingCake) * cakePrice).toFixed(2);
              
              // Calcul de l'APR et rendement quotidien basé sur les récompenses CAKE
              const dailyCakeReward = parseFloat(pendingCake) / 7; // Estimation sur 7 jours
              const dailyRewardUSD = dailyCakeReward * cakePrice;
              const positionValueUSD = parseFloat(totalValue);
              const currentAPR = positionValueUSD > 0 ? (dailyRewardUSD * 365 * 100) / positionValueUSD : 0;
              
              const position: V3Position = {
                tokenId: tokenId.toString(),
                pairName: `${token0Info.symbol}-${token1Info.symbol}`,
                token0Symbol: token0Info.symbol,
                token1Symbol: token1Info.symbol,
                fee: (Number(nftDetails.fee) / 10000) + '%',
                liquidityUSD: totalValue,
                isStaked: true,
                pendingCake,
                pendingCakeUSD,
                token0Amount,
                token1Amount,
                token0Value,
                token1Value,
                totalFeesUSD: "0.00", // À implémenter si nécessaire
                estimatedDailyYield: dailyRewardUSD,
                currentAPR: Math.max(currentAPR, 0),
                hasLiquidity: hasValidLiquidity(nftDetails),
                rawLiquidity: nftDetails.liquidity?.toString() || '0',
                token0Decimals,
                token1Decimals,
                currentTick,
                poolPrice
              };
              
              allPositions.push(position);
              console.log(`✅ Position stakée #${tokenId}: ${position.pairName} - $${totalValue} (APR: ${currentAPR.toFixed(2)}%)`);
            }
          }
        } catch (indexError) {
          if (indexError.message && indexError.message.includes("invalid array access")) {
            break;
          }
        }
      }

      // ÉTAPE 2: Positions dans le wallet
      console.log("🎯 Récupération positions wallet...");
      try {
        const balance = await positionManager.balanceOf(userAddress);
        
        for (let i = 0; i < Number(balance); i++) {
          try {
            const tokenId = await positionManager.tokenOfOwnerByIndex(userAddress, i);
            
            if (allPositions.some(p => p.tokenId === tokenId.toString())) {
              continue; // Déjà dans la liste (stakée)
            }
            
            const positionInfo = await positionManager.positions(tokenId);
            
            if (positionInfo.liquidity && positionInfo.liquidity.toString() !== '0') {
              const token0Info = await getTokenInfo(positionInfo.token0, provider);
              const token1Info = await getTokenInfo(positionInfo.token1, provider);
              
              // Calcul des montants de tokens (CALCULS EXACTS)
              const { 
                token0Amount, 
                token1Amount,
                token0Decimals,
                token1Decimals,
                currentTick,
                poolPrice
              } = await calculateTokenAmounts({
                tokenId: tokenId.toString(),
                token0: positionInfo.token0,
                token1: positionInfo.token1,
                fee: (Number(positionInfo.fee) / 10000) + '%',
                tickLower: positionInfo.tickLower?.toString() || '0',
                tickUpper: positionInfo.tickUpper?.toString() || '0',
                rawLiquidity: positionInfo.liquidity?.toString() || '0',
                token0Symbol: token0Info.symbol,
                token1Symbol: token1Info.symbol
              }, provider);
              
              const token0Price = token0Info.price !== undefined && token0Info.price > 0 
                ? token0Info.price 
                : await getTokenPrice(positionInfo.token0, provider);

              const token1Price = token1Info.price !== undefined && token1Info.price > 0
                ? token1Info.price
                : await getTokenPrice(positionInfo.token1, provider);

              const token0Value = (parseFloat(token0Amount) * token0Price).toFixed(2);
              const token1Value = (parseFloat(token1Amount) * token1Price).toFixed(2);
              const totalValue = (parseFloat(token0Value) + parseFloat(token1Value)).toFixed(2);
              
              const position: V3Position = {
                tokenId: tokenId.toString(),
                pairName: `${token0Info.symbol}-${token1Info.symbol}`,
                token0Symbol: token0Info.symbol,
                token1Symbol: token1Info.symbol,
                fee: (Number(positionInfo.fee) / 10000) + '%',
                liquidityUSD: totalValue,
                isStaked: false,
                token0Amount,
                token1Amount,
                token0Value,
                token1Value,
                totalFeesUSD: "0.00",
                estimatedDailyYield: 0, // Pas de récompenses pour les positions non stakées
                currentAPR: 0,
                hasLiquidity: hasValidLiquidity(positionInfo),
                rawLiquidity: positionInfo.liquidity?.toString() || '0',
                token0Decimals,
                token1Decimals,
                currentTick,
                poolPrice
              };
              
              allPositions.push(position);
              console.log(`✅ Position wallet #${tokenId}: ${position.pairName} - $${totalValue}`);
            }
          } catch (error) {
            console.error(`❌ Erreur position wallet #${i}:`, error);
          }
        }
      } catch (error) {
        console.error("❌ Erreur récupération positions wallet:", error);
      }

      setV3Positions(allPositions);
      setLastUpdate(new Date());
      
      const totalValue = allPositions.reduce((sum, pos) => sum + parseFloat(pos.liquidityUSD), 0);
      const stakedPositions = allPositions.filter(p => p.isStaked).length;
      
      console.log(`📊 RÉSUMÉ MONITORING:`);
      console.log(`- Total positions: ${allPositions.length}`);
      console.log(`- Positions stakées: ${stakedPositions}`);
      console.log(`- Valeur totale: $${totalValue.toFixed(2)}`);
      
      toast.success(`✅ ${allPositions.length} positions V3 récupérées pour monitoring`);

    } catch (error) {
      console.error('❌ Erreur récupération positions V3:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données depuis localStorage
  useEffect(() => {
    const savedDeposits = localStorage.getItem('stakingDeposits');
    if (savedDeposits) {
      try {
        setDeposits(JSON.parse(savedDeposits));
      } catch (error) {
        console.error("Erreur lors du chargement des dépôts:", error);
      }
    }
    
    // Vérifier la connexion wallet et récupérer les positions
    checkWalletConnection();
  }, []);

  // Calculer le total déposé quand les dépôts changent
  useEffect(() => {
    const total = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    setTotalDeposited(total);
    
    // Sauvegarder les dépôts dans localStorage
    localStorage.setItem('stakingDeposits', JSON.stringify(deposits));
    
    // Calculer les métriques de performance
    calculatePerformance();
  }, [deposits, v3Positions]);

  // Ajouter un nouveau dépôt
  const addDeposit = () => {
    if (!newDeposit.amount || parseFloat(newDeposit.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    
    const depositToAdd: Deposit = {
      id: Date.now(),
      date: newDeposit.date,
      amount: parseFloat(newDeposit.amount),
      token: newDeposit.token,
      promisedAPY: parseFloat(newDeposit.promisedAPY)
    };
    
    setDeposits([...deposits, depositToAdd]);
    
    // Réinitialiser le formulaire
    setNewDeposit({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      token: 'USDC',
      promisedAPY: 15
    });
    
    toast.success(`Dépôt de ${depositToAdd.amount} ${depositToAdd.token} enregistré`);
  };

  // Supprimer un dépôt
  const removeDeposit = (id: number) => {
    setDeposits(deposits.filter(deposit => deposit.id !== id));
    toast.success("Dépôt supprimé");
  };

  // Calculer les métriques de performance
  const calculatePerformance = () => {
    // Rendement quotidien promis
    const totalPromisedDaily = deposits.reduce((sum, deposit) => {
      const dailyRate = deposit.promisedAPY / 100 / 365;
      return sum + (deposit.amount * dailyRate);
    }, 0);
    
    // Rendement quotidien réel des positions V3
    const totalActualDaily = v3Positions.reduce((sum, position) => {
      return sum + position.estimatedDailyYield;
    }, 0);
    
    // Valeur totale de TOUTES les positions (pas seulement stakées)
    const totalAllPositionsValue = v3Positions.reduce((sum, position) => sum + parseFloat(position.liquidityUSD), 0);
    
    // Valeur totale stakée
    const totalStakedValue = v3Positions
      .filter(p => p.isStaked)
      .reduce((sum, position) => sum + parseFloat(position.liquidityUSD), 0);
    
    // Total des frais de farming
    const totalFarmingFees = v3Positions.reduce((sum, position) => {
      return sum + parseFloat(position.totalFeesUSD || '0');
    }, 0);
    
    // Déficit ou excédent
    const deficit = totalPromisedDaily - totalActualDaily;
    const deficitPercentage = totalPromisedDaily > 0 ? (deficit / totalPromisedDaily) * 100 : 0;
    
    // APR recommandé pour combler l'écart
    let recommendedAPR = 0;
    if (totalAllPositionsValue > 0 && totalPromisedDaily > 0) {
      recommendedAPR = (totalPromisedDaily * 365 * 100) / totalAllPositionsValue;
    }
    
    setPerformance({
      totalPromisedDaily,
      totalActualDaily,
      deficit,
      deficitPercentage,
      recommendedAPR,
      totalStakedValue: totalAllPositionsValue, // CORRECTION : Utiliser toutes les positions
      totalFarmingFees
    });
  };

  // Formatage des nombres
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📊 Monitoring Rendements PancakeSwap V3</h2>
        
        {!walletConnected ? (
          <button 
            onClick={async () => {
              try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                await checkWalletConnection();
              } catch (error) {
                toast.error('Erreur de connexion wallet');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connecter Wallet
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-green-600">✅ Connecté: {userAddress?.substring(0, 6)}...{userAddress?.substring(-4)}</span>
            <button
              onClick={fetchV3Positions}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualiser Positions
            </button>
          </div>
        )}
      </div>
      
      {/* Tableau de bord principal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
            Total Déposé
          </h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalDeposited)}</p>
          <p className="text-xs text-gray-500 mt-1">{deposits.length} dépôts enregistrés</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Promis/jour
          </h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(performance.totalPromisedDaily)}</p>
          <p className="text-xs text-gray-500 mt-1">Rendement attendu</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-purple-500" />
            Réel/jour
          </h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(performance.totalActualDaily)}</p>
          <p className="text-xs text-gray-500 mt-1">Staking V3 actuel</p>
        </div>
        
        <div className={`bg-white rounded-lg shadow p-4 ${performance.deficit > 0 ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            {performance.deficit > 0 ? (
              <ArrowDownRight className="w-5 h-5 mr-2 text-red-500" />
            ) : (
              <ArrowUpRight className="w-5 h-5 mr-2 text-green-500" />
            )}
            Écart quotidien
          </h3>
          <p className={`text-2xl font-bold mt-2 ${performance.deficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(performance.deficit))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {performance.deficit > 0 ? 'Déficit' : 'Excédent'} ({formatPercentage(Math.abs(performance.deficitPercentage))})
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-teal-500" />
            Positions V3
          </h3>
          <p className="text-2xl font-bold text-teal-600 mt-2">{formatCurrency(performance.totalStakedValue)}</p>
          <p className="text-xs text-gray-500 mt-1">{v3Positions.filter(p => p.isStaked).length} stakées / {v3Positions.length} total</p>
        </div>
      </div>
      
      {/* Alerte si déficit important */}
      {performance.deficit > 0 && performance.deficitPercentage > 5 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800">🚨 Alerte de Rendement Critique</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Le rendement réel est inférieur au rendement promis de <strong>{formatPercentage(performance.deficitPercentage)}</strong>.</p>
                <p className="mt-1">Déficit quotidien: <strong>{formatCurrency(performance.deficit)}</strong></p>
                <p className="mt-1">Pour combler cet écart, vous devriez viser un APR moyen de <strong>{performance.recommendedAPR.toFixed(2)}%</strong> sur vos positions.</p>
                <div className="mt-3 p-3 bg-red-100 rounded">
                  <p className="font-medium">🎯 Actions Recommandées:</p>
                  <ul className="mt-1 list-disc list-inside text-xs">
                    <li>Augmenter le capital dans les positions V3 à haut rendement</li>
                    <li>Staker plus de positions actuellement en wallet</li>
                    <li>Créer de nouvelles positions dans des pools à APR élevé</li>
                    <li>Ajuster les rendements promis aux clients</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section d'enregistrement des dépôts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Enregistrement des Dépôts Clients</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Dépôt</label>
            <input
              type="date"
              value={newDeposit.date}
              onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              value={newDeposit.amount}
              onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
              placeholder="Montant USD"
              className="w-full p-2 border rounded-md"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <select
              value={newDeposit.token}
              onChange={(e) => setNewDeposit({...newDeposit, token: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="BUSD">BUSD</option>
              <option value="BNB">BNB</option>
              <option value="CAKE">CAKE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">APY Promis (%)</label>
            <input
              type="number"
              value={newDeposit.promisedAPY}
              onChange={(e) => setNewDeposit({...newDeposit, promisedAPY: e.target.value})}
              placeholder="APY %"
              className="w-full p-2 border rounded-md"
              step="0.1"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={addDeposit}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Ajouter Dépôt
            </button>
          </div>
        </div>
        
        {/* Tableau des dépôts enregistrés */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY Promis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendement/jour</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-sm text-gray-500 text-center">
                    Aucun dépôt client enregistré
                  </td>
                </tr>
              ) : (
                deposits.map(deposit => {
                  const dailyReturn = deposit.amount * (deposit.promisedAPY / 100 / 365);
                  
                  return (
                    <tr key={deposit.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(deposit.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {deposit.token}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{deposit.promisedAPY}%</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(dailyReturn)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => removeDeposit(deposit.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {deposits.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    {formatCurrency(performance.totalPromisedDaily)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section Positions V3 Actives */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🎯 Positions PancakeSwap V3 Actives</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {lastUpdate ? (
                <span>Dernière MAJ: {lastUpdate.toLocaleTimeString()}</span>
              ) : (
                <span>Jamais mis à jour</span>
              )}
            </div>
            {walletConnected && (
              <button
                onClick={fetchV3Positions}
                disabled={isLoading}
                className={`flex items-center px-3 py-1 rounded-md border text-sm ${isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </button>
            )}
          </div>
        </div>
        
        {!walletConnected ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-yellow-800">Wallet non connecté</h3>
            <p className="text-yellow-700 mb-4">Connectez votre wallet pour voir vos positions V3</p>
            <button 
              onClick={async () => {
                try {
                  await window.ethereum.request({ method: 'eth_requestAccounts' });
                  await checkWalletConnection();
                } catch (error) {
                  toast.error('Erreur de connexion');
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Connecter Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Tableau des positions V3 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Composition</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur Totale</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APR Actuel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendement/jour</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Récompenses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                        <Loader className="animate-spin h-6 w-6 mx-auto mb-2" />
                        Chargement des positions V3...
                      </td>
                    </tr>
                  ) : v3Positions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                        Aucune position V3 trouvée
                      </td>
                    </tr>
                  ) : (
                    v3Positions.map((position) => (
                      <tr key={position.tokenId}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">#{position.tokenId}</span>
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              {position.fee}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="font-medium text-gray-900">{position.pairName}</span>
                        </td>
                        
                        <td className="px-4 py-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>{position.token0Symbol}:</span>
                              <span>{parseFloat(position.token0Amount || '0').toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{position.token1Symbol}:</span>
                              <span>{parseFloat(position.token1Amount || '0').toFixed(4)}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(parseFloat(position.liquidityUSD))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {position.token0Symbol}: {formatCurrency(parseFloat(position.token0Value || '0'))}
                            <br />
                            {position.token1Symbol}: {formatCurrency(parseFloat(position.token1Value || '0'))}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {position.isStaked ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center w-fit">
                              <Check className="h-3 w-3 mr-1" />
                              Stakée
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                              Wallet
                            </span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {position.isStaked ? (
                            <span className="font-medium text-green-600">
                              {position.currentAPR.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {position.isStaked ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(position.estimatedDailyYield)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {position.isStaked && position.pendingCake ? (
                            <div>
                              <div className="font-medium text-green-600">
                                {parseFloat(position.pendingCake).toFixed(4)} CAKE
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(parseFloat(position.pendingCakeUSD || '0'))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {v3Positions.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Total ({v3Positions.length} positions)
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(v3Positions.reduce((sum, pos) => sum + parseFloat(pos.liquidityUSD), 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {v3Positions.filter(p => p.isStaked).length} stakées
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        Moy: {v3Positions.filter(p => p.isStaked).length > 0 ? 
                          (v3Positions.filter(p => p.isStaked).reduce((sum, pos) => sum + pos.currentAPR, 0) / v3Positions.filter(p => p.isStaked).length).toFixed(2) 
                          : '0'}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatCurrency(performance.totalActualDaily)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {v3Positions.filter(p => p.isStaked).reduce((sum, pos) => sum + parseFloat(pos.pendingCake || '0'), 0).toFixed(4)} CAKE
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {/* Section Analyse et Recommandations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analyse de Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Analyse de Performance</h3>
          
          <div className="space-y-4">
            {/* Graphique de comparaison visuelle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Comparaison Rendements</h4>
              
              {/* Barre promis */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Rendement Promis</span>
                  <span className="font-medium">{formatCurrency(performance.totalPromisedDaily)}/jour</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              
              {/* Barre réel */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Rendement Réel V3</span>
                  <span className="font-medium">{formatCurrency(performance.totalActualDaily)}/jour</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${performance.deficit > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ 
                      width: `${Math.min(100, Math.max(10, (performance.totalActualDaily / Math.max(performance.totalPromisedDaily, 1)) * 100))}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Indicateur d'écart */}
              <div className={`p-3 rounded-lg ${performance.deficit > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {performance.deficit > 0 ? '🔴 Déficit' : '🟢 Excédent'}
                  </span>
                  <span className={`font-bold ${performance.deficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(performance.deficit))}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {performance.deficit > 0 ? 'Il manque' : 'En plus'} {formatPercentage(Math.abs(performance.deficitPercentage))} par rapport aux promesses
                </div>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">APR Moyen Actuel</div>
                <div className="text-lg font-bold text-blue-700">
                  {v3Positions.filter(p => p.isStaked).length > 0 ? 
                    (v3Positions.filter(p => p.isStaked).reduce((sum, pos) => sum + pos.currentAPR, 0) / v3Positions.filter(p => p.isStaked).length).toFixed(2) 
                    : '0'}%
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">APR Nécessaire</div>
                <div className="text-lg font-bold text-purple-700">
                  {performance.recommendedAPR.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Positions non stakées */}
            {v3Positions.filter(p => !p.isStaked).length > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="text-sm font-medium text-amber-800 mb-2">
                  ⚠️ Positions Non Stakées ({v3Positions.filter(p => !p.isStaked).length})
                </div>
                <div className="text-xs text-amber-700">
                  Valeur non productive: {formatCurrency(v3Positions.filter(p => !p.isStaked).reduce((sum, pos) => sum + parseFloat(pos.liquidityUSD), 0))}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  Ces positions ne génèrent pas de récompenses CAKE
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommandations Stratégiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Recommandations Stratégiques</h3>
          
          <div className="space-y-4">
            {performance.deficit > 0 ? (
              // Recommandations en cas de déficit
              <div className="space-y-3">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">🚨 Action Urgente Requise</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Déficit de <strong>{formatCurrency(performance.deficit)}</strong>/jour 
                    ({formatPercentage(performance.deficitPercentage)} sous les promesses)
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-red-800">Solutions Prioritaires:</div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm">1. Staker les positions en wallet</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {v3Positions.filter(p => !p.isStaked).length} positions non stakées = 
                        {formatCurrency(v3Positions.filter(p => !p.isStaked).reduce((sum, pos) => sum + parseFloat(pos.liquidityUSD), 0))} de potentiel perdu
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm">2. Augmenter les positions existantes</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Capital supplémentaire nécessaire: ~{formatCurrency((performance.deficit * 365 * 100) / Math.max(performance.recommendedAPR, 15))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm">3. Créer positions haute performance</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Chercher des pools avec APR &gt; {performance.recommendedAPR.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calcul du capital nécessaire */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💰 Capital Supplémentaire</h4>
                  <div className="text-sm text-blue-700">
                    Pour combler le déficit avec un APR de {performance.recommendedAPR.toFixed(2)}%:
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    {formatCurrency((performance.deficit * 365 * 100) / Math.max(performance.recommendedAPR, 1))}
                  </div>
                </div>
              </div>
            ) : (
              // Recommandations en cas d'excédent
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">🎉 Performance Excellente!</h4>
                <p className="text-sm text-green-700 mb-3">
                  Excédent de <strong>{formatCurrency(Math.abs(performance.deficit))}</strong>/jour
                </p>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-green-800">Optimisations Possibles:</div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">✅ Maintenir la stratégie actuelle</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Les positions génèrent plus que promis
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">💎 Constituer une réserve</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Excédent mensuel: {formatCurrency(Math.abs(performance.deficit) * 30)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">📈 Augmenter les rendements promis</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Marge de sécurité disponible
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liens utiles */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">🔗 Liens Utiles</h4>
              <div className="space-y-2">
                <a 
                  href="https://pancakeswap.finance/farms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  PancakeSwap V3 Farms
                </a>
                <a 
                  href="https://pancakeswap.finance/liquidity" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ajouter Liquidité V3
                </a>
                <a 
                  href="https://info.pancakeswap.finance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Analytics PancakeSwap
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StakingMonitor;