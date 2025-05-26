import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { TrendingUp, DollarSign, ArrowLeft, ExternalLink, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Importez les ABI et adresses de contrats nécessaires
import { PANCAKE_V3_CONTRACTS } from '../config/contracts';
import { 
  POSITION_MANAGER_ABI, 
  MASTERCHEF_V3_ABI,
  ROUTER_ABI,
  ERC20_ABI 
} from '../abis/pancakeV3Abis';

// Log de l'ABI pour débogage
console.log("ABI du positionManager:", POSITION_MANAGER_ABI);

// Fonction utilitaire pour gérer les différentes fonctions de toast
const showToast = (message, type = 'success') => {
  if (type === 'info') {
    // Si toast.info n'existe pas, utiliser toast avec une configuration personnalisée
    // ou simplement utiliser toast() standard
    if (typeof toast.info === 'function') {
      toast.info(message);
    } else {
      toast(message);
    }
  } else if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else {
    toast(message);
  }
};

// Constante pour la clé API BSC Scan
// Cette ligne récupère la clé API depuis les variables d'environnement
const BSC_SCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY || '';

// Fonction pour obtenir le symbole d'un token à partir de son adresse
const getTokenSymbolFromAddress = (address) => {
  const lowerCaseAddress = address.toLowerCase();
  
  if (lowerCaseAddress === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()) {
    return 'CAKE';
  } else if (lowerCaseAddress === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ||
             lowerCaseAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return 'BNB';
  } else if (lowerCaseAddress === PANCAKE_V3_CONTRACTS.BUSD.toLowerCase()) {
    return 'BUSD';
  } else if (lowerCaseAddress === PANCAKE_V3_CONTRACTS.ETH.toLowerCase()) {
    return 'ETH';
  } else {
    return 'UNKNOWN';
  }
};

// Fonction pour obtenir le prix d'un token via BSC Scan
const getBscScanTokenPrice = async (tokenAddress) => {
  try {
    // Définir une fonction de prix par défaut interne en cas d'erreur
    const getDefaultPrice = (symbol) => {
      switch (symbol) {
        case 'CAKE': return 2.17;
        case 'BNB': return 643;
        case 'BUSD': return 1;
        case 'ETH': return 3750;
        default: return 1;
      }
    };

    // Fonction interne pour obtenir le symbole à partir de l'adresse
    const getSymbolFromAddress = (addr) => {
      if (!addr) return 'UNKNOWN';
      
      const lowerCaseAddr = addr.toLowerCase();
      
      if (lowerCaseAddr === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase()) {
        return 'CAKE';
      } else if (lowerCaseAddr === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
        return 'BNB';
      } else if (lowerCaseAddr === PANCAKE_V3_CONTRACTS.BUSD.toLowerCase()) {
        return 'BUSD';
      } else if (lowerCaseAddr === PANCAKE_V3_CONTRACTS.ETH.toLowerCase()) {
        return 'ETH';
      } else {
        return 'UNKNOWN';
      }
    };

    // Vérifier si la clé API est disponible
    if (!BSC_SCAN_API_KEY) {
      console.warn("Clé API BSC Scan non trouvée. Utilisation des prix par défaut.");
      return getDefaultPrice(getSymbolFromAddress(tokenAddress));
    }

    // Si c'est BNB
    if (tokenAddress?.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      try {
        const response = await fetch(`https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${BSC_SCAN_API_KEY}`);
        const data = await response.json();
        
        if (data.status === '1') {
          console.log("Prix BNB depuis BSCScan:", data.result);
          return parseFloat(data.result.ethusd); // Prix du BNB en USD
        }
      } catch (apiError) {
        console.error("Erreur d'appel API BSCScan:", apiError);
      }
    }
    
    // Pour les autres tokens ou en cas d'échec de l'API
    return getDefaultPrice(getSymbolFromAddress(tokenAddress));
    
  } catch (error) {
    console.error("Erreur lors de la récupération du prix via BSCScan:", error);
    
    // En cas d'erreur complète, retourner des valeurs par défaut hardcodées
    const symbol = tokenAddress?.toLowerCase() === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase() ? 'CAKE' :
                  tokenAddress?.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ? 'BNB' :
                  tokenAddress?.toLowerCase() === PANCAKE_V3_CONTRACTS.BUSD.toLowerCase() ? 'BUSD' :
                  tokenAddress?.toLowerCase() === PANCAKE_V3_CONTRACTS.ETH.toLowerCase() ? 'ETH' : 'UNKNOWN';
    
    switch (symbol) {
      case 'CAKE': return 2.17;
      case 'BNB': return 643;
      case 'BUSD': return 1;
      case 'ETH': return 3750;
      default: return 1;
    }
  }
};

export function OneClickFarming() {
  // États pour gérer le workflow
  const [step, setStep] = useState(1);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [amount, setAmount] = useState('');
  const [processingStep, setProcessingStep] = useState(0); // 0: pas encore commencé, 1-4: étapes en cours
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPositionId, setNewPositionId] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletBalance, setWalletBalance] = useState({
    token0: '0',
    token1: '0'
  });

  // Liste prédéfinie des fermes les plus populaires
  const popularFarms = [
    { 
      id: 1, 
      pair: 'CAKE-BNB', 
      apr: '45.2%',
      risk: 'Modéré',
      description: 'Farm la plus populaire, bon équilibre entre rendement et risque',
      token0: {
        address: PANCAKE_V3_CONTRACTS.CAKE,
        symbol: 'CAKE',
        decimals: 18
      },
      token1: {
        address: PANCAKE_V3_CONTRACTS.WBNB,
        symbol: 'BNB',
        decimals: 18
      },
      fee: 2500, // 0.25% est le Fee qui correspond à la ferme existente sur pancakeSwap.finance/farms (poolId 0)
      // Définir des fourchettes de prix "sécurisées" pour cette paire
      priceRangeStrategy: {
        name: "Équilibré (±15%)",
        description: "Fourchette de prix optimisée pour cette paire",
        lowerPercent: -15,
        upperPercent: 15
      }
    },
    { 
      id: 2, 
      pair: 'CAKE-BUSD', 
      apr: '32.8%',
      risk: 'Faible',
      description: 'Idéal pour les débutants, exposition réduite à la volatilité',
      token0: {
        address: PANCAKE_V3_CONTRACTS.CAKE,
        symbol: 'CAKE',
        decimals: 18
      },
      token1: {
        address: PANCAKE_V3_CONTRACTS.BUSD,
        symbol: 'BUSD',
        decimals: 18
      },
      fee: 100, // 0.01%
      priceRangeStrategy: {
        name: "Conservateur (±5%)",
        description: "Fourchette étroite pour paires stables",
        lowerPercent: -5, 
        upperPercent: 5
      }
    },
    { 
      id: 3, 
      pair: 'ETH-BNB', 
      apr: '28.5%',
      risk: 'Moyen',
      description: 'Paire de grandes capitalisations avec liquidité élevée',
      token0: {
        address: PANCAKE_V3_CONTRACTS.ETH, // Assurez-vous d'avoir cette adresse dans votre config
        symbol: 'ETH',
        decimals: 18
      },
      token1: {
        address: PANCAKE_V3_CONTRACTS.WBNB,
        symbol: 'BNB',
        decimals: 18
      },
      fee: 500, // 0.05%
      priceRangeStrategy: {
        name: "Standard (±10%)",
        description: "Équilibre entre rendement et sécurité",
        lowerPercent: -10,
        upperPercent: 10
      }
    }
  ];

  // Vérifier la connexion du wallet et récupérer les soldes
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            setWalletConnected(true);
            
            // Si un farm est sélectionné, récupérer les soldes des tokens
            if (selectedFarm) {
              await fetchTokenBalances(selectedFarm);
            }
          } else {
            setWalletConnected(false);
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du wallet:", error);
          setWalletConnected(false);
        }
      } else {
        setWalletConnected(false);
      }
    };

    checkWalletConnection();
  }, [selectedFarm]);

  // Fonction pour récupérer les soldes des tokens
  const fetchTokenBalances = async (farm) => {
  if (!window.ethereum) return;
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log("Récupération des soldes pour l'adresse:", userAddress);
    
    // Variables pour stocker les soldes
    let token0Balance = 0n;
    let token1Balance = 0n;
    
    // Récupérer le solde du token0
    if (farm.token0.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      // Pour BNB (qui est un token natif), utiliser getBalance
      try {
        token0Balance = await provider.getBalance(userAddress);
        console.log("Solde BNB natif récupéré:", ethers.formatEther(token0Balance));
      } catch (error) {
        console.error("Erreur lors de la récupération du solde BNB natif:", error);
        // Si échec du BNB natif, essayer WBNB
        try {
          const wbnbContract = new ethers.Contract(
            PANCAKE_V3_CONTRACTS.WBNB,
            ERC20_ABI,
            provider
          );
          token0Balance = await wbnbContract.balanceOf(userAddress);
          console.log("Solde WBNB récupéré:", ethers.formatEther(token0Balance));
        } catch (wbnbError) {
          console.error("Erreur lors de la récupération du solde WBNB:", wbnbError);
        }
      }
    } else {
      // Pour les autres tokens, utiliser balanceOf
      try {
        const token0Contract = new ethers.Contract(
          farm.token0.address,
          ERC20_ABI,
          provider
        );
        token0Balance = await token0Contract.balanceOf(userAddress);
        console.log(`Solde ${farm.token0.symbol} récupéré:`, 
          ethers.formatUnits(token0Balance, farm.token0.decimals)
        );
      } catch (error) {
        console.error(`Erreur lors de la récupération du solde ${farm.token0.symbol}:`, error);
      }
    }
    
    // Récupérer le solde du token1
    if (farm.token1.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      // Pour BNB (qui est un token natif), utiliser getBalance
      try {
        token1Balance = await provider.getBalance(userAddress);
        console.log("Solde BNB natif récupéré:", ethers.formatEther(token1Balance));
      } catch (error) {
        console.error("Erreur lors de la récupération du solde BNB natif:", error);
        // Si échec du BNB natif, essayer WBNB
        try {
          const wbnbContract = new ethers.Contract(
            PANCAKE_V3_CONTRACTS.WBNB,
            ERC20_ABI,
            provider
          );
          token1Balance = await wbnbContract.balanceOf(userAddress);
          console.log("Solde WBNB récupéré:", ethers.formatEther(token1Balance));
        } catch (wbnbError) {
          console.error("Erreur lors de la récupération du solde WBNB:", wbnbError);
        }
      }
    } else {
      // Pour les autres tokens, utiliser balanceOf
      try {
        const token1Contract = new ethers.Contract(
          farm.token1.address,
          ERC20_ABI,
          provider
        );
        token1Balance = await token1Contract.balanceOf(userAddress);
        console.log(`Solde ${farm.token1.symbol} récupéré:`, 
          ethers.formatUnits(token1Balance, farm.token1.decimals)
        );
      } catch (error) {
        console.error(`Erreur lors de la récupération du solde ${farm.token1.symbol}:`, error);
      }
    }
    
    // Mettre à jour l'état avec les soldes formatés
    setWalletBalance({
      token0: ethers.formatUnits(token0Balance, farm.token0.decimals),
      token1: ethers.formatUnits(token1Balance, farm.token1.decimals)
    });
    
    console.log("Soldes mis à jour:", {
      [farm.token0.symbol]: ethers.formatUnits(token0Balance, farm.token0.decimals),
      [farm.token1.symbol]: ethers.formatUnits(token1Balance, farm.token1.decimals)
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes:", error);
    toast.error("Impossible de récupérer vos soldes");
  }
};

  // Fonction pour connecter le wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Veuillez installer MetaMask pour utiliser cette fonctionnalité");
      return;
    }
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletConnected(true);
      
      if (selectedFarm) {
        await fetchTokenBalances(selectedFarm);
      }
      
      toast.success("Wallet connecté avec succès");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Échec de la connexion du wallet");
    }
  };

  const getTokenPrice = (symbol) => {
  switch (symbol) {
    case 'CAKE': return 2.17; // CAKE à $2.17 (prix actuel)
    case 'BNB': return 643; // BNB à $643 (prix actuel)
    case 'BUSD': return 1; // BUSD reste à $1 par définition
    case 'ETH': return 3750; // Mise à jour du prix ETH pour être cohérent
    default: return 1;
  }
};

  // Calculer le prix actuel entre deux tokens
  const getCurrentPrice = async (farm) => {
  if (!window.ethereum) return 0;
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Au lieu d'utiliser le Router pour le prix, utilisons une approche alternative
    // 1. Option: Utiliser le contrat de pool directement pour obtenir le slot0
    try {
      // Obtenir l'adresse du pool
      const factory = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.FACTORY, // Assurez-vous que cette adresse est correcte
        ["function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"],
        provider
      );
      
      // Obtenir l'adresse du pool
      const poolAddress = await factory.getPool(
        farm.token0.address,
        farm.token1.address,
        farm.fee
      );
      
      if (poolAddress && poolAddress !== ethers.ZeroAddress) {
        // Utiliser l'ABI minimal du pool
        const poolABI = [
          "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
        ];
        
        const pool = new ethers.Contract(poolAddress, poolABI, provider);
        const slot0 = await pool.slot0();
        
        // Calculer le prix à partir de sqrtPriceX96
        const sqrtPriceX96 = slot0.sqrtPriceX96;
        const price = Number(sqrtPriceX96) * Number(sqrtPriceX96) * (10**farm.token1.decimals) / ((2**192) * (10**farm.token0.decimals));
        
        console.log(`Prix obtenu depuis le pool: ${price}`);
        return price;
      }
    } catch (poolError) {
      console.log("Erreur lors de l'accès au pool:", poolError);
    }
    
    // 2. Option de secours: Utiliser des prix hardcodés pour le développement
    // Cette approche est utile pour le développement si nous ne pouvons pas obtenir les prix en direct
    if (farm.token0.symbol === 'CAKE' && farm.token1.symbol === 'BNB') {
      const cakePriceInBNB = 0.015; // 1 CAKE ≈ 0.015 BNB
      console.log(`Utilisation du prix hardcodé CAKE-BNB: ${cakePriceInBNB}`);
      return cakePriceInBNB;
    } else if (farm.token0.symbol === 'CAKE' && farm.token1.symbol === 'BUSD') {
      const cakePriceInBUSD = 5.2; // 1 CAKE ≈ 5.2 BUSD
      console.log(`Utilisation du prix hardcodé CAKE-BUSD: ${cakePriceInBUSD}`);
      return cakePriceInBUSD;
    } else if (farm.token0.symbol === 'ETH' && farm.token1.symbol === 'BNB') {
      const ethPriceInBNB = 8.3; // 1 ETH ≈ 8.3 BNB
      console.log(`Utilisation du prix hardcodé ETH-BNB: ${ethPriceInBNB}`);
      return ethPriceInBNB;
    }
    
    // 3. Option: Si aucune des méthodes ci-dessus ne fonctionne, utiliser un prix par défaut
    const defaultPrice = 1.0; // Prix par défaut générique
    console.warn("Utilisation d'un prix par défaut:", defaultPrice);
    return defaultPrice;
  } catch (error) {
    console.error("Erreur lors de la récupération du prix:", error);
    // Renvoyer un prix par défaut si tout échoue
    return 1.0;
  }
};

  // Calculer les tick bounds basés sur le prix actuel et la stratégie
