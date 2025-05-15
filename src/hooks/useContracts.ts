import { useReadContract } from 'wagmi';
import { bsc } from 'wagmi/chains';
import {
  STAKING_MANAGER_ADDRESS,
  STAKING_MANAGER_ABI,
  MONITORING_INTERFACE_ADDRESS,
  MONITORING_INTERFACE_ABI,
  ADMIN_DASHBOARD_ADDRESS,
  ADMIN_DASHBOARD_ABI,
  STAKING_PANCAKESWAP_ADDRESS,
  STAKING_PANCAKESWAP_ABI,
} from '../config/contracts';

export function useGlobalStats() {
  // Utilisation du hook pour lire les données réelles
  const result = useReadContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'getGlobalStatsSummary',
    chainId: bsc.id, // Spécifier explicitement BSC
    // Ne pas désactiver en développement pour permettre la lecture réelle des données
  });

  // Si une erreur se produit, la capturer mais ne pas modifier les données
  if (result.isError) {
    console.error("Erreur de lecture du contrat:", result.error);
    // On ne modifie pas le résultat - l'erreur sera propagée
  }
  
  // Retourner le résultat tel quel, qu'il soit en cours de chargement, en erreur ou avec des données
  return result;
}

export function useUserStakingData(address: string) {
  return useReadContract({
    address: MONITORING_INTERFACE_ADDRESS,
    abi: MONITORING_INTERFACE_ABI,
    functionName: 'getUserStakingData',
    args: [address],
  });
}

export function useAnalyticsCount() {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'getAnalyticsCount',
  });
}

export function useAdminStatus(address?: string) {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
    enabled: !!address
  });
}

// Dans votre fichier useContracts.js ou similaire
export function usePoolStatus(poolId) {
  return useReadContract({
    address: STAKING_PANCAKESWAP_ADDRESS,
    abi: STAKING_PANCAKESWAP_ABI,
    functionName: 'getPoolInfo',
    args: [poolId],
    watch: true, // Surveiller les mises à jour
  });
}