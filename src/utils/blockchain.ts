import { ethers } from 'ethers';
import { 
  STAKING_PANCAKESWAP_ADDRESS, 
  STAKING_PANCAKESWAP_ABI 
} from '../config/contracts';

export async function getPoolsStatusDirectly() {
  // Vérifier si window.ethereum est disponible
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error("MetaMask n'est pas installé ou n'est pas accessible");
    return []; // Retourner un tableau vide en cas d'erreur
  }
  
  try {
    // Pour ethers v6
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Création du contrat
    const contract = new ethers.Contract(
      STAKING_PANCAKESWAP_ADDRESS,
      STAKING_PANCAKESWAP_ABI,
      signer
    );
    
    // Obtenir le nombre de pools
    const poolLength = await contract.poolLength();
    console.log("Blockchain - Nombre de pools:", poolLength.toString());
    
    // Récupérer les détails de chaque pool
    const poolsInfo = [];
    for (let i = 0; i < poolLength; i++) {
      try {
        const poolInfo = await contract.getPoolInfo(i);
        
        // Log détaillé pour débogage
        console.log(`Blockchain - Pool ${i}:`, {
          lpToken: poolInfo[0],
          allocPoint: poolInfo[1].toString(),
          isActive: poolInfo[5] // Index correspondant à isActive
        });
        
        poolsInfo.push({
          id: i,
          name: `Pool ${i + 1}`,
          apr: "75.5", // Valeur par défaut
          totalStaked: poolInfo[4].toString(),
          userStaked: "0", // Valeur par défaut
          pendingRewards: "0", // Valeur par défaut
          lpToken: poolInfo[0],
          isActive: poolInfo[5] // Assurez-vous que l'index est correct
        });
      } catch (poolError) {
        console.error(`Erreur lors de la récupération du pool ${i}:`, poolError);
      }
    }
    
    return poolsInfo;
  } catch (error) {
    console.error("Erreur lors de la récupération des pools:", error);
    return [];
  }
}