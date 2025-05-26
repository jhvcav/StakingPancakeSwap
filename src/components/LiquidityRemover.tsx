import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Minus, RefreshCw, ExternalLink } from 'lucide-react';

// Adresse du Router PancakeSwap
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

// Adresse du WBNB (Wrapped BNB)
const WBNB_TOKEN = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// Configuration des paires LP
const LP_PAIRS = {
  'CAKE-BNB': {
    address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    tokenA: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
    tokenASymbol: 'CAKE',
    tokenB: WBNB_TOKEN,
    tokenBSymbol: 'BNB'
  },
  'BUSD-BNB': {
    address: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    tokenA: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    tokenASymbol: 'BUSD',
    tokenB: WBNB_TOKEN,
    tokenBSymbol: 'BNB'
  },
  'USDT-BNB': {
    address: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',
    tokenA: '0x55d398326f99059fF775485246999027B3197955', // USDT
    tokenASymbol: 'USDT',
    tokenB: WBNB_TOKEN,
    tokenBSymbol: 'BNB'
  },
  'USDC-BNB': {
    address: '0xEC6557348085Aa57C72514D67070dC863C0a5A8c',
    tokenA: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    tokenASymbol: 'USDC',
    tokenB: WBNB_TOKEN,
    tokenBSymbol: 'BNB'
  }
  // Vous pouvez ajouter d'autres paires ici
};