const calculateTickBounds = async (farm) => {
  try {
    const currentPrice = await getCurrentPrice(farm);
    
    if (currentPrice <= 0) {
      console.error("Prix actuel invalide:", currentPrice);
      toast.error("Impossible de déterminer le prix actuel");
      return null;
    }
    
    console.log(`Prix actuel pour ${farm.pair}: ${currentPrice}`);
    
    const { lowerPercent, upperPercent } = farm.priceRangeStrategy;
    
    // Calculer les bornes de prix
    const lowerPrice = currentPrice * (1 + lowerPercent / 100);
    const upperPrice = currentPrice * (1 + upperPercent / 100);
    
    console.log(`Fourchette de prix: ${lowerPrice} à ${upperPrice}`);
    
    // CORRECTION: Obtenir le bon tick spacing
    const tickSpacing = getTickSpacing(farm.fee);
    console.log(`Tick spacing pour fee ${farm.fee}: ${tickSpacing}`);
    
    // CORRECTION: Calcul correct des ticks
    const rawLowerTick = Math.log(lowerPrice) / Math.log(1.0001);
    const rawUpperTick = Math.log(upperPrice) / Math.log(1.0001);
    
    console.log(`Ticks bruts calculés: ${rawLowerTick} à ${rawUpperTick}`);
    
    // CORRECTION: Aligner sur le tick spacing
    const lowerTick = Math.floor(rawLowerTick / tickSpacing) * tickSpacing;
    const upperTick = Math.ceil(rawUpperTick / tickSpacing) * tickSpacing;
    
    console.log(`Ticks alignés calculés: ${lowerTick} à ${upperTick}`);
    
    // CORRECTION: Vérifications supplémentaires de validité
    const isValidTick = (tick) => {
      // Vérifier que le tick est dans les limites de Uniswap V3
      const MIN_TICK = -887272;
      const MAX_TICK = 887272;
      
      return (
        !isNaN(tick) && 
        tick >= MIN_TICK && 
        tick <= MAX_TICK && 
        tick % tickSpacing === 0
      );
    };
    
    // Vérifier que les ticks sont valides
    if (!isValidTick(lowerTick) || !isValidTick(upperTick) || lowerTick >= upperTick) {
      console.warn("Ticks calculés invalides, utilisation de ticks par défaut");
      
      // Utiliser des ticks par défaut si le calcul échoue
      const defaultTicks = getDefaultTicks(farm);
      
      // CORRECTION: Vérifier aussi que les ticks par défaut sont valides
      const validDefaultLowerTick = Math.floor(defaultTicks.lowerTick / tickSpacing) * tickSpacing;
      const validDefaultUpperTick = Math.ceil(defaultTicks.upperTick / tickSpacing) * tickSpacing;
      
      console.log(`Utilisation de ticks par défaut corrigés: ${validDefaultLowerTick} à ${validDefaultUpperTick}`);
      
      return {
        lowerTick: validDefaultLowerTick,
        upperTick: validDefaultUpperTick,
        currentPrice
      };
    }
    
    // CORRECTION: Vérification finale de l'écart minimum
    const tickDifference = upperTick - lowerTick;
    const minimumTickDifference = tickSpacing * 2; // Au minimum 2 espacements
    
    if (tickDifference < minimumTickDifference) {
      console.warn(`Écart de ticks trop petit (${tickDifference}), ajustement à ${minimumTickDifference}`);
      
      // Élargir la fourchette
      const centerTick = Math.floor((lowerTick + upperTick) / 2 / tickSpacing) * tickSpacing;
      const adjustedLowerTick = centerTick - tickSpacing;
      const adjustedUpperTick = centerTick + tickSpacing;
      
      console.log(`Ticks ajustés: ${adjustedLowerTick} à ${adjustedUpperTick}`);
      
      return {
        lowerTick: adjustedLowerTick,
        upperTick: adjustedUpperTick,
        currentPrice
      };
    }
    
    console.log(`✅ Ticks finaux validés: ${lowerTick} à ${upperTick}`);
    
    return {
      lowerTick,
      upperTick,
      currentPrice
    };
    
  } catch (error) {
    console.error("Erreur lors du calcul des ticks:", error);
    
    // Utiliser des ticks par défaut en cas d'erreur
    const defaultTicks = getDefaultTicks(farm);
    const tickSpacing = getTickSpacing(farm.fee);
    
    // CORRECTION: Assurer que même les ticks par défaut sont alignés
    const safeDefaultLowerTick = Math.floor(defaultTicks.lowerTick / tickSpacing) * tickSpacing;
    const safeDefaultUpperTick = Math.ceil(defaultTicks.upperTick / tickSpacing) * tickSpacing;
    
    console.log(`Utilisation de ticks par défaut sécurisés après erreur: ${safeDefaultLowerTick} à ${safeDefaultUpperTick}`);
    
    return {
      lowerTick: safeDefaultLowerTick,
      upperTick: safeDefaultUpperTick,
      currentPrice: 1.0 // Prix par défaut
    };
  }
};

