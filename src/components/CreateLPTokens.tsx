import React, { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';

const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const PANCAKE_ROUTER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint256", "name": "amountADesired", "type": "uint256"},
      {"internalType": "uint256", "name": "amountBDesired", "type": "uint256"},
      {"internalType": "uint256", "name": "amountAMin", "type": "uint256"},
      {"internalType": "uint256", "name": "amountBMin", "type": "uint256"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "addLiquidity",
    "outputs": [
      {"internalType": "uint256", "name": "amountA", "type": "uint256"},
      {"internalType": "uint256", "name": "amountB", "type": "uint256"},
      {"internalType": "uint256", "name": "liquidity", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
];

// Adresses des tokens
const TOKENS = {
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  USDT: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
};

export function CreateLPTokens({ onSuccess }) {
  const [selectedPair, setSelectedPair] = useState('CAKE-BNB');
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const pairs = {
    'CAKE-BNB': { tokenA: 'CAKE', tokenB: 'BNB', addressA: TOKENS.CAKE },
    'BUSD-BNB': { tokenA: 'BUSD', tokenB: 'BNB', addressA: TOKENS.BUSD },
    'USDT-BNB': { tokenA: 'USDT', tokenB: 'BNB', addressA: TOKENS.USDT }
  };

  const handleCreateLPTokens = async () => {
    if (!tokenAAmount || !tokenBAmount) {
      toast.error('Entrez les montants pour les deux tokens');
      return;
    }

    setIsCreating(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const pair = pairs[selectedPair];
      const isETHPair = pair.tokenB === 'BNB';
      
      // Montants en Wei
      const amountA = ethers.parseEther(tokenAAmount);
      const amountB = ethers.parseEther(tokenBAmount);
      
      // Router PancakeSwap
      const router = new ethers.Contract(PANCAKE_ROUTER_ADDRESS, PANCAKE_ROUTER_ABI, signer);
      
      // 1. Approuver le token A
      const tokenA = new ethers.Contract(
        pair.addressA,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      
      const approveTx = await tokenA.approve(PANCAKE_ROUTER_ADDRESS, amountA);
      await approveTx.wait();
      toast.success(`${pair.tokenA} approuvé`);
      
      // 2. Ajouter la liquidité
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      let tx;
      
      if (isETHPair) {
        // Pour les paires avec BNB, utiliser addLiquidityETH
        tx = await router.addLiquidityETH(
          pair.addressA,
          amountA,
          amountA.mul(95).div(100), // 5% slippage
          amountB.mul(95).div(100), // 5% slippage
          userAddress,
          deadline,
          { value: amountB } // Envoyer les BNB
        );
      } else {
        // Pour les autres paires
        tx = await router.addLiquidity(
          pair.addressA,
          TOKENS.WBNB,
          amountA,
          amountB,
          amountA.mul(95).div(100),
          amountB.mul(95).div(100),
          userAddress,
          deadline
        );
      }
      
      const receipt = await tx.wait();
      
      // Récupérer l'amount de LP tokens créés depuis les events
      const liquidityAmount = receipt.logs.find(log => 
        log.topics[0] === ethers.id('Mint(address,uint256,uint256)')
      );
      
      toast.success('LP tokens créés avec succès!');
      
      if (onSuccess) {
        onSuccess({
          pair: selectedPair,
          lpAmount: liquidityAmount ? ethers.formatEther(liquidityAmount.data) : 'N/A'
        });
      }
      
      // Réinitialiser
      setTokenAAmount('');
      setTokenBAmount('');
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création des LP tokens: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Plus className="mr-2" /> Créer des LP Tokens
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
            {Object.keys(pairs).map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
        
        {/* Montant Token A */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant {pairs[selectedPair].tokenA}
          </label>
          <input
            type="number"
            value={tokenAAmount}
            onChange={(e) => setTokenAAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Montant Token B */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant {pairs[selectedPair].tokenB}
          </label>
          <input
            type="number"
            value={tokenBAmount}
            onChange={(e) => setTokenBAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Bouton de création */}
        <button
          onClick={handleCreateLPTokens}
          disabled={isCreating || !tokenAAmount || !tokenBAmount}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isCreating ? 'Création en cours...' : 'Créer des LP Tokens'}
        </button>
        
        {/* Note */}
        <p className="text-xs text-gray-500">
          Note: Assurez-vous d'avoir les deux tokens dans votre wallet. 
          5% de slippage est appliqué automatiquement.
        </p>
      </div>
    </div>
  );
}