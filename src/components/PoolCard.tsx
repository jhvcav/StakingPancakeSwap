import { useState, useCallback, useMemo, useEffect } from 'react';
import { ExternalLink, RefreshCw, EyeOff, AlertTriangle } from 'lucide-react';
import { useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { STAKING_PANCAKESWAP_ADDRESS, STAKING_PANCAKESWAP_ABI, BLOCK_EXPLORER_URL } from '../config/contracts';
import { StakingManager } from './StakingManager';
import { toast } from 'react-hot-toast';

// Fonction de validation d'adresse Ethereum
const isValidEthAddress = (address) => {
  return typeof address === 'string' && 
         address.startsWith('0x') && 
         address.length === 42 && 
         /^0x[0-9a-fA-F]{40}$/.test(address);
};

// Adresses d'exemple connues pour les fallbacks
const EXAMPLE_LP_ADDRESSES = [
  "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0", // CAKE-BNB LP
  "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16", // BUSD-BNB LP
  "0x28415ff2C35b65B9E5c7de82126b4015ab9d031F", // ETH-BNB LP
  "0xbCD62661A6b1DEd703585d3aF7d7649Ef4dcDB5c"  // USDT-BNB LP
];

// Props typiques pour un PoolCard
interface PoolCardProps {
  id: number;
  name: string;
  apr: string;
  totalStaked: string;
  userStaked: string;
  pendingRewards: string;
  lpToken?: any; // Peut être une chaîne, un objet, ou undefined
  isActive?: boolean;
  onSuccess?: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = (props) => {
  console.log("Props reçues dans PoolCard:", props);
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // NOUVEAU: État pour les données réelles
  const [realUserData, setRealUserData] = useState({
    userStaked: "0",
    pendingRewards: "0"
  });
  
  // NOUVEAU: Récupérer les vraies données utilisateur
  useEffect(() => {
    const fetchRealData = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(
            STAKING_PANCAKESWAP_ADDRESS,
            [
              "function userInfo(uint256, address) view returns (uint256, uint256, uint256, uint256, bool)",
              "function pendingReward(uint256, address) view returns (uint256)"
            ],
            provider
          );
          
          const userAddress = await provider.getSigner().then(s => s.getAddress());
          
          // Récupérer les infos utilisateur
          const userInfo = await contract.userInfo(props.id, userAddress);
          const pendingRewards = await contract.pendingReward(props.id, userAddress);
          
          setRealUserData({
            userStaked: ethers.formatEther(userInfo[0]),
            pendingRewards: ethers.formatEther(pendingRewards)
          });
          
          console.log(`Pool ${props.id} - Données réelles:`, {
            userStaked: ethers.formatEther(userInfo[0]),
            pendingRewards: ethers.formatEther(pendingRewards)
          });
          
        } catch (error) {
          console.error("Erreur récupération données:", error);
        }
      }
    };
    
    fetchRealData();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchRealData, 10000);
    return () => clearInterval(interval);
  }, [props.id]);
  
  // Fonction pour obtenir une adresse LP valide à partir de différents formats possibles
  const getValidLpAddress = useCallback((lpToken: any): string | null => {
    // Si c'est déjà une adresse valide
    if (isValidEthAddress(lpToken)) {
      return lpToken;
    }
    
    // Si c'est un objet avec une propriété "address" (cas fréquent avec ethers.js)
    if (lpToken && typeof lpToken === 'object' && 'address' in lpToken) {
      const extractedAddress = lpToken.address;
      if (isValidEthAddress(extractedAddress)) {
        return extractedAddress;
      }
    }
    
    // Si c'est un objet avec une propriété "lpToken"
    if (lpToken && typeof lpToken === 'object' && 'lpToken' in lpToken) {
      const nestedAddress = lpToken.lpToken;
      if (isValidEthAddress(nestedAddress)) {
        return nestedAddress;
      }
    }
    
    // Fallback sur des adresses d'exemple si l'ID correspond
    if (typeof props.id === 'number' && props.id < EXAMPLE_LP_ADDRESSES.length) {
      return EXAMPLE_LP_ADDRESSES[props.id];
    }
    
    return null;
  }, [props.id]);
  
  // Fonction pour afficher l'adresse LP abrégée
  const renderLpAddress = useCallback(() => {
    const validAddress = getValidLpAddress(props.lpToken);
    
    if (validAddress) {
      return `${validAddress.substring(0, 6)}...${validAddress.substring(validAddress.length - 4)}`;
    }
    
    return "Adresse non disponible";
  }, [props.lpToken, getValidLpAddress]);
  
  // Fonction pour ouvrir l'explorateur de blocs avec l'adresse LP
  const handleViewLpToken = useCallback(() => {
    const validAddress = getValidLpAddress(props.lpToken);
    
    if (validAddress) {
      window.open(`${BLOCK_EXPLORER_URL}/token/${validAddress}`, '_blank');
    } else {
      alert(`Adresse de token LP non disponible ou invalide.`);
    }
  }, [props.lpToken, getValidLpAddress]);
  
  // Configuration pour le staking
  const { writeContractAsync: stake } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setIsStaking(false);
        setStakeAmount('');
        if (props.onSuccess) props.onSuccess();
      },
      onError: (error) => {
        console.error("Erreur lors du staking:", error);
        setIsStaking(false);
      }
    }
  });
  
  // Configuration pour le withdrawal
  const { writeContractAsync: withdraw } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setIsWithdrawing(false);
        setWithdrawAmount('');
        if (props.onSuccess) props.onSuccess();
      },
      onError: (error) => {
        console.error("Erreur lors du retrait:", error);
        setIsWithdrawing(false);
      }
    }
  });
  
  // Configuration pour le claim des récompenses
  const { writeContractAsync: claimReward } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setIsClaiming(false);
        if (props.onSuccess) props.onSuccess();
      },
      onError: (error) => {
        console.error("Erreur lors de la réclamation des récompenses:", error);
        setIsClaiming(false);
      }
    }
  });
  
  // Gestionnaire pour le staking
  const handleStake = useCallback(async (e) => {
    e.preventDefault();
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    setIsStaking(true);
    
    try {
      const amountInWei = ethers.parseUnits(stakeAmount, 18);
      
      await stake({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'deposit',
        args: [props.id, amountInWei],
      });
    } catch (error) {
      console.error("Erreur lors du staking:", error);
      setIsStaking(false);
    }
  }, [props.id, stakeAmount, stake]);
  
  // Gestionnaire pour le withdrawal
  const handleWithdraw = useCallback(async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    setIsWithdrawing(true);
    
    try {
      const amountInWei = ethers.parseUnits(withdrawAmount, 18);
      
      await withdraw({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'withdraw',
        args: [props.id, amountInWei],
      });
    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      setIsWithdrawing(false);
    }
  }, [props.id, withdrawAmount, withdraw]);
  
  // Gestionnaire pour le claim des récompenses
  const handleClaimRewards = useCallback(async () => {
    setIsClaiming(true);
    
    try {
      await claimReward({
        address: STAKING_PANCAKESWAP_ADDRESS,
        abi: STAKING_PANCAKESWAP_ABI,
        functionName: 'claimReward',
        args: [props.id],
      });
      toast.success('Récompenses réclamées avec succès !');
    } catch (error) {
      console.error("Erreur lors de la réclamation des récompenses:", error);
      toast.error('Erreur lors de la réclamation');
      setIsClaiming(false);
    }
  }, [props.id, claimReward]);
  
  // Calculer si le bouton de réclamation est désactivé
  const isClaimButtonDisabled = useMemo(() => {
    return parseFloat(realUserData.pendingRewards) <= 0 || isClaiming || !props.isActive;
  }, [realUserData.pendingRewards, isClaiming, props.isActive]);
  
  // Fonction pour formater les montants de manière sûre
  const formatAmountSafe = (amount: string | number): string => {
    try {
      // Si c'est déjà formaté avec des virgules, le retourner tel quel
      if (typeof amount === 'string' && amount.includes(',')) {
        return amount;
      }
      
      // Si c'est déjà un nombre avec point décimal
      if (typeof amount === 'string' && amount.includes('.')) {
        return parseFloat(amount).toFixed(6);
      }
      
      // Si c'est un grand nombre (Wei), le convertir
      if (typeof amount === 'string' && amount.length > 10 && !amount.includes('.')) {
        return parseFloat(ethers.formatEther(amount)).toFixed(6);
      }
      
      // Sinon, traiter comme un nombre normal
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return num.toFixed(6);
    } catch (error) {
      console.error('Erreur formatage:', error);
      return '0.000000';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Entête du pool avec son nom, APR et adresse LP */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-100 to-indigo-50">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-gray-800">{props.name}</h3>
          <div className="flex items-center">
            {!props.isActive && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-md mr-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Inactif
              </span>
            )}
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-md">
              APR: {props.apr}%
            </span>
          </div>
        </div>
        
        {/* Adresse LP avec indicateur de validité */}
        <div 
          className="text-xs text-gray-500 flex items-center cursor-pointer hover:text-blue-600"
          onClick={handleViewLpToken}
        >
          <span>LP Token: {renderLpAddress()}</span>
          <ExternalLink className="w-3 h-3 ml-1" />
          {getValidLpAddress(props.lpToken) ? (
            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
          ) : (
            <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </div>
      </div>
      
      {/* Contenu principal du pool */}
      <div className="p-5 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Staké</p>
            <p className="text-lg font-medium">
              {formatAmountSafe(props.totalStaked)} LP
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Votre Stake</p>
            <p className="text-lg font-medium">
              {formatAmountSafe(realUserData.userStaked)} LP
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Récompenses en attente</p>
          <p className="text-lg font-medium text-purple-600">
            {formatAmountSafe(realUserData.pendingRewards)} CAKE
          </p>
          {parseFloat(realUserData.pendingRewards) > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ≈ ${(parseFloat(realUserData.pendingRewards) * 3.5).toFixed(2)} USD
            </p>
          )}
        </div>
        
        {/* Bouton pour réclamer les récompenses */}
        <button
          onClick={handleClaimRewards}
          disabled={isClaimButtonDisabled}
          className={`w-full py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors
            ${isClaimButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isClaiming ? (
            <span className="flex items-center justify-center">
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Réclamation...
            </span>
          ) : `Réclamer ${formatAmountSafe(realUserData.pendingRewards)} CAKE`}
        </button>
        
        {/* Bouton pour afficher/masquer les détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center"
        >
          {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
          {showDetails ? <EyeOff className="h-3 w-3 ml-1" /> : '▼'}
        </button>
      </div>
      
      {/* Détails supplémentaires (utilisation du StakingManager) */}
      {showDetails && (
        <div className="p-5">
          <StakingManager
            poolId={props.id}
            lpTokenAddress={getValidLpAddress(props.lpToken)}
            onSuccess={props.onSuccess}
          />
        </div>
      )}
    </div>
  );
};