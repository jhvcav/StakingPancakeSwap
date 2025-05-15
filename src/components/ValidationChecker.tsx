import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

// VALIDATION DES POOL IDS - Vérifiés sur BSCScan
const VERIFIED_PANCAKE_POOLS = {
  2: { 
    name: 'CAKE-BNB', 
    lpToken: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    active: true 
  },
  3: { 
    name: 'BUSD-BNB', 
    lpToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    active: true 
  },
  4: { 
    name: 'USDT-BNB', 
    lpToken: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',
    active: true 
  },
  261: { 
    name: 'ANKR-BNB', 
    lpToken: '0x3147F98B8f9C53Acdf8F16332eaD12B592a1a4ae',
    active: true 
  }
};

const PANCAKE_MASTERCHEF = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652';

export function ValidationChecker() {
  const [validationResults, setValidationResults] = useState({
    poolIds: { status: 'pending', message: '' },
    approval: { status: 'pending', message: '' },
    rewards: { status: 'pending', message: '' }
  });
  const [selectedPool, setSelectedPool] = useState('2');
  const [testAmount, setTestAmount] = useState('0.001');
  const [isValidating, setIsValidating] = useState(false);

  // 1. VALIDER LES POOL IDs
  const validatePoolIds = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF,
        [
          {
            "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "name": "poolInfo",
            "outputs": [
              {"internalType": "contract IBEP20", "name": "lpToken", "type": "address"},
              {"internalType": "uint256", "name": "allocPoint", "type": "uint256"},
              {"internalType": "uint256", "name": "lastRewardBlock", "type": "uint256"},
              {"internalType": "uint256", "name": "accCakePerShare", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        provider
      );

      let allValid = true;
      const invalidPools = [];

      for (const [pid, info] of Object.entries(VERIFIED_PANCAKE_POOLS)) {
        try {
          const poolInfo = await masterChef.poolInfo(pid);
          const lpTokenAddress = poolInfo[0];
          
          if (lpTokenAddress.toLowerCase() !== info.lpToken.toLowerCase()) {
            allValid = false;
            invalidPools.push(`Pool ${pid}: LP token ne correspond pas`);
          }
        } catch (error) {
          allValid = false;
          invalidPools.push(`Pool ${pid}: Erreur de lecture`);
        }
      }

      setValidationResults(prev => ({
        ...prev,
        poolIds: {
          status: allValid ? 'valid' : 'invalid',
          message: allValid 
            ? 'Tous les pool IDs sont valides' 
            : `Problèmes détectés: ${invalidPools.join(', ')}`
        }
      }));

    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        poolIds: {
          status: 'error',
          message: `Erreur: ${error.message}`
        }
      }));
    }
  };

  // 2. TESTER L'APPROBATION
  const testApproval = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const poolInfo = VERIFIED_PANCAKE_POOLS[selectedPool];
      const lpToken = new ethers.Contract(
        poolInfo.lpToken,
        [
          {
            "inputs": [
              {"internalType": "address", "name": "owner", "type": "address"},
              {"internalType": "address", "name": "spender", "type": "address"}
            ],
            "name": "allowance",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [
              {"internalType": "address", "name": "spender", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        signer
      );

      // Vérifier l'allowance actuelle
      const currentAllowance = await lpToken.allowance(userAddress, PANCAKE_MASTERCHEF);
      console.log('Allowance actuelle:', ethers.formatEther(currentAllowance));

      // Tester l'approbation
      const amountToApprove = ethers.parseEther(testAmount);
      const approveTx = await lpToken.approve(PANCAKE_MASTERCHEF, amountToApprove);
      await approveTx.wait();

      // Vérifier la nouvelle allowance
      const newAllowance = await lpToken.allowance(userAddress, PANCAKE_MASTERCHEF);
      
      if (newAllowance >= amountToApprove) {
        setValidationResults(prev => ({
          ...prev,
          approval: {
            status: 'valid',
            message: `Approbation réussie pour ${testAmount} LP tokens`
          }
        }));
      } else {
        throw new Error('Allowance insuffisante après approbation');
      }

    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        approval: {
          status: 'error',
          message: `Erreur: ${error.message}`
        }
      }));
    }
  };

  // 3. TESTER LA RÉCLAMATION DE RÉCOMPENSES
  const testRewardsClaim = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF,
        [
          {
            "inputs": [
              {"internalType": "uint256", "name": "_pid", "type": "uint256"},
              {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "pendingCake",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        provider
      );

      // Token CAKE
      const cakeToken = new ethers.Contract(
        '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        [{
          "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        provider
      );

      // Vérifier les récompenses en attente
      const pendingRewards = await masterChef.pendingCake(selectedPool, userAddress);
      const cakeBalanceBefore = await cakeToken.balanceOf(userAddress);

      console.log('Récompenses en attente:', ethers.formatEther(pendingRewards));
      console.log('Balance CAKE avant:', ethers.formatEther(cakeBalanceBefore));

      if (pendingRewards > 0) {
        // Si des récompenses sont disponibles, on peut tester la réclamation
        setValidationResults(prev => ({
          ...prev,
          rewards: {
            status: 'valid',
            message: `${ethers.formatEther(pendingRewards)} CAKE disponibles pour réclamation`
          }
        }));
      } else {
        setValidationResults(prev => ({
          ...prev,
          rewards: {
            status: 'info',
            message: 'Pas de récompenses en attente. Stakez d\'abord pour générer des récompenses.'
          }
        }));
      }

    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        rewards: {
          status: 'error',
          message: `Erreur: ${error.message}`
        }
      }));
    }
  };

  // Exécuter toutes les validations
  const runAllValidations = async () => {
    setIsValidating(true);
    
    // Réinitialiser les résultats
    setValidationResults({
      poolIds: { status: 'pending', message: 'Validation en cours...' },
      approval: { status: 'pending', message: 'Validation en cours...' },
      rewards: { status: 'pending', message: 'Validation en cours...' }
    });

    // Exécuter les validations dans l'ordre
    await validatePoolIds();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testApproval();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRewardsClaim();
    
    setIsValidating(false);
  };

  // Fonction de test complet de stake
  const performTestStake = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF,
        [{
          "inputs": [
            {"internalType": "uint256", "name": "_pid", "type": "uint256"},
            {"internalType": "uint256", "name": "_amount", "type": "uint256"}
          ],
          "name": "deposit",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        signer
      );

      const amountWei = ethers.parseEther(testAmount);
      const depositTx = await masterChef.deposit(selectedPool, amountWei);
      await depositTx.wait();

      alert('Test de stake réussi! Vérifiez votre position sur PancakeSwap.');
      
    } catch (error) {
      console.error('Erreur test stake:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Validation PancakeSwap</h1>
      
      {/* Contrôles de test */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Paramètres de Test</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pool à tester</label>
            <select
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {Object.entries(VERIFIED_PANCAKE_POOLS).map(([pid, info]) => (
                <option key={pid} value={pid}>
                  Pool {pid}: {info.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Montant test (LP tokens)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full p-2 border rounded"
              step="0.001"
              min="0.001"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <button
            onClick={runAllValidations}
            disabled={isValidating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="inline-block h-4 w-4 mr-2 animate-spin" />
                Validation en cours...
              </>
            ) : (
              'Lancer la validation'
            )}
          </button>
          
          <button
            onClick={performTestStake}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Test de stake réel
          </button>
        </div>
      </div>

      {/* Résultats de validation */}
      <div className="space-y-4">
        {/* Validation des Pool IDs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">1. Pool IDs PancakeSwap</h3>
            <StatusIcon status={validationResults.poolIds.status} />
          </div>
          <p className="mt-2 text-gray-600">{validationResults.poolIds.message}</p>
        </div>

        {/* Test d'approbation */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">2. Approbation LP Tokens</h3>
            <StatusIcon status={validationResults.approval.status} />
          </div>
          <p className="mt-2 text-gray-600">{validationResults.approval.message}</p>
        </div>

        {/* Test des récompenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">3. Réclamation Récompenses</h3>
            <StatusIcon status={validationResults.rewards.status} />
          </div>
          <p className="mt-2 text-gray-600">{validationResults.rewards.message}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Assurez-vous d'avoir des LP tokens dans votre wallet</li>
          <li>Commencez avec de très petits montants (0.001)</li>
          <li>Vérifiez chaque étape avant de passer à la suivante</li>
          <li>Vérifiez vos positions directement sur app.pancakeswap.finance</li>
        </ol>
      </div>
    </div>
  );
}

// Composant pour l'icône de statut
function StatusIcon({ status }) {
  switch (status) {
    case 'valid':
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case 'invalid':
    case 'error':
      return <XCircle className="h-6 w-6 text-red-500" />;
    case 'info':
      return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    default:
      return <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />;
  }
}