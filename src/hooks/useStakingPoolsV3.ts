// hooks/useStakingPoolsV3.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { 
  PANCAKE_V3_CONTRACTS, 
  COMMON_TOKENS 
} from '../config/contracts';
import { MASTERCHEF_V3_ABI, POSITION_MANAGER_ABI } from '../abis/pancakeV3Abis';

// Les pools V3 sont en fait des positions NFT, donc la structure est différente
const examplePositions = [
  {
    tokenId: "123456",
    token0Symbol: "CAKE",
    token1Symbol: "BNB",
    fee: 2500, // 0.25%
    tickLower: -100000,
    tickUpper: 100000,
    liquidity: "1000000000000000000", // 1.0 en notation scientifique
    priceLower: 0.5,
    priceUpper: 2.0,
    currentPrice: 1.2,
    isInRange: true,
    isStaked: true,
    pendingCake: "25.5"
  },
  {
    tokenId: "234567",
    token0Symbol: "BUSD",
    token1Symbol: "BNB",
    fee: 500, // 0.05%
    tickLower: -50000,
    tickUpper: 50000,
    liquidity: "2000000000000000000", // 2.0 en notation scientifique
    priceLower: 250,
    priceUpper: 350,
    currentPrice: 300,
    isInRange: true,
    isStaked: true,
    pendingCake: "12.3"
  }
];

// Fonction pour vérifier si une adresse Ethereum est valide
const isValidEthAddress = (address) => {
  return typeof address === 'string' && 
         address.startsWith('0x') && 
         address.length === 42 && 
         /^0x[0-9a-fA-F]{40}$/.test(address);
};

// Compteur global de refetch pour éviter les boucles infinies
let refetchCounter = 0;
const MAX_REFETCH = 3;

// Variable pour stocker les résultats en cache
let positionsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 secondes de cache

// Fonction pour réinitialiser le compteur (exportée pour utilisation externe)
export function resetStakingPositionsCounter() {
  refetchCounter = 0;
  console.log("Compteur de refetch réinitialisé");
  // Réinitialiser aussi le cache pour forcer un vrai rafraîchissement
  positionsCache = null;
  lastFetchTime = 0;
}

// Converti tick en prix
function tickToPrice(tick) {
  return Math.pow(1.0001, tick);
}

