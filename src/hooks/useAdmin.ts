import { useState, useEffect, useRef, useCallback } from 'react';
import { useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import {
  ADMIN_DASHBOARD_ADDRESS,
  ADMIN_DASHBOARD_ABI,
  STAKING_MANAGER_ADDRESS,
  STAKING_MANAGER_ABI,
  STAKING_PANCAKESWAP_ADDRESS,
  STAKING_PANCAKESWAP_ABI,
  ERC20_ABI,
  BLOCK_EXPLORER_URL
} from '../config/contractsV2';

// Compteur global de refreshPools pour éviter les boucles infinies
let refreshPoolsCounter = 0;
const MAX_REFRESH_POOLS = 3; // Limite maximale de refreshPools

export function useAdminStatus(address?: string) {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'isAdmin',
    args: [address as `0x${string}`],
    enabled: !!address,
  });
}

export function useAnalytics() {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'getRecentAnalytics',
    args: [10], // Récupérer les 10 derniers points de données
  });
}

// Format numbers with commas for readability
const formatAmount = (amount) => {
  if (!amount) return "0";
  try {
    const number = ethers.formatUnits(amount, 18); // Ajustez les décimales selon vos tokens
    const parsed = parseFloat(number);
    return parsed.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  } catch (error) {
    console.error("Erreur de formatage:", error);
    return "0";
  }
};

