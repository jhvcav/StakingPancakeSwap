import { useReadContract, useReadContracts } from 'wagmi';
import { 
  STAKING_MANAGER_ADDRESS, 
  STAKING_MANAGER_ABI 
} from '../config/contracts';

export function useStakingPools(userAddress?: string) {
  // Récupérer le nombre d'instances de staking
  const instanceCountResult = useReadContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'getStakingInstanceCount',
    enabled: true,
  });
  
  const instanceCount = instanceCountResult.data ? Number(instanceCountResult.data) : 0;
  
  // Préparer les requêtes pour chaque instance
  const instanceQueries = [];
  for (let i = 0; i < instanceCount; i++) {
    instanceQueries.push({
      address: STAKING_MANAGER_ADDRESS,
      abi: STAKING_MANAGER_ABI,
      functionName: 'getStakingInstanceDetails',
      args: [i],
    });
  }
  
  // Lire les détails des instances
  const instancesResult = useReadContracts({
    contracts: instanceQueries,
    enabled: instanceCount > 0,
  });
  
  // Formater les données
  const formattedPools = [];
  
  if (instancesResult.data) {
    for (let i = 0; i < instancesResult.data.length; i++) {
      const instance = instancesResult.data[i];
      if (instance.result && instance.result.isActive) {
        formattedPools.push({
          id: i,
          name: instance.result.name,
          apr: "0", // L'APR n'est pas directement disponible, vous pourriez le calculer séparément
          totalStaked: instance.result.tvl.toString(),
          userStaked: "0", // Vous devrez faire une requête séparée pour obtenir cette information
          pendingRewards: "0" // Vous devrez faire une requête séparée pour obtenir cette information
        });
      }
    }
  }
  
  // Si l'utilisateur est connecté, vérifier ses positions de staking
  if (userAddress && formattedPools.length > 0) {
    // Ici, vous devrez implémenter une logique personnalisée pour obtenir les données utilisateur
    // en utilisant les fonctions disponibles comme isUserStaking et getPendingRewards
  }
  
  console.log('formattedPools:', formattedPools);
  
  return {
    data: formattedPools,
    isLoading: instanceCountResult.isLoading || instancesResult.isLoading,
    isError: instanceCountResult.isError || instancesResult.isError,
    error: instanceCountResult.error || instancesResult.error
  };
}