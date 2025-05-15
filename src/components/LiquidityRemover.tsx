import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Minus, RefreshCw } from 'lucide-react';

const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const PANCAKE_ROUTER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint256", "name": "liquidity", "type": "uint256"},
      {"internalType": "uint256", "name": "amountAMin", "type": "uint256"},
      {"internalType": "uint256", "name": "amountBMin", "type": "uint256"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "removeLiquidity",
    "outputs": [
      {"internalType": "uint256", "name": "amountA", "type": "uint256"},
      {"internalType": "uint256", "name": "amountB", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "liquidity", "type": "uint256"},
      {"internalType": "uint256", "name": "amountTokenMin", "type": "uint256"},
      {"internalType": "uint256", "name": "amountETHMin", "type": "uint256"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "removeLiquidityETH",
    "outputs": [
      {"internalType": "uint256", "name": "amountToken", "type": "uint256"},
      {"internalType": "uint256", "name": "amountETH", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Adresses des tokens
const CAKE_TOKEN = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
const WBNB_TOKEN = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// Paires LP populaires
const LP_PAIRS = {
  'CAKE-BNB': {
    address: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    tokenA: CAKE_TOKEN,
    tokenB: WBNB_TOKEN,
    isETHPair: true
  },
  'BUSD-BNB': {
    address: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    tokenA: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    tokenB: WBNB_TOKEN,
    isETHPair: true
  }
};

export function LiquidityRemover() {
  const [selectedPair, setSelectedPair] = useState('CAKE-BNB');
  const [lpBalance, setLpBalance] = useState('0');
  const [amountToRemove, setAmountToRemove] = useState('');
  const [percentageToRemove, setPercentageToRemove] = useState(100);
  const [isRemoving, setIsRemoving] = useState(false);
  const [estimatedTokens, setEstimatedTokens] = useState({ tokenA: '0', tokenB: '0' });

  // Récupérer la balance de LP tokens
  const fetchLPBalance = async () => {
    if (!window.ethereum) return;

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
      setLpBalance(ethers.formatEther(balance));
      setAmountToRemove(ethers.formatEther(balance));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Estimer les tokens à recevoir
  const estimateTokenAmounts = async () => {
    if (!window.ethereum || !amountToRemove) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const pairInfo = LP_PAIRS[selectedPair];
      
      // Récupérer les réserves de la paire
      const pairContract = new ethers.Contract(
        pairInfo.address,
        [
          'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
          'function totalSupply() view returns (uint256)',
          'function token0() view returns (address)',
          'function token1() view returns (address)'
        ],
        provider
      );
      
      const [reserves, totalSupply, token0, token1] = await Promise.all([
        pairContract.getReserves(),
        pairContract.totalSupply(),
        pairContract.token0(),
        pairContract.token1()
      ]);
      
      const lpAmount = ethers.parseEther(amountToRemove);
      const share = lpAmount * ethers.parseEther('1') / totalSupply;
      
      let amount0 = share * reserves[0] / ethers.parseEther('1');
      let amount1 = share * reserves[1] / ethers.parseEther('1');
      
      // Déterminer quel token est CAKE et lequel est WBNB
      if (token0.toLowerCase() === pairInfo.tokenA.toLowerCase()) {
        setEstimatedTokens({
          tokenA: ethers.formatEther(amount0),
          tokenB: ethers.formatEther(amount1)
        });
      } else {
        setEstimatedTokens({
          tokenA: ethers.formatEther(amount1),
          tokenB: ethers.formatEther(amount0)
        });
      }
    } catch (error) {
      console.error('Erreur estimation:', error);
    }
  };

  // Retirer la liquidité
  const removeLiquidity = async () => {
    if (!amountToRemove || parseFloat(amountToRemove) <= 0) {
      toast.error('Entrez un montant valide');
      return;
    }

    setIsRemoving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const pairInfo = LP_PAIRS[selectedPair];
      const lpAmount = ethers.parseEther(amountToRemove);
      
      // 1. Approuver le router à dépenser les LP tokens
      const lpToken = new ethers.Contract(
        pairInfo.address,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      
      const approveTx = await lpToken.approve(PANCAKE_ROUTER, lpAmount);
      await approveTx.wait();
      toast.success('LP tokens approuvés');
      
      // 2. Retirer la liquidité
      const router = new ethers.Contract(PANCAKE_ROUTER, PANCAKE_ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      let removeTx;
      if (pairInfo.isETHPair) {
        // Pour les paires avec BNB
        removeTx = await router.removeLiquidityETH(
          pairInfo.tokenA, // Token (CAKE ou autre)
          lpAmount,        // Montant de LP
          0,              // Min token (0 pour accepter tout slippage)
          0,              // Min ETH
          userAddress,    // Destinataire
          deadline
        );
      } else {
        // Pour les paires sans BNB
        removeTx = await router.removeLiquidity(
          pairInfo.tokenA,
          pairInfo.tokenB,
          lpAmount,
          0,
          0,
          userAddress,
          deadline
        );
      }
      
      await removeTx.wait();
      toast.success('Liquidité retirée avec succès !');
      
      // Rafraîchir les balances
      await fetchLPBalance();
      setAmountToRemove('');
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du retrait: ' + error.message);
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

  // Charger la balance au changement de paire
  useEffect(() => {
    fetchLPBalance();
  }, [selectedPair]);

  // Estimer les tokens quand le montant change
  useEffect(() => {
    estimateTokenAmounts();
  }, [amountToRemove, selectedPair]);

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
        <p className="text-sm text-gray-600">Balance LP disponible</p>
        <p className="text-xl font-bold">{parseFloat(lpBalance).toFixed(6)} LP</p>
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
          value={percentageToRemove}
          onChange={(e) => setPercentageToRemove(Number(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Montant à retirer */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Montant LP à retirer</label>
        <input
          type="number"
          value={amountToRemove}
          onChange={(e) => setAmountToRemove(e.target.value)}
          className="w-full p-2 border rounded"
          step="0.000001"
        />
      </div>
      
      {/* Estimation des tokens à recevoir */}
      <div className="mb-6 p-3 bg-blue-50 rounded">
        <p className="text-sm font-medium mb-2">Vous recevrez approximativement:</p>
        <div className="space-y-1">
          <p className="text-sm">
            {selectedPair.split('-')[0]}: <span className="font-bold">{parseFloat(estimatedTokens.tokenA).toFixed(6)}</span>
          </p>
          <p className="text-sm">
            {selectedPair.split('-')[1]}: <span className="font-bold">{parseFloat(estimatedTokens.tokenB).toFixed(6)}</span>
          </p>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex space-x-4">
        <button
          onClick={removeLiquidity}
          disabled={isRemoving || !amountToRemove || parseFloat(amountToRemove) <= 0}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isRemoving ? (
            <>
              <RefreshCw className="inline h-4 w-4 mr-2 animate-spin" />
              Retrait en cours...
            </>
          ) : (
            'Retirer la liquidité'
          )}
        </button>
        
        <button
          onClick={fetchLPBalance}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      {/* Note d'information */}
      <p className="mt-4 text-xs text-gray-500">
        Note: Le retrait de liquidité vous rendra les deux tokens de la paire. 
        Pour CAKE-BNB, vous récupérerez du CAKE et du BNB.
      </p>
    </div>
  );
}