// Fonction helper pour obtenir des ticks par défaut selon la paire
const getDefaultTicks = (farm) => {
  // Ticks par défaut pré-calculés pour les paires courantes
  // Ces valeurs sont calculées à partir de fourchettes de prix typiques
  if (farm.token0.symbol === 'CAKE' && farm.token1.symbol === 'BNB') {
    return {
      lowerTick: -41000,  // Fourchette typique pour CAKE-BNB
      upperTick: -35000
    };
  } else if (farm.token0.symbol === 'CAKE' && farm.token1.symbol === 'BUSD') {
    return {
      lowerTick: 73000,   // Fourchette typique pour CAKE-BUSD
      upperTick: 78000
    };
  } else if (farm.token0.symbol === 'ETH' && farm.token1.symbol === 'BNB') {
    return {
      lowerTick: 23000,   // Fourchette typique pour ETH-BNB
      upperTick: 28000
    };
  } else {
    // Fourchette générique par défaut
    return {
      lowerTick: -10000,
      upperTick: 10000
    };
  }
};

  // Obtenir le tick spacing en fonction des frais
 const getTickSpacing = (fee) => {
  switch (fee) {
    case 100: return 1;     // 0.01%
    case 500: return 10;    // 0.05%
    case 2500: return 50;   // 0.25% ← CORRECTION ICI
    case 3000: return 60;   // 0.3%
    case 10000: return 200; // 1%
    default: 
      console.warn(`Fee inconnu: ${fee}, utilisation du spacing par défaut`);
      return 10;
  }
};

  // Calculer les montants de tokens basés sur le montant USD et le prix actuel
  const calculateTokenAmounts = (amountUSD, currentPrice, farm) => {
  const token0PriceUSD = getTokenPrice(farm.token0.symbol);
  const token1PriceUSD = getTokenPrice(farm.token1.symbol);
  
  // Répartition 50/50 en valeur USD
  const usdPerSide = amountUSD / 2;
  
  let amount0 = usdPerSide / token0PriceUSD;
  let amount1 = usdPerSide / token1PriceUSD;
  
  // Ajuster selon le prix du pool pour éviter l'erreur de slippage
  const poolRatio = currentPrice; // CAKE/BNB du pool
  const ourRatio = amount0 / amount1; // Notre ratio calculé
  
  if (Math.abs(poolRatio - ourRatio) / poolRatio > 0.1) { // Plus de 10% d'écart
    // Réajuster selon le pool
    const totalBNBEquivalent = amount0 * poolRatio + amount1;
    amount1 = totalBNBEquivalent / 2;
    amount0 = amount1 / poolRatio;
  }
  
  return {
    amount0: amount0.toString(),
    amount1: amount1.toString()
  };
};

