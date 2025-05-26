import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Plus, Calculator } from 'lucide-react';

const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const PANCAKE_FACTORY_ADDRESS = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';

// ABIs nécessaires
const ROUTER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountA", "type": "uint256"},
      {"internalType": "uint256", "name": "reserveA", "type": "uint256"},
      {"internalType": "uint256", "name": "reserveB", "type": "uint256"}
    ],
    "name": "quote",
    "outputs": [{"internalType": "uint256", "name": "amountB", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  }
];

const PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {"internalType": "uint112", "name": "_reserve0", "type": "uint112"},
      {"internalType": "uint112", "name": "_reserve1", "type": "uint112"},
      {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Adresses des tokens
const TOKENS = {
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
};

// Adresses des paires LP
const LP_PAIRS = {
  'CAKE-BNB': '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
  'USDC-BNB': '0xEC6557348085Aa57C72514D67070dC863C0a5A8c'
};

export function SmartLPCreator() {
  const [selectedPair, setSelectedPair] = useState('CAKE-BNB');
  const [inputAmount, setInputAmount] = useState('');
  const [inputToken, setInputToken] = useState('CAKE');
  const [outputAmount, setOutputAmount] = useState('0');
  const [reserves, setReserves] = useState({ token0: '0', token1: '0' });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Calculer automatiquement le montant du second token
  const calculateOutputAmount = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setOutputAmount('0');
      return;
    }

    setIsCalculating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Obtenir les réserves de la paire
      const pairAddress = LP_PAIRS[selectedPair];
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      const [reserve0, reserve1] = await pairContract.getReserves();
      
      // Déterminer quel token est token0 et token1
      const amountIn = ethers.parseEther(inputAmount);
      let calculatedAmount;
      
      // Utiliser la fonction quote du router pour calculer le ratio exact
      const router = new ethers.Contract(PANCAKE_ROUTER_ADDRESS, ROUTER_ABI, provider);
      
      if (inputToken === selectedPair.split('-')[0]) {
        // Si on input le premier token
        calculatedAmount = await router.quote(amountIn, reserve0, reserve1);
      } else {
        // Si on input le second token
        calculatedAmount = await router.quote(amountIn, reserve1, reserve0);
      }
      
      setOutputAmount(ethers.formatEther(calculatedAmount));
      setReserves({
        token0: ethers.formatEther(reserve0),
        token1: ethers.formatEther(reserve1)
      });
      
    } catch (error) {
      console.error('Erreur calcul:', error);
      toast.error('Erreur lors du calcul du ratio');
    } finally {
      setIsCalculating(false);
    }
  };

  // Créer les LP tokens avec les montants calculés
  const createLPTokens = async () => {
    if (!inputAmount || !outputAmount || parseFloat(outputAmount) === 0) {
      toast.error('Calculez d\'abord les montants nécessaires');
      return;
    }

    setIsCreating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Router pour ajouter la liquidité
      const router = new ethers.Contract(
        PANCAKE_ROUTER_ADDRESS,
        [
          {
            "inputs": [
              {"internalType": "address", "name": "token", "type": "address"},
              {"internalType": "uint256", "name": "amountTokenDesired", "type": "uint256"},
              {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"},
              {"internalType": "uint256", "name": "amountETHMin", "type": "uint256"},
              {"internalType": "address", "name": "to", "type": "address"},
              {"internalType": "uint256", "name": "deadline", "type": "uint256"}
            ],
            "name": "addLiquidityETH",
            "outputs": [
              {"internalType": "uint256", "name": "amountToken", "type": "uint256"},
              {"internalType": "uint256", "name": "amountETH", "type": "uint256"},
              {"internalType": "uint256", "name": "liquidity", "type": "uint256"}
            ],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        signer
      );
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      // Montants avec 1% de slippage
      const amountToken = ethers.parseEther(inputAmount);
      const amountBNB = ethers.parseEther(outputAmount);
      const amountTokenMin = amountToken * 99n / 100n;
      const amountBNBMin = amountBNB * 99n / 100n;
      
      // Approuver le token
      const tokenAddress = inputToken === 'CAKE' ? TOKENS.CAKE : TOKENS.USDC;
      const token = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      
      const approveTx = await token.approve(PANCAKE_ROUTER_ADDRESS, amountToken);
      await approveTx.wait();
      toast.success('Token approuvé');
      
      // Ajouter la liquidité
      const tx = await router.addLiquidityETH(
        tokenAddress,
        amountToken,
        amountTokenMin,
        amountBNBMin,
        userAddress,
        deadline,
        { value: amountBNB }
      );
      
      const receipt = await tx.wait();
      toast.success('LP tokens créés avec succès!');
      
      // Réinitialiser
      setInputAmount('');
      setOutputAmount('0');
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Recalculer quand l'input change
  useEffect(() => {
    if (inputAmount) {
      const timer = setTimeout(() => {
        calculateOutputAmount();
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timer);
    }
  }, [inputAmount, selectedPair, inputToken]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Plus className="mr-2" /> Créer des LP Tokens (Smart)
      </h2>
      
      <div className="space-y-4">
        {/* Sélection de la paire */}
        <div>
          <label className="block text-sm font-medium mb-2">Paire de liquidité</label>
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="CAKE-BNB">CAKE-BNB</option>
            <option value="USDC-BNB">USDC-BNB</option>
          </select>
        </div>
        
        {/* Token d'entrée */}
        <div>
          <label className="block text-sm font-medium mb-2">Token d'entrée</label>
          <div className="flex space-x-2">
            <select
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-1/3 p-2 border rounded"
            >
              {selectedPair.split('-').map(token => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="Montant"
              className="flex-1 p-2 border rounded"
            />
          </div>
        </div>
        
        {/* Calcul automatique */}
        <div className="flex items-center space-x-2">
          <Calculator className="text-blue-600" />
          <span className="text-sm text-gray-600">
            Calcul automatique du ratio basé sur les réserves actuelles
          </span>
        </div>
        
        {/* Token de sortie calculé */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant {inputToken === selectedPair.split('-')[0] ? selectedPair.split('-')[1] : selectedPair.split('-')[0]} nécessaire
          </label>
          <div className="p-3 bg-gray-100 rounded">
            <p className="text-lg font-semibold">
              {isCalculating ? 'Calcul...' : outputAmount}
            </p>
          </div>
        </div>
        
        {/* Informations sur les réserves */}
        {reserves.token0 !== '0' && (
          <div className="p-3 bg-blue-50 rounded text-sm">
            <p>Réserves actuelles:</p>
            <p>{selectedPair.split('-')[0]}: {parseFloat(reserves.token0).toFixed(2)}</p>
            <p>{selectedPair.split('-')[1]}: {parseFloat(reserves.token1).toFixed(2)}</p>
          </div>
        )}
        
        {/* Bouton de création */}
        <button
          onClick={createLPTokens}
          disabled={isCreating || !outputAmount || parseFloat(outputAmount) === 0}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isCreating ? 'Création en cours...' : 'Créer les LP Tokens'}
        </button>
        
        {/* Note */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Le ratio est calculé automatiquement selon les prix actuels</p>
          <p>• 1% de slippage est appliqué pour la protection</p>
          <p>• Assurez-vous d'avoir suffisamment de BNB pour le gas</p>
        </div>
      </div>
    </div>
  );
}