export function LiquidityRemover() {
  const [selectedPair, setSelectedPair] = useState('CAKE-BNB');
  const [lpBalance, setLpBalance] = useState('0');
  const [amountToRemove, setAmountToRemove] = useState('');
  const [percentageToRemove, setPercentageToRemove] = useState(100);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [estimatedTokens, setEstimatedTokens] = useState({ tokenA: '0', tokenB: '0' });
  const [txHash, setTxHash] = useState('');
  const [slippage, setSlippage] = useState(1); // 1% de slippage par défaut
  const [debugLogs, setDebugLogs] = useState([]);
  const [isApproved, setIsApproved] = useState(false);

  // Ajouter un log pour le débogage
  const addLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Récupérer la balance de LP tokens
  const fetchLPBalance = async () => {
    if (!window.ethereum) {
      toast.error("Portefeuille non connecté");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const lpToken = new ethers.Contract(
        LP_PAIRS[selectedPair].address,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      const balance = await lpToken.balanceOf(userAddress);
      const formattedBalance = ethers.formatEther(balance);
      
      addLog(`Balance LP ${selectedPair}: ${formattedBalance}`);
      setLpBalance(formattedBalance);
      
      // Définir le montant à retirer comme la balance totale par défaut
      if (parseFloat(formattedBalance) > 0) {
        setAmountToRemove(formattedBalance);
        setPercentageToRemove(100);
        
        // Vérifier l'approbation
        checkAllowance();
      } else {
        setAmountToRemove('0');
        setIsApproved(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      addLog(`Erreur récupération balance: ${error.message}`);
      toast.error("Erreur de chargement de la balance");
    }
  };
  
  // Vérifier si le Router est approuvé pour dépenser les tokens
  const checkAllowance = async () => {
    if (!window.ethereum || parseFloat(lpBalance) <= 0) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const lpToken = new ethers.Contract(
        LP_PAIRS[selectedPair].address,
        ['function allowance(address,address) view returns (uint256)'],
        provider
      );
      
      const allowance = await lpToken.allowance(userAddress, PANCAKE_ROUTER);
      const requiredAmount = ethers.parseEther(amountToRemove);
      
      addLog(`Allowance: ${ethers.formatEther(allowance)}`);
      
      if (allowance >= requiredAmount) {
        setIsApproved(true);
        addLog("Le router est déjà approuvé pour ces LP tokens");
      } else {
        setIsApproved(false);
        addLog("Approbation requise pour retirer la liquidité");
      }
    } catch (error) {
      console.error('Erreur vérification allowance:', error);
      addLog(`Erreur vérification allowance: ${error.message}`);
    }
  };

  // Approuver le router à dépenser les LP tokens
  const approveLPTokens = async () => {
    if (!window.ethereum || parseFloat(amountToRemove) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    
    setIsApproving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const lpToken = new ethers.Contract(
        LP_PAIRS[selectedPair].address,
        ['function approve(address,uint256) returns (bool)'],
        signer
      );
      
      const amount = ethers.parseEther(amountToRemove);
      
      addLog(`Approbation de ${amount} LP tokens...`);
      const tx = await lpToken.approve(PANCAKE_ROUTER, amount);
      
      addLog(`Transaction d'approbation envoyée: ${tx.hash}`);
      setTxHash(tx.hash);
      
      toast.success("Transaction d'approbation envoyée");
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        addLog("Approbation confirmée avec succès");
        toast.success("LP tokens approuvés avec succès!");
        setIsApproved(true);
      } else {
        addLog("Echec de l'approbation");
        toast.error("L'approbation a échoué");
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      addLog(`Erreur approbation: ${error.message}`);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Retirer la liquidité pour n'importe quelle paire
  const removeLiquidity = async () => {
    if (!window.ethereum || parseFloat(amountToRemove) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    
    if (parseFloat(amountToRemove) > parseFloat(lpBalance)) {
      toast.error("Montant supérieur à votre balance");
      return;
    }
    
    if (!isApproved) {
      toast.error("Vous devez d'abord approuver les LP tokens");
      return;
    }
    
    setIsRemoving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const pairInfo = LP_PAIRS[selectedPair];
      const lpAmount = ethers.parseEther(amountToRemove);
      
      addLog(`Retrait de ${amountToRemove} LP tokens ${selectedPair}`);
      
      // Vérifier si l'un des tokens est WBNB
      const isBNBPair = 
        pairInfo.tokenA.toLowerCase() === WBNB_TOKEN.toLowerCase() || 
        pairInfo.tokenB.toLowerCase() === WBNB_TOKEN.toLowerCase();
      
      // Récupérer des infos sur le LP token pour identifier les tokens correctement
      const lpToken = new ethers.Contract(
        pairInfo.address,
        [
          'function token0() view returns (address)',
          'function token1() view returns (address)',
        ],
        provider
      );
      
      const [token0, token1] = await Promise.all([
        lpToken.token0(),
        lpToken.token1(),
      ]);
      
      addLog(`Token0: ${token0}`);
      addLog(`Token1: ${token1}`);
      
      // Déterminer quel token est BNB (si c'est une paire BNB)
      let tokenAddress, bnbIsToken0;
      if (isBNBPair) {
        if (token0.toLowerCase() === WBNB_TOKEN.toLowerCase()) {
          tokenAddress = token1;
          bnbIsToken0 = true;
          addLog("BNB est le token0");
        } else {
          tokenAddress = token0;
          bnbIsToken0 = false;
          addLog("BNB est le token1");
        }
      }
      
      // Créer le contrat du router
      const router = new ethers.Contract(
        PANCAKE_ROUTER,
        [
          'function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)',
          'function removeLiquidityETH(address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)'
        ],
        signer
      );
      
      // Calculer les montants minimums avec slippage
      // Pour simplifier, on utilise 0 dans cet exemple
      const amountAMin = 0;
      const amountBMin = 0;
      
      // Deadline dans 20 minutes
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      
      let tx;
      
      // Si c'est une paire avec BNB, utiliser removeLiquidityETH
      if (isBNBPair) {
        addLog(`Retrait de liquidité ETH pour ${pairInfo.tokenASymbol}-${pairInfo.tokenBSymbol}`);
        
        tx = await router.removeLiquidityETH(
          tokenAddress,  // Adresse du token non-BNB
          lpAmount,      // Montant de LP tokens
          amountAMin,    // Montant minimum de tokens à recevoir
          amountBMin,    // Montant minimum de BNB à recevoir
          userAddress,   // Destinataire
          deadline       // Deadline
        );
      } else {
        // Pour les paires sans BNB, utiliser removeLiquidity
        addLog(`Retrait de liquidité standard pour ${pairInfo.tokenASymbol}-${pairInfo.tokenBSymbol}`);
        
        tx = await router.removeLiquidity(
          pairInfo.tokenA,  // Adresse du tokenA
          pairInfo.tokenB,  // Adresse du tokenB
          lpAmount,         // Montant de LP tokens
          amountAMin,       // Montant minimum de tokenA à recevoir
          amountBMin,       // Montant minimum de tokenB à recevoir
          userAddress,      // Destinataire
          deadline          // Deadline
        );
      }
      
      addLog(`Transaction de retrait envoyée: ${tx.hash}`);
      setTxHash(tx.hash);
      
      toast.success("Transaction de retrait envoyée");
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        addLog("Retrait confirmé avec succès");
        toast.success(`Liquidité retirée avec succès! Vous avez reçu vos ${pairInfo.tokenASymbol} et ${pairInfo.tokenBSymbol}.`);
        
        // Rafraîchir la balance de LP
        await fetchLPBalance();
      } else {
        addLog("Echec du retrait de liquidité");
        toast.error("Le retrait de liquidité a échoué");
      }
    } catch (error) {
      console.error('Erreur retrait de liquidité:', error);
      addLog(`Erreur retrait de liquidité: ${error.message}`);
      
      // Analyser l'erreur pour donner un message plus utile
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('user rejected')) {
        toast.error("Transaction rejetée par l'utilisateur");
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error("Fonds insuffisants pour les frais de transaction");
      } else if (errorMessage.toLowerCase().includes('k')) {
        toast.error("Erreur dans la constante de produit. Essayez d'augmenter le slippage.");
      } else if (errorMessage.toLowerCase().includes('expired')) {
        toast.error("Transaction expirée. Veuillez réessayer.");
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Mettre à jour le montant selon le pourcentage
  useEffect(() => {
    if (lpBalance && percentageToRemove) {
      const amount = (parseFloat(lpBalance) * percentageToRemove / 100).toFixed(18);
      setAmountToRemove(amount);
    }
  }, [percentageToRemove, lpBalance]);

  // Charger la balance au chargement initial et au changement de paire
  useEffect(() => {
    fetchLPBalance();
    setDebugLogs([]);
  }, [selectedPair]);
  
  // Vérifier l'approbation quand le montant change
  useEffect(() => {
    if (amountToRemove && parseFloat(amountToRemove) > 0) {
      checkAllowance();
    }
  }, [amountToRemove]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Minus className="mr-2" /> Retirer la Liquidité
      </h2>
      
      {/* Sélection de la paire */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Paire LP</label>
        <select
          value={selectedPair}
          onChange={(e) => setSelectedPair(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {Object.keys(LP_PAIRS).map(pair => (
            <option key={pair} value={pair}>{pair}</option>
          ))}
        </select>
      </div>
      
      {/* Balance de LP */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Balance LP disponible</p>
            <p className="text-xl font-bold">{parseFloat(lpBalance).toFixed(8)} LP</p>
          </div>
          <button
            onClick={fetchLPBalance}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Slider de pourcentage */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Pourcentage à retirer: {percentageToRemove}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={percentageToRemove}
          onChange={(e) => setPercentageToRemove(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-2">
          <button 
            onClick={() => setPercentageToRemove(25)}
            className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
          >
            25%
          </button>
          <button 
            onClick={() => setPercentageToRemove(50)}
            className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
          >
            50%
          </button>
          <button 
            onClick={() => setPercentageToRemove(75)}
            className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
          >
            75%
          </button>
          <button 
            onClick={() => setPercentageToRemove(100)}
            className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
          >
            100%
          </button>
        </div>
      </div>
      
      {/* Montant à retirer */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Montant LP à retirer</label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={amountToRemove}
            onChange={(e) => {
              setAmountToRemove(e.target.value);
              // Mettre à jour le pourcentage en fonction du montant
              if (parseFloat(lpBalance) > 0) {
                const percentage = (parseFloat(e.target.value) / parseFloat(lpBalance)) * 100;
                setPercentageToRemove(Math.min(100, Math.max(0, percentage)));
              }
            }}
            className="flex-1 p-2 border rounded"
            step="0.000000001"
            placeholder="0.0"
          />
          <button
            onClick={() => {
              setAmountToRemove(lpBalance);
              setPercentageToRemove(100);
            }}
            className="px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            MAX
          </button>
        </div>
      </div>
      
      {/* Configuration du slippage */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Slippage: {slippage}%
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setSlippage(0.1)}
            className={`px-2 py-1 rounded text-xs ${slippage === 0.1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            0.1%
          </button>
          <button
            onClick={() => setSlippage(0.5)}
            className={`px-2 py-1 rounded text-xs ${slippage === 0.5 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            0.5%
          </button>
          <button
            onClick={() => setSlippage(1)}
            className={`px-2 py-1 rounded text-xs ${slippage === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            1%
          </button>
          <button
            onClick={() => setSlippage(3)}
            className={`px-2 py-1 rounded text-xs ${slippage === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            3%
          </button>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="space-y-3">
        {!isApproved && (
          <button
            onClick={approveLPTokens}
            disabled={isApproving || parseFloat(amountToRemove) <= 0}
            className={`w-full py-3 rounded-lg font-medium ${
              isApproving || parseFloat(amountToRemove) <= 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isApproving ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                Approbation en cours...
              </div>
            ) : (
              'Étape 1: Approuver les LP Tokens'
            )}
          </button>
        )}
        
        <button
          onClick={removeLiquidity}
          disabled={!isApproved || isRemoving || parseFloat(amountToRemove) <= 0}
          className={`w-full py-3 rounded-lg font-medium ${
            !isApproved || isRemoving || parseFloat(amountToRemove) <= 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isRemoving ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="animate-spin h-5 w-5 mr-2" />
              Retrait en cours...
            </div>
          ) : (
            `Étape 2: Retirer ${percentageToRemove}% de liquidité`
          )}
        </button>
      </div>
      
      {/* Lien vers la transaction */}
      {txHash && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium mb-1">Transaction:</p>
          
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          <a>
            {txHash.substring(0, 12)}...{txHash.substring(txHash.length - 8)} <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}
      
      {/* Logs de débogage */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Logs de débogage</h3>
          <button
            onClick={() => setDebugLogs([])}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Effacer
          </button>
        </div>
        <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto text-xs font-mono">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">Aucun log disponible</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}