// Calculer le montant maximal d'investissement basé sur les soldes actuels
const calculateMaxInvestment = async () => {
  if (!selectedFarm || !window.ethereum) return 0;
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Récupérer les soldes
    let balance0, balance1;
    
    // Récupérer le solde du token0
    if (selectedFarm.token0.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      balance0 = await provider.getBalance(userAddress);
    } else {
      const token0Contract = new ethers.Contract(
        selectedFarm.token0.address,
        ERC20_ABI,
        provider
      );
      balance0 = await token0Contract.balanceOf(userAddress);
    }
    
    // Récupérer le solde du token1
    if (selectedFarm.token1.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      balance1 = await provider.getBalance(userAddress);
    } else {
      const token1Contract = new ethers.Contract(
        selectedFarm.token1.address,
        ERC20_ABI,
        provider
      );
      balance1 = await token1Contract.balanceOf(userAddress);
    }
    
    // Convertir en nombres décimaux
    const balance0Decimal = parseFloat(ethers.formatUnits(balance0, selectedFarm.token0.decimals));
    const balance1Decimal = parseFloat(ethers.formatUnits(balance1, selectedFarm.token1.decimals));
    
    // Obtenir les prix depuis BSC Scan
    const token0PriceUSD = await getBscScanTokenPrice(selectedFarm.token0.address);
    const token1PriceUSD = await getBscScanTokenPrice(selectedFarm.token1.address);
    
    // Calculer la valeur en USD de chaque solde
    const balance0USD = balance0Decimal * token0PriceUSD;
    const balance1USD = balance1Decimal * token1PriceUSD;
    
    // Afficher les informations pour le débogage
    console.log(`Prix BSC Scan: 1 ${selectedFarm.token0.symbol} = $${token0PriceUSD}, 1 ${selectedFarm.token1.symbol} = $${token1PriceUSD}`);
    console.log(`Soldes: ${balance0Decimal} ${selectedFarm.token0.symbol} ($${balance0USD}), ${balance1Decimal} ${selectedFarm.token1.symbol} ($${balance1USD})`);
    
    // Déterminer le montant maximal possible (en tenant compte de la répartition 50/50)
    const maxBasedOnToken0 = balance0USD * 2;
    const maxBasedOnToken1 = balance1USD * 2;
    
    // Prendre le minimum des deux et appliquer une marge de sécurité de 95%
    const maxAmount = Math.min(maxBasedOnToken0, maxBasedOnToken1) * 0.95;
    
    console.log(`Montant max calculé: $${maxAmount} (Basé sur ${maxBasedOnToken0 < maxBasedOnToken1 ? selectedFarm.token0.symbol : selectedFarm.token1.symbol})`);
    
    return maxAmount;
  } catch (error) {
    console.error("Erreur lors du calcul du montant max:", error);
    return 0;
  }
};