export function usePoolManagement() {
  // État local pour stocker les informations des pools
  const [pools, setPools] = useState([]);
  // Nouvel état pour déclencher un rafraîchissement
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // État local pour suivre les pools mis à jour manuellement
  const [inactivePoolIds, setInactivePoolIds] = useState([]);
  
  // Référence pour éviter les rafraîchissements multiples
  const isRefreshingRef = useRef(false);
  // Référence pour stocker inactivePoolIds sans déclencher de re-rendus
  const inactivePoolIdsRef = useRef(inactivePoolIds);
  
  // Récupérer le nombre de pools
  const poolCountResult = useReadContract({
    address: STAKING_PANCAKESWAP_ADDRESS,
    abi: STAKING_PANCAKESWAP_ABI,
    functionName: 'poolLength',
  });
  
  // Fonction pour forcer le rafraîchissement des données - stabilisée avec useCallback
  const refreshPools = useCallback(() => {
    // Anti-boucle : Limiter le nombre de refreshPools
    if (refreshPoolsCounter >= MAX_REFRESH_POOLS) {
      console.warn(`Maximum refreshPools count (${MAX_REFRESH_POOLS}) reached. Stopping to prevent infinite loop.`);
      return;
    }
    
    if (isRefreshingRef.current) {
      console.log("Rafraîchissement déjà en cours, ignoré");
      return;
    }
    
    refreshPoolsCounter++;
    console.log(`Rafraîchissement des pools... (${refreshPoolsCounter}/${MAX_REFRESH_POOLS})`);
    isRefreshingRef.current = true;
    
    // Utiliser un timeout pour éviter les rafraîchissements trop fréquents
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      poolCountResult.refetch();
      isRefreshingRef.current = false;
    }, 500);
  }, [poolCountResult]);

  // Récupérer les détails des pools
  useEffect(() => {
    const fetchPoolDetails = async () => {
      setIsLoading(true);
      if (!poolCountResult.data) {
        setIsLoading(false);
        return;
      }
      
      try {
        const numberOfPools = Number(poolCountResult.data);
        console.log("Nombre total de pools récupéré:", numberOfPools);
        
        if (numberOfPools === 0) {
          console.log("Aucun pool trouvé");
          setPools([]);
          setIsLoading(false);
          return;
        }
        
        // Créer un tableau des pools
        const mockedPools = [];
        
        for (let i = 0; i < numberOfPools; i++) {
          // Utiliser la référence au lieu de l'état pour éviter les re-rendus en cascade
          const isInactive = inactivePoolIdsRef.current.includes(i);
          
          mockedPools.push({
            id: i,
            name: `Pool ${i+1}`,
            apr: "75.5",
            allocPoint: "100",
            totalStaked: "1,234,567",
            isActive: !isInactive // Actif par défaut, sauf si dans la liste des inactifs
          });
        }
        
        // Mettre à jour l'état avec les pools créés
        console.log("Pools créés:", mockedPools);
        setPools(mockedPools);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails des pools:", error);
        console.warn("Impossible de récupérer les pools. Création de données simplifiées.");
        setPools([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPoolDetails();
  }, [poolCountResult.data, refreshTrigger]); // Enlever inactivePoolIds des dépendances
  
  // Synchroniser la référence avec l'état
  useEffect(() => {
    inactivePoolIdsRef.current = inactivePoolIds;
  }, [inactivePoolIds]);
  
  // Réinitialiser le compteur lors du démontage du composant
  useEffect(() => {
    return () => {
      refreshPoolsCounter = 0;
    };
  }, []);
  
  // Préparer l'écriture de contrat
  const writeContract = useWriteContract();
  
  // Fonction pour ajouter un pool
  const addPool = async ({ args }) => {
    console.log("Tentative d'ajout d'un pool avec les arguments:", args);
    
    try {
      const result = await writeContract.writeContractAsync({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'addPool',
        args
      });
      
      console.log("Transaction soumise, résultat:", result);
      
      // Appeler refreshPools directement, sans setTimeout
      refreshPools();
      
      return result;
    } catch (error) {
      console.error("Erreur lors de l'ajout du pool:", error);
      throw error;
    }
  };
  
  // Fonction pour mettre à jour un pool
  // Fonction pour mettre à jour un pool
const updatePool = async ({ args }) => {
  console.log(`Tentative de mise à jour du pool avec les arguments:`, args);
  
  try {
    const result = await writeContract.writeContractAsync({
      address: STAKING_PANCAKESWAP_ADDRESS,
      abi: STAKING_PANCAKESWAP_ABI,
      functionName: 'updatePool',
      args
    });
    
    console.log("Transaction soumise, résultat:", result);
    
    // Extraire poolId, allocPoint et isActive des arguments
    const [poolId, allocPoint, isActive] = args;
    
    // Mise à jour en utilisant un updater de fonction pour éviter des dépendances stales
    if (isActive === false) {
      // Si on désactive le pool, vérifier d'abord qu'il n'est pas déjà dans la liste
      setInactivePoolIds(prev => {
        if (!prev.includes(poolId)) {
          console.log(`Pool ${poolId} marqué comme inactif localement`);
          return [...prev, poolId];
        }
        return prev;
      });
    } else {
      // Si on réactive le pool, le retirer de notre liste s'il y est
      setInactivePoolIds(prev => {
        if (prev.includes(poolId)) {
          console.log(`Pool ${poolId} réactivé localement`);
          return prev.filter(id => id !== poolId);
        }
        return prev;
      });
    }
    
    // Mettre à jour localement le pool correspondant
    setPools(prevPools => 
      prevPools.map(pool => {
        if (pool.id === poolId) {
          return {
            ...pool,
            allocPoint: allocPoint.toString(),
            isActive: isActive
          };
        }
        return pool;
      })
    );
    
    // Force un rafraîchissement après modification
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du pool:`, error);
    throw error;
  }
};
  
  return {
    pools,
    poolCount: poolCountResult.data ? Number(poolCountResult.data) : 0,
    isLoading: poolCountResult.isLoading || isLoading,
    addPool,
    updatePool,
    refreshPools,
    inactivePoolIds
  };
}

// cette section permet de vérifier manuellement l'état d'un pool sur la blockchain
export async function checkPoolStatus(poolId) {
  try {
    // Utiliser directement le contrat pour vérifier l'état
    const poolInfo = await stakingContract.getPoolInfo(poolId);
    return poolInfo.isActive;
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'état du pool ${poolId}:`, error);
    return true; // Par défaut, considérer le pool comme actif en cas d'erreur
  }
}

export function useEmergencyActions() {
  const writeContract = useWriteContract();
  
  const emergencyWithdraw = async ({ args }) => {
    try {
      const result = await writeContract.writeContractAsync({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'emergencyWithdraw',
        args
      });
      
      return result;
    } catch (error) {
      console.error("Erreur lors du retrait d'urgence:", error);
      throw error;
    }
  };

  // Fonction utilitaire pour formater les montants
  const formatAmount = (amount) => {
    if (!amount) return "0";
    try {
      // Version simplifiée
      return Number(amount).toLocaleString('fr-FR');
    } catch (error) {
      console.error("Erreur de formatage:", error);
      return "0";
    }
  };
  
  const pausePool = async ({ poolId, isActive }) => {
    try {
      const result = await writeContract.writeContractAsync({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'updatePool',
        args: [poolId, 0, isActive, true]
      });
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la ${isActive ? 'activation' : 'mise en pause'} du pool:`, error);
      throw error;
    }
  };
  
  return {
    emergencyWithdraw,
    pausePool,
  };
}