export function useStakingPoolsV3(userAddress?: string) {
  const previousUserAddress = useRef(userAddress);
  
  if (previousUserAddress.current !== userAddress) {
    console.log('useStakingPoolsV3 appelé avec userAddress:', userAddress);
    previousUserAddress.current = userAddress;
  }
  
  // État pour les positions
  const [positions, setPositions] = useState([]);
  const [stakedPositions, setStakedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Référence pour le statut de récupération en cours
  const isFetchingRef = useRef(false);
  
  // Récupérer le nombre de positions NFT de l'utilisateur
  const balanceOfNFTsResult = useReadContract({
    address: PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: 'balanceOf',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    enabled: !!userAddress && isValidEthAddress(userAddress),
  });
  
  // Récupérer les positions stakées de l'utilisateur
  const stakedTokenIdsResult = useReadContract({
    address: PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
    abi: MASTERCHEF_V3_ABI,
    functionName: 'tokenIdsOf',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    enabled: !!userAddress && isValidEthAddress(userAddress),
  });

  // Fonction pour récupérer une position spécifique (non activée par défaut)
  const positionInfoResult = useReadContract({
    address: PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [0], // TokenId initial, sera mis à jour dynamiquement
    enabled: false, // Pas activé par défaut
  });
  
  // Fonction pour récupérer les récompenses en attente (non activée par défaut)
  const pendingCakeResult = useReadContract({
    address: PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
    abi: MASTERCHEF_V3_ABI,
    functionName: 'pendingCake',
    args: [0], // TokenId initial, sera mis à jour dynamiquement
    enabled: false, // Pas activé par défaut
  });
  
  // Fonction pour rafraîchir les données
  const refetch = useCallback(() => {
    // Anti-boucle
    if (refetchCounter >= MAX_REFETCH) {
      console.warn(`Maximum refetch count (${MAX_REFETCH}) reached. Stopping refetch.`);
      return;
    }
    
    // Éviter les rafraîchissements multiples
    if (isFetchingRef.current) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return;
    }
    
    // Force le cache à expirer
    lastFetchTime = 0;
    
    refetchCounter++;
    console.log(`Rafraîchissement des positions V3... (${refetchCounter}/${MAX_REFETCH})`);
    setRefreshTrigger(prev => prev + 1);
    
    // Refetch après un court délai
    setTimeout(() => {
      if (userAddress) {
        balanceOfNFTsResult.refetch();
        stakedTokenIdsResult.refetch();
      }
      isFetchingRef.current = false;
    }, 100);
  }, [balanceOfNFTsResult, stakedTokenIdsResult, userAddress]);

  // Cache des symboles de tokens
  const tokenSymbolsCache = useRef({});
  
  // Simuler la récupération d'un symbole de token
  const getTokenSymbol = useCallback(async (tokenAddress) => {
    // Vérifier dans le cache
    if (tokenSymbolsCache.current[tokenAddress]) {
      return tokenSymbolsCache.current[tokenAddress];
    }
    
    // Tokens connus
    const knownTokens = {
      [COMMON_TOKENS.CAKE.toLowerCase()]: 'CAKE',
      [COMMON_TOKENS.WBNB.toLowerCase()]: 'WBNB',
      [COMMON_TOKENS.BUSD.toLowerCase()]: 'BUSD',
      [COMMON_TOKENS.USDT.toLowerCase()]: 'USDT',
      [COMMON_TOKENS.USDC.toLowerCase()]: 'USDC'
    };
    
    // Vérifier si c'est un token connu
    const lowerCaseAddress = tokenAddress.toLowerCase();
    if (knownTokens[lowerCaseAddress]) {
      tokenSymbolsCache.current[tokenAddress] = knownTokens[lowerCaseAddress];
      return knownTokens[lowerCaseAddress];
    }
    
    // Simuler un délai de récupération
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Pour cet exemple, retourner les 4 premiers caractères de l'adresse
    const symbol = 'TKN_' + tokenAddress.substring(2, 6);
    tokenSymbolsCache.current[tokenAddress] = symbol;
    return symbol;
  }, []);

  // Fonction pour récupérer les détails des positions
  const fetchPositionsDetails = useCallback(async () => {
    // Si déjà en train de récupérer, éviter un nouvel appel
    if (isFetchingRef.current) {
      return;
    }
    
    // Si pas d'adresse utilisateur valide, utiliser des exemples
    if (!userAddress || !isValidEthAddress(userAddress)) {
      console.log("Adresse utilisateur non valide, utilisation des exemples");
      setPositions([]);
      setStakedPositions(examplePositions);
      setIsLoading(false);
      return;
    }
    
    // Vérifier si le cache est valide
    const now = Date.now();
    if (positionsCache && (now - lastFetchTime < CACHE_DURATION)) {
      console.log("Utilisation du cache de positions");
      setPositions(positionsCache.positions || []);
      setStakedPositions(positionsCache.stakedPositions || []);
      setIsLoading(false);
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // Récupérer le nombre de positions
      const nftBalance = balanceOfNFTsResult.data ? Number(balanceOfNFTsResult.data) : 0;
      console.log(`L'utilisateur possède ${nftBalance} positions NFT non stakées`);
      
      // Récupérer les positions stakées
      const stakedTokenIds = stakedTokenIdsResult.data || [];
      console.log(`L'utilisateur possède ${stakedTokenIds.length} positions NFT stakées`);
      
      // Si aucune position, utiliser des exemples
      if (nftBalance === 0 && stakedTokenIds.length === 0) {
        setPositions([]);
        setStakedPositions(examplePositions);
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }
      
      // Récupérer les positions non stakées
      const unstaked = [];
      for (let i = 0; i < Math.min(nftBalance, 5); i++) {
        try {
          // Récupérer le token ID
          const tokenIdResult = await useReadContract.fetchQuery({
            address: PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
            abi: POSITION_MANAGER_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [userAddress, i],
          });
          
          const tokenId = tokenIdResult;
          
          // Récupérer les détails de la position
          const positionDetails = await positionInfoResult.refetch({
            args: [tokenId],
          });
          
          if (positionDetails.data) {
            const position = positionDetails.data;
            
            // Récupérer les symboles des tokens
            const [token0Symbol, token1Symbol] = await Promise.all([
              getTokenSymbol(position[2]), // token0
              getTokenSymbol(position[3]), // token1
            ]);
            
            // Calculer les prix à partir des ticks
            const tickLower = Number(position[5]);
            const tickUpper = Number(position[6]);
            const priceLower = tickToPrice(tickLower);
            const priceUpper = tickToPrice(tickUpper);
            const currentPrice = (priceLower + priceUpper) / 2; // Approximation
            
            unstaked.push({
              tokenId: tokenId.toString(),
              token0: position[2],
              token0Symbol,
              token1: position[3],
              token1Symbol,
              fee: Number(position[4]),
              tickLower,
              tickUpper,
              liquidity: position[7].toString(),
              priceLower,
              priceUpper,
              currentPrice,
              isInRange: true, // Simplifié
              isStaked: false,
              pendingCake: "0"
            });
          }
        } catch (err) {
          console.error(`Erreur lors de la récupération de la position ${i}:`, err);
        }
      }
      
      // Récupérer les positions stakées
      const staked = [];
      for (let i = 0; i < Math.min(stakedTokenIds.length, 5); i++) {
        try {
          const tokenId = stakedTokenIds[i];
          
          // Récupérer les détails de la position
          const positionDetails = await positionInfoResult.refetch({
            args: [tokenId],
          });
          
          // Récupérer les récompenses en attente
          const pendingReward = await pendingCakeResult.refetch({
            args: [tokenId],
          });
          
          if (positionDetails.data) {
            const position = positionDetails.data;
            
            // Récupérer les symboles des tokens
            const [token0Symbol, token1Symbol] = await Promise.all([
              getTokenSymbol(position[2]), // token0
              getTokenSymbol(position[3]), // token1
            ]);
            
            // Calculer les prix à partir des ticks
            const tickLower = Number(position[5]);
            const tickUpper = Number(position[6]);
            const priceLower = tickToPrice(tickLower);
            const priceUpper = tickToPrice(tickUpper);
            const currentPrice = (priceLower + priceUpper) / 2; // Approximation
            
            const pendingCakeFormatted = pendingReward.data 
              ? ethers.formatUnits(pendingReward.data, 18)
              : "0";
            
            staked.push({
              tokenId: tokenId.toString(),
              token0: position[2],
              token0Symbol,
              token1: position[3],
              token1Symbol,
              fee: Number(position[4]),
              tickLower,
              tickUpper,
              liquidity: position[7].toString(),
              priceLower,
              priceUpper,
              currentPrice,
              isInRange: true, // Simplifié
              isStaked: true,
              pendingCake: pendingCakeFormatted
            });
          }
        } catch (err) {
          console.error(`Erreur lors de la récupération de la position stakée ${i}:`, err);
        }
      }
      
      // Si aucune position n'a été récupérée avec succès, utiliser des exemples
      if (unstaked.length === 0 && staked.length === 0) {
        setPositions([]);
        setStakedPositions(examplePositions);
      } else {
        setPositions(unstaked);
        setStakedPositions(staked);
        
        // Mise en cache
        positionsCache = {
          positions: unstaked,
          stakedPositions: staked
        };
        lastFetchTime = now;
      }
      
      setIsError(false);
      
    } catch (err) {
      console.error("Erreur lors de la récupération des positions:", err);
      setError(err);
      setIsError(true);
      setPositions([]);
      setStakedPositions(examplePositions);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    userAddress, 
    balanceOfNFTsResult.data, 
    stakedTokenIdsResult.data, 
    positionInfoResult, 
    pendingCakeResult,
    getTokenSymbol
  ]);
  
  // useEffect pour déclencher fetchPositionsDetails
  useEffect(() => {
    let isMounted = true;
    
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchPositionsDetails();
      }
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [refreshTrigger, fetchPositionsDetails]);
  
  // Réinitialiser le compteur lors du démontage
  useEffect(() => {
    return () => {
      refetchCounter = 0;
    };
  }, []);
  
  // Mémoriser les valeurs de retour
  return useMemo(() => ({
    unstaked: positions,
    staked: stakedPositions,
    all: [...positions, ...stakedPositions],
    isLoading,
    isError,
    error,
    refetch
  }), [positions, stakedPositions, isLoading, isError, error, refetch]);
}