// Fonction pour ajuster automatiquement le montant
const handleAutoAdjustAmount = async () => {
  if (!selectedFarm) return;
  
  showToast("Calcul du montant maximal possible...", 'info');
  
  // Calculer le montant maximal possible
  const maxAmount = await calculateMaxInvestment();
  
  if (maxAmount <= 0) {
    toast.error("Impossible de calculer un montant valide avec vos soldes actuels");
    return;
  }
  
  // Arrondir à 2 décimales
  const adjustedAmount = Math.floor(maxAmount * 100) / 100;
  
  // Mettre à jour le montant
  setAmount(adjustedAmount.toString());
  
  showToast(`Montant ajusté automatiquement à ${adjustedAmount} USD en fonction de vos soldes`, 'info');
};

  // Le workflow complet pour créer une position et la staker
  const completeWorkflow = async () => {
  if (!walletConnected) {
    toast.error("Veuillez connecter votre wallet");
    return;
  }
  
  if (!selectedFarm || !amount || parseFloat(amount) <= 0) {
    toast.error("Veuillez sélectionner une ferme et entrer un montant valide");
    return;
  }
  
  setIsProcessing(true);
  setProcessingStep(1);
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Étape 1: Calculer les paramètres optimaux pour la position
    console.log("Calcul des paramètres optimaux pour", selectedFarm.pair);
    let tickInfo = await calculateTickBounds(selectedFarm);
    
    if (!tickInfo) {
      toast.error("Impossible de calculer les fourchettes de prix optimales. Utilisation de valeurs par défaut.");
      // Ne pas abandonner, utiliser des valeurs par défaut
      const defaultTicks = getDefaultTicks(selectedFarm);
      tickInfo = {
        lowerTick: defaultTicks.lowerTick,
        upperTick: defaultTicks.upperTick,
        currentPrice: 1.0 // Prix par défaut
      };
    }
    
    setProcessingStep(2);
    
    // Calculer les montants de tokens nécessaires
    const tokenAmounts = await calculateTokenAmounts(
      parseFloat(amount), 
      tickInfo.currentPrice, 
      selectedFarm
    );

    console.log("Montants calculés:", 
      `${tokenAmounts.amount0} ${selectedFarm.token0.symbol}`, 
      `${tokenAmounts.amount1} ${selectedFarm.token1.symbol}`
    );
    
    // Vérifier les soldes disponibles avant de convertir en unités Wei
    let balance0, balance1;

    // Récupérer le solde du token0
    if (selectedFarm.token0.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      balance0 = await provider.getBalance(userAddress);
    } else {
      const token0Contract = new ethers.Contract(
        selectedFarm.token0.address,
        ERC20_ABI,
        provider
      );
      balance0 = await token0Contract.balanceOf(userAddress);
    }

    // Récupérer le solde du token1
    if (selectedFarm.token1.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      balance1 = await provider.getBalance(userAddress);
    } else {
      const token1Contract = new ethers.Contract(
        selectedFarm.token1.address,
        ERC20_ABI,
        provider
      );
      balance1 = await token1Contract.balanceOf(userAddress);
    }

    // Convertir en nombres décimaux pour la comparaison
    const balance0Decimal = parseFloat(ethers.formatUnits(balance0, selectedFarm.token0.decimals));
    const balance1Decimal = parseFloat(ethers.formatUnits(balance1, selectedFarm.token1.decimals));
    const amount0Decimal = parseFloat(tokenAmounts.amount0);
    const amount1Decimal = parseFloat(tokenAmounts.amount1);

    console.log("Soldes actuels:", 
      `${balance0Decimal} ${selectedFarm.token0.symbol}`,
      `${balance1Decimal} ${selectedFarm.token1.symbol}`
    );

    // Vérifier si les soldes sont suffisants
    if (balance0Decimal < amount0Decimal) {
      const deficit = amount0Decimal - balance0Decimal;
      toast.error(`Solde insuffisant de ${selectedFarm.token0.symbol}. Manque ${deficit.toFixed(4)} ${selectedFarm.token0.symbol}`);
      setIsProcessing(false);
      return;
    }

    if (balance1Decimal < amount1Decimal) {
      const deficit = amount1Decimal - balance1Decimal;
      toast.error(`Solde insuffisant de ${selectedFarm.token1.symbol}. Manque ${deficit.toFixed(4)} ${selectedFarm.token1.symbol}`);
      setIsProcessing(false);
      return;
    }

    // Maintenant que nous avons vérifié les soldes, convertir en unités Wei
    const amount0Desired = ethers.parseUnits(
      tokenAmounts.amount0, 
      selectedFarm.token0.decimals
    );

    const amount1Desired = ethers.parseUnits(
      tokenAmounts.amount1, 
      selectedFarm.token1.decimals
    );
    
    // Créer les instances de contrat pour les tokens
    const token0Contract = new ethers.Contract(
      selectedFarm.token0.address,
      ERC20_ABI,
      signer
    );
    
    const token1Contract = new ethers.Contract(
      selectedFarm.token1.address,
      ERC20_ABI,
      signer
    );
    
    // Approuver le Position Manager pour token0
    console.log("Vérification des approbations...");
    
    // Vérifier si le token0 est BNB (pas besoin d'approbation pour BNB natif)
    if (selectedFarm.token0.address.toLowerCase() !== PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      const allowance0 = await token0Contract.allowance(
        userAddress, 
        PANCAKE_V3_CONTRACTS.POSITION_MANAGER
      );
      
      if (allowance0 < amount0Desired) {
        console.log(`Approbation nécessaire pour ${selectedFarm.token0.symbol}`);
        showToast(`Approbation pour ${selectedFarm.token0.symbol} en cours...`, 'info');
        
        try {
          const approveTx0 = await token0Contract.approve(
            PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
            ethers.MaxUint256
          );
          await approveTx0.wait();
          toast.success(`Approbation pour ${selectedFarm.token0.symbol} effectuée`);
        } catch (approveError) {
          console.error("Erreur d'approbation token0:", approveError);
          toast.error(`Erreur lors de l'approbation de ${selectedFarm.token0.symbol}`);
          setIsProcessing(false);
          return;
        }
      }
    }
    
    // Vérifier si le token1 est BNB (pas besoin d'approbation pour BNB natif)
    if (selectedFarm.token1.address.toLowerCase() !== PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
      const allowance1 = await token1Contract.allowance(
        userAddress, 
        PANCAKE_V3_CONTRACTS.POSITION_MANAGER
      );
      
      if (allowance1 < amount1Desired) {
        console.log(`Approbation nécessaire pour ${selectedFarm.token1.symbol}`);
        showToast(`Approbation pour ${selectedFarm.token1.symbol} en cours...`, 'info');
        
        try {
          const approveTx1 = await token1Contract.approve(
            PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
            ethers.MaxUint256
          );
          await approveTx1.wait();
          toast.success(`Approbation pour ${selectedFarm.token1.symbol} effectuée`);
        } catch (approveError) {
          console.error("Erreur d'approbation token1:", approveError);
          toast.error(`Erreur lors de l'approbation de ${selectedFarm.token1.symbol}`);
          setIsProcessing(false);
          return;
        }
      }
    }
    
    setProcessingStep(3);
    
    // Étape 3: Créer la position NFT
console.log("Création de la position NFT...");
showToast("Création de la position NFT en cours...", 'info');

// Log de l'ABI pour débogage
console.log("ABI du positionManager:", POSITION_MANAGER_ABI);

const positionManager = new ethers.Contract(
  PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
  POSITION_MANAGER_ABI,
  signer
);

// Log des méthodes disponibles pour débogage
console.log("Méthodes disponibles dans positionManager:", 
  Object.keys(positionManager)
    .filter(key => typeof positionManager[key] === 'function')
    .join(", ")
);

// Gestion spéciale si l'un des tokens est BNB natif
let txOptions = {};
let txValue = 0n;

// Si token0 est BNB
if (selectedFarm.token0.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
  txValue = amount0Desired;
  console.log("Utilisation de BNB natif comme token0, valeur:", ethers.formatEther(txValue));
}

// Si token1 est BNB
if (selectedFarm.token1.address.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase()) {
  txValue = amount1Desired;
  console.log("Utilisation de BNB natif comme token1, valeur:", ethers.formatEther(txValue));
}

// Si on utilise du BNB natif, il faut passer la valeur dans les options de transaction
if (txValue > 0n) {
  txOptions = { value: txValue };
}

// Créer la position
let receipt;
let tokenId;
try {
  // Rafraîchir les prix juste avant de soumettre la transaction
  console.log("Rafraîchissement des prix avant la transaction...");
  const currentTickInfo = await calculateTickBounds(selectedFarm);
  
  if (!currentTickInfo) {
    toast.error("Impossible de calculer les fourchettes de prix actuelles.");
    setIsProcessing(false);
    return;
  }
  
  console.log("Nouveaux ticks calculés:", currentTickInfo.lowerTick, currentTickInfo.upperTick);
  console.log("Anciens ticks:", tickInfo.lowerTick, tickInfo.upperTick);
  
  const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes
  
  // Augmenter le slippage à 50%
  const amount0Min = amount0Desired * 5n / 10n; // 50% de slippage
  const amount1Min = amount1Desired * 5n / 10n; // 50% de slippage
  
  // Définir les paramètres de création de position avec les ticks les plus récents
  const mintParams = {
    token0: selectedFarm.token0.address,
    token1: selectedFarm.token1.address,
    fee: selectedFarm.fee,
    tickLower: currentTickInfo.lowerTick,
    tickUpper: currentTickInfo.upperTick,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: amount0Min,
    amount1Min: amount1Min,
    recipient: userAddress,
    deadline: deadline
  };
  
  console.log("Paramètres de mint mis à jour:", mintParams);
  console.log("Options de transaction:", txOptions);
  
  // Exécuter la transaction
  let tx;
  try {
    if (txValue > 0n) {
      tx = await positionManager.mint(mintParams, txOptions);
    } else {
      tx = await positionManager.mint(mintParams);
    }
    
    showToast("Transaction envoyée, en attente de confirmation...", 'info');
    receipt = await tx.wait();
    toast.success("Position créée avec succès!");
  } catch (mintCallError) {
    console.error("Erreur lors de l'appel à mint:", mintCallError);
    
    // Si l'erreur concerne le slippage, essayer avec un slippage encore plus élevé
    if (mintCallError.message.includes("Price slippage check")) {
      toast.warning("Tentative avec un slippage plus élevé (30%)...");
      
      // Augmenter le slippage à 30%
      const amount0Min = amount0Desired * 7n / 10n; // 30% de slippage
      const amount1Min = amount1Desired * 7n / 10n; // 30% de slippage
      
      mintParams.amount0Min = amount0Min;
      mintParams.amount1Min = amount1Min;
      
      console.log("Nouveaux paramètres avec slippage 30%:", mintParams);
      
      if (txValue > 0n) {
        tx = await positionManager.mint(mintParams, txOptions);
      } else {
        tx = await positionManager.mint(mintParams);
      }
      
      showToast("Transaction envoyée, en attente de confirmation...", 'info');
      receipt = await tx.wait();
      toast.success("Position créée avec succès (slippage élevé)!");
    } else {
      // Rethrow si ce n'est pas une erreur de slippage
      throw mintCallError;
    }
  }
  
  // Trouver l'ID de la position créée depuis les logs
  try {
    const events = receipt.logs.filter(
      log => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
    );
    
    if (events.length > 0) {
      // Utiliser BigInt pour analyser le nombre hexadécimal
      tokenId = BigInt(events[0].topics[3]).toString();
      setNewPositionId(tokenId);
      console.log("Position créée avec ID:", tokenId);
      
      // Vérifier que la position a bien été créée
      try {
        console.log("Vérification de la position créée...");
        const positionInfo = await positionManager.positions(tokenId);
        console.log("Détails de la position créée:", {
          token0: positionInfo.token0,
          token1: positionInfo.token1,
          fee: positionInfo.fee,
          tickLower: positionInfo.tickLower,
          tickUpper: positionInfo.tickUpper,
          liquidity: positionInfo.liquidity.toString()
        });
        
        // Vérifier si la position a bien de la liquidité
        if (positionInfo.liquidity > 0) {
          console.log("Position créée avec succès, liquidity:", positionInfo.liquidity.toString());
        } else {
          console.warn("Position créée mais sans liquidité!");
          toast.warning("Position créée mais sans liquidité. Le staking pourrait échouer.");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la position:", error);
      }
    } else {
      throw new Error("ID de position introuvable dans les logs");
    }
  } catch (parseError) {
    console.error("Erreur lors de l'analyse de l'ID de position:", parseError);
    toast.error("Position créée mais ID non trouvé");
    // Continuer le workflow sans l'ID de position
    setProcessingStep(5);
    setStep(3);
    setIsProcessing(false);
    return;
  }
  
} catch (mintError) {
  console.error("Erreur lors de la création de la position:", mintError);
  
  // Message d'erreur plus convivial pour l'erreur de slippage
  if (mintError.message.includes("Price slippage check")) {
    toast.error("Le prix a changé trop rapidement. Essayez d'augmenter la tolérance de slippage ou réessayez plus tard.");
  } else {
    toast.error("Erreur lors de la création de la position: " + mintError.message);
  }
  
  setIsProcessing(false);
  return;
}

// Étape 4: Staker la position dans le MasterChef V3
if (tokenId) {
  setProcessingStep(4);
  console.log("Staking de la position dans MasterChef V3...");
  showToast("Staking de la position en cours...", 'info');
  
  try {
    // Approuver le MasterChef pour utiliser la position NFT
    console.log("Approbation de la position pour MasterChef V3...");
    const approveTx = await positionManager.approve(
      PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
      tokenId
    );
    await approveTx.wait();
    console.log("Approbation réussie");
    
    // Staker la position
    console.log("Staking de la position...");
    const masterChefV3 = new ethers.Contract(
      PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
      MASTERCHEF_V3_ABI,
      signer
    );
    
    const stakeTx = await masterChefV3.deposit(tokenId);
    showToast("Transaction de staking envoyée, en attente de confirmation...", 'info');
    await stakeTx.wait();
    
    toast.success("Position stakée avec succès!");
    console.log("Staking réussi pour la position", tokenId);
  } catch (stakeError) {
    console.error("Erreur lors du staking:", stakeError);
    toast.error("Erreur lors du staking. Votre position a été créée mais n'a pas été stakée.");
    // Continuer le workflow même si le staking a échoué
  }
}

// Workflow terminé
setProcessingStep(5);
setStep(3); // Passer à l'étape de confirmation
    
  } catch (error) {
    console.error("Erreur du workflow:", error);
    toast.error("Erreur: " + (error.message || "Une erreur s'est produite"));
  } finally {
    setIsProcessing(false);
  }
};

  // Formater le nombre avec 2 décimales
  const formatNumber = (num) => {
    return parseFloat(num).toFixed(2);
  };

  // Annuler et réinitialiser
  const resetWorkflow = () => {
    setStep(1);
    setSelectedFarm(null);
    setAmount('');
    setProcessingStep(0);
    setNewPositionId(null);
  };

  // Fonctions utilitaires pour l'interface
  const getRiskColorClass = (risk) => {
    switch (risk) {
      case 'Faible': return 'bg-green-100 text-green-800';
      case 'Modéré': return 'bg-yellow-100 text-yellow-800';
      case 'Élevé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStepText = () => {
    switch (processingStep) {
      case 1: return "Calcul des paramètres optimaux...";
      case 2: return "Vérification et approbation des tokens...";
      case 3: return "Création de la position V3...";
      case 4: return "Staking de la position dans MasterChef V3...";
      case 5: return "Opération terminée avec succès!";
      default: return "Préparation...";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Farming Simplifié en 1-Clic</h2>
      
      {/* Étape 1: Sélection de la stratégie de farming */}
      {step === 1 && (
        <>
          <h3 className="font-medium mb-4 text-lg">Étape 1: Choisissez une stratégie de farming</h3>
          <p className="text-gray-600 mb-6">
            Sélectionnez l'une de nos stratégies optimisées pour commencer à farmer sans complexité.
          </p>
          
          <div className="grid gap-4 mb-4">
            {popularFarms.map(farm => (
              <div 
                key={farm.id}
                onClick={() => {
                  setSelectedFarm(farm);
                  setStep(2);
                  fetchTokenBalances(farm);
                }}
                className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-lg">{farm.pair}</h4>
                  <span className="text-green-600 font-medium">{farm.apr} APR</span>
                </div>
                <p className="text-gray-600 mb-2">{farm.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded ${getRiskColorClass(farm.risk)}`}>
                    Risque: {farm.risk}
                  </span>
                  <div className="text-sm text-gray-500">
                    Frais: {farm.fee / 10000}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800">Farming V3 simplifié</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Notre système crée automatiquement une position V3 optimisée avec des fourchettes 
                  de prix adaptées et la stake pour vous en quelques clics, sans que vous ayez à 
                  vous soucier des détails techniques.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Étape 2: Montant à investir */}
      {step === 2 && selectedFarm && (
        <>
          <button 
            onClick={() => setStep(1)} 
            className="text-blue-600 mb-4 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </button>
          
          <h3 className="font-medium mb-4 text-lg">
            Étape 2: Investissement dans {selectedFarm.pair}
          </h3>
          
          {!walletConnected ? (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-100">
              <p className="text-yellow-700 mb-3">
                Vous devez connecter votre wallet pour continuer.
              </p>
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Connecter le wallet
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <h4 className="font-medium mb-2">Votre solde:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{selectedFarm.token0.symbol}</p>
                    <p className="font-medium">{formatNumber(walletBalance.token0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{selectedFarm.token1.symbol}</p>
                    <p className="font-medium">{formatNumber(walletBalance.token1)}</p>
                  </div>
                </div>
              </div>
              
              {/* Champ de saisie du montant avec bouton d'ajustement automatique */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à investir (USD)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="Ex: 100"
                  />
                  <button
                    onClick={handleAutoAdjustAmount}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 whitespace-nowrap"
                  >
                    Montant max
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Votre investissement sera réparti optimalement entre les deux tokens
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <h4 className="font-medium mb-2 text-blue-800">Stratégie: {selectedFarm.priceRangeStrategy.name}</h4>
                <p className="text-sm text-blue-700 mb-2">
                  {selectedFarm.priceRangeStrategy.description}
                </p>
                <p className="text-sm text-blue-700">
                  Fourchette: {selectedFarm.priceRangeStrategy.lowerPercent}% à +{selectedFarm.priceRangeStrategy.upperPercent}% du prix actuel
                </p>
              </div>
            </>
          )}
          
          <button
            onClick={completeWorkflow}
            disabled={!walletConnected || !amount || parseFloat(amount) <= 0 || isProcessing}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                {getProcessingStepText()}
              </span>
            ) : (
              "Lancer le Farming en Un Clic"
            )}
          </button>
        </>
      )}
      
      {/* Étape 3: Confirmation */}
      {step === 3 && (
        <div className="text-center py-6">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="font-medium text-xl mb-2">Farming lancé avec succès!</h3>
          <p className="text-gray-600 mb-6">
            Votre position #{newPositionId} a été créée et stakée automatiquement.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100 text-left">
            <h4 className="font-medium text-green-800 mb-2">Récapitulatif:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>Farm: {selectedFarm?.pair}</li>
              <li>Stratégie: {selectedFarm?.priceRangeStrategy?.name}</li>
              <li>Investissement: {amount} USD</li>
              <li>APR estimé: {selectedFarm?.apr}</li>
            </ul>
          </div>

          <div className="flex space-x-4 justify-center">
  <button
    onClick={resetWorkflow}
    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
  >
    Créer une nouvelle position
  </button>
  {newPositionId && (
    <a 
      href={`https://pancakeswap.finance/liquidity/${newPositionId}`}
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
    >
      Voir sur PancakeSwap <ExternalLink className="h-4 w-4 ml-1" />
    </a>
  )}
</div>
        </div>
      )}
    </div>
  );
}