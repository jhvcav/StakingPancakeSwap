import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Calendar, TrendingUp, DollarSign, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { CryptoVaultDashboard } from './CryptoVaultDashboard';

const PANCAKE_MASTERCHEF_ADDRESS = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652';

// Configuration des pools PancakeSwap
const PANCAKE_POOLS = {
  2: { name: 'CAKE-BNB', lpToken: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', token0: 'CAKE', token1: 'BNB' },
  3: { name: 'BUSD-BNB', lpToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16', token0: 'BUSD', token1: 'BNB' },
  4: { name: 'USDT-BNB', lpToken: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE', token0: 'USDT', token1: 'BNB' },
  // Ajout de USDC-BNB (vérifiez l'adresse exacte sur PancakeSwap)
  5: { name: 'USDC-BNB', lpToken: '0xEC6557348085Aa57C72514D67070dC863C0a5A8c', token0: 'USDC', token1: 'BNB' },
};

export function DailyStakingSection() {
  // États pour le workflow quotidien
  const [dailyDeposits, setDailyDeposits] = useState('0');
  const [selectedPair, setSelectedPair] = useState('');
  const [lpTokensToStake, setLpTokensToStake] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableLPBalance, setAvailableLPBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // États pour le mode édition
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({
    totalDeposits: '0',
    apr: 0.15 // 15% par défaut
  });
  
  // Suivi des obligations CryptoVault
  const [cryptoVaultData, setCryptoVaultData] = useState({
    totalDeposits: '0',
    totalPromised: '0',
    dailyRequired: '0',
    lastUpdate: new Date().toISOString()
  });
  
  // Positions PancakeSwap
  const [positions, setPositions] = useState([]);
  const [totalRewards, setTotalRewards] = useState('0');
  
  // Historique des opérations quotidiennes
  const [dailyHistory, setDailyHistory] = useState([]);

  // Charger les données depuis le localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('dailyStakingHistory');
    if (savedHistory) {
      setDailyHistory(JSON.parse(savedHistory));
    }
    
    const savedVaultData = localStorage.getItem('cryptoVaultData');
    if (savedVaultData) {
      setCryptoVaultData(JSON.parse(savedVaultData));
    }
  }, []);

  // Sauvegarder l'historique
  const saveHistory = (newEntry) => {
    const updatedHistory = [...dailyHistory, newEntry];
    setDailyHistory(updatedHistory);
    localStorage.setItem('dailyStakingHistory', JSON.stringify(updatedHistory));
  };

  // Fonction pour sauvegarder les modifications en mode édition
  const handleEditSave = () => {
    const newTotal = parseFloat(editValues.totalDeposits);
    const apr = parseFloat(editValues.apr);
    const dailyRate = apr / 365;
    const dailyRequired = newTotal * dailyRate;
    
    const updatedData = {
      totalDeposits: newTotal.toString(),
      totalPromised: (newTotal * (1 + apr)).toString(),
      dailyRequired: dailyRequired.toString(),
      lastUpdate: new Date().toISOString()
    };
    
    setCryptoVaultData(updatedData);
    localStorage.setItem('cryptoVaultData', JSON.stringify(updatedData));
    setIsEditMode(false);
    toast.success('Données mises à jour');
  };

  // Étape 1: Enregistrer les nouveaux dépôts du jour
  const handleDailyDeposits = () => {
    const newTotal = parseFloat(cryptoVaultData.totalDeposits) + parseFloat(dailyDeposits);
    const apr = 0.15; // 15% APR exemple
    const dailyRate = apr / 365;
    const dailyRequired = newTotal * dailyRate;
    
    const updatedData = {
      ...cryptoVaultData,
      totalDeposits: newTotal.toString(),
      totalPromised: (newTotal * (1 + apr)).toString(),
      dailyRequired: dailyRequired.toString(),
      lastUpdate: new Date().toISOString()
    };
    
    setCryptoVaultData(updatedData);
    localStorage.setItem('cryptoVaultData', JSON.stringify(updatedData));
    
    toast.success(`Dépôts du jour enregistrés: ${dailyDeposits} USDC`);
  };

  // Étape 2: Créer des LP tokens
  const createLPTokens = () => {
    console.log('createLPTokens appelée');
    console.log('selectedPair:', selectedPair);
    console.log('dailyDeposits:', dailyDeposits);
    
    if (!selectedPair || !dailyDeposits) {
      toast.error('Sélectionnez une paire et entrez le montant');
      return;
    }

    setIsProcessing(true);
    try {
      // Pour l'instant, on simule
      const lpAmount = (parseFloat(dailyDeposits) * 0.98).toString();
      console.log('LP amount calculé:', lpAmount);
      setLpTokensToStake(lpAmount);
      
      toast.success(`${lpAmount} LP tokens prêts (simulés). Utilisez l'onglet "Créer LP Tokens" pour de vrais tokens`);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création des LP tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  // Étape 3: Staker sur PancakeSwap
  const stakeLPTokens = async () => {
    console.log('stakeLPTokens appelée');
    console.log('lpTokensToStake:', lpTokensToStake);
    console.log('selectedPair:', selectedPair);
    
    if (!lpTokensToStake || lpTokensToStake === '0' || !selectedPair) {
      toast.error('Créez d\'abord des LP tokens');
      return;
    }

    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Trouver le pool ID correspondant
      const poolId = Object.keys(PANCAKE_POOLS).find(
        pid => PANCAKE_POOLS[pid].name === selectedPair
      );
      
      console.log('Pool ID trouvé:', poolId);
      
      if (!poolId) {
        throw new Error('Pool non trouvé pour ' + selectedPair);
      }
      
      // ABI pour approuver et déposer
      const lpTokenAddress = PANCAKE_POOLS[poolId].lpToken;
      console.log('LP Token address:', lpTokenAddress);
      
      const lpToken = new ethers.Contract(
        lpTokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF_ADDRESS,
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
      
      const amountWei = ethers.parseEther(lpTokensToStake);
      console.log('Amount en Wei:', amountWei.toString());
      
      // Approuver
      console.log('Approbation en cours...');
      const approveTx = await lpToken.approve(PANCAKE_MASTERCHEF_ADDRESS, amountWei);
      await approveTx.wait();
      console.log('Approbation réussie');
      
      // Déposer
      console.log('Dépôt en cours...');
      const depositTx = await masterChef.deposit(poolId, amountWei);
      await depositTx.wait();
      console.log('Dépôt réussi');
      
      // Enregistrer l'opération
      const operation = {
        date: new Date().toISOString(),
        deposits: dailyDeposits,
        lpTokens: lpTokensToStake,
        pool: selectedPair,
        poolId: poolId,
        status: 'completed'
      };
      
      saveHistory(operation);
      
      toast.success('Staking effectué avec succès!');
      
      // Réinitialiser
      setDailyDeposits('0');
      setLpTokensToStake('0');
      setSelectedPair('');
      
      // Rafraîchir les positions
      await fetchPositions();
      
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error('Erreur lors du staking: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Récupérer les positions actuelles
  const fetchPositions = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF_ADDRESS,
        [
          {
            "inputs": [
              {"internalType": "uint256", "name": "_pid", "type": "uint256"},
              {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "userInfo",
            "outputs": [
              {"internalType": "uint256", "name": "amount", "type": "uint256"},
              {"internalType": "uint256", "name": "rewardDebt", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
          },
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

      const newPositions = [];
      let totalPending = 0;

      for (const [pid, info] of Object.entries(PANCAKE_POOLS)) {
        try {
          const userInfo = await masterChef.userInfo(pid, address);
          const pendingCake = await masterChef.pendingCake(pid, address);
          
          if (userInfo[0] > 0) {
            newPositions.push({
              poolId: pid,
              poolName: info.name,
              amount: ethers.formatEther(userInfo[0]),
              pending: ethers.formatEther(pendingCake)
            });
            totalPending += parseFloat(ethers.formatEther(pendingCake));
          }
        } catch (error) {
          console.error(`Erreur pool ${pid}:`, error);
        }
      }

      setPositions(newPositions);
      setTotalRewards(totalPending.toFixed(4));
      
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Fonction pour retirer (unstake) des LP tokens
const unstakeLP = async (poolId, amount, poolName) => {
  if (!window.ethereum) {
    toast.error("Portefeuille non connecté");
    return;
  }

  setIsProcessing(true);
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Contrat MasterChef
    const masterChef = new ethers.Contract(
      PANCAKE_MASTERCHEF_ADDRESS,
      [
        {
          "inputs": [
            {"internalType": "uint256", "name": "_pid", "type": "uint256"},
            {"internalType": "uint256", "name": "_amount", "type": "uint256"}
          ],
          "name": "withdraw",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      signer
    );
    
    const amountWei = ethers.parseEther(amount);
    console.log(`Unstaking ${amount} LP tokens du pool ${poolId} (${poolName})`);
    
    const tx = await masterChef.withdraw(poolId, amountWei);
    console.log("Transaction envoyée:", tx.hash);
    
    toast.success(`Transaction envoyée! Récupération de ${amount} LP tokens en cours...`);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmée:", receipt);
    
    if (receipt.status === 1) {
      // Enregistrer l'opération dans l'historique
      const operation = {
        date: new Date().toISOString(),
        deposits: "0", // Pas de dépôt dans ce cas
        lpTokens: amount,
        pool: poolName,
        poolId: poolId,
        status: 'unstaked'
      };
      
      saveHistory(operation);
      
      toast.success(`${amount} LP tokens retirés avec succès! Allez dans l'onglet "Retirer Liquidité" pour convertir vos LP en tokens.`);
      
      // Rafraîchir les positions
      await fetchPositions();
    } else {
      toast.error("La transaction a échoué");
    }
  } catch (error) {
    console.error("Erreur lors du unstake:", error);
    toast.error(`Erreur: ${error.message || "Transaction échouée"}`);
  } finally {
    setIsProcessing(false);
  }
};

  // Réclamer toutes les récompenses
  const harvestAll = async () => {
    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF_ADDRESS,
        [{
          "inputs": [{"internalType": "uint256", "name": "_pid", "type": "uint256"}],
          "name": "harvest",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        signer
      );
      
      for (const position of positions) {
        if (parseFloat(position.pending) > 0) {
          const tx = await masterChef.harvest(position.poolId);
          await tx.wait();
        }
      }
      
      toast.success('Toutes les récompenses ont été réclamées');
      await fetchPositions();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la réclamation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Récupérer la balance des LP tokens pour la paire sélectionnée
  const fetchLPBalance = async () => {
    if (!selectedPair || !window.ethereum) return;
    
    setIsLoadingBalance(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Trouver l'adresse du LP token pour la paire sélectionnée
      const poolInfo = Object.values(PANCAKE_POOLS).find(pool => pool.name === selectedPair);
      if (!poolInfo) {
        console.error('Pool non trouvé pour:', selectedPair);
        return;
      }
      
      // Contrat du LP token
      const lpToken = new ethers.Contract(
        poolInfo.lpToken,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      // Récupérer la balance
      const balance = await lpToken.balanceOf(userAddress);
      const formattedBalance = ethers.formatEther(balance);
      
      console.log(`Balance LP ${selectedPair}:`, formattedBalance);
      setAvailableLPBalance(formattedBalance);
      
      // Si on a une balance, on peut pré-remplir le montant à staker
      if (parseFloat(formattedBalance) > 0) {
        setLpTokensToStake(formattedBalance);
      }
      
    } catch (error) {
      console.error('Erreur récupération balance LP:', error);
      setAvailableLPBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Mettre à jour la balance quand la paire change
  useEffect(() => {
    if (selectedPair) {
      fetchLPBalance();
    } else {
      setAvailableLPBalance('0');
      setLpTokensToStake('0');
    }
  }, [selectedPair]); // Tableau de dépendances ajouté

  // Charger les positions au démarrage
  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard CryptoVault */}
      <CryptoVaultDashboard 
        cryptoVaultData={cryptoVaultData}
        setCryptoVaultData={setCryptoVaultData}
        totalRewards={totalRewards}
      />

      {/* Workflow quotidien */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        
        {isEditMode ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Total déposé (USDC)</label>
              <input
                type="number"
                value={editValues.totalDeposits}
                onChange={(e) => setEditValues({...editValues, totalDeposits: e.target.value})}
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">APR (%)</label>
              <input
                type="number"
                value={editValues.apr * 100}
                onChange={(e) => setEditValues({...editValues, apr: parseFloat(e.target.value) / 100})}
                className="mt-1 w-full p-2 border rounded"
                step="0.1"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total déposé</p>
              <p className="text-xl font-bold">{cryptoVaultData.totalDeposits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total promis</p>
              <p className="text-xl font-bold text-orange-600">{cryptoVaultData.totalPromised}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requis/jour</p>
              <p className="text-xl font-bold text-red-600">{cryptoVaultData.dailyRequired}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gains actuels</p>
              <p className="text-xl font-bold text-green-600">{totalRewards} CAKE</p>
            </div>
          </div>
        )}
        
        {parseFloat(totalRewards) < parseFloat(cryptoVaultData.dailyRequired) && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg flex items-center">
            <AlertCircle className="text-red-600 mr-2" />
            <span className="text-red-800">
              Attention: Les gains actuels ne couvrent pas les besoins quotidiens!
            </span>
          </div>
        )}
      </div>

      {/* Workflow quotidien */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" /> Workflow du Jour
        </h2>
        
        <div className="space-y-6">
          {/* Étape 1: Enregistrer les dépôts */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium mb-2">1. Enregistrer les nouveaux dépôts CryptoVault</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Montant d'USDC déposé sur CryptoVault aujourd'hui
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={dailyDeposits}
                  onChange={(e) => setDailyDeposits(e.target.value)}
                  placeholder="Montant en USDC"
                  className="flex-1 p-2 border rounded"
                />
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded">
                  USDC
                </span>
                <button
                  onClick={handleDailyDeposits}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>

          {/* Étape 2: Sélectionner la paire LP */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium mb-2">2. Sélectionner la paire LP</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPair}
                  onChange={(e) => {
                    console.log('Paire sélectionnée:', e.target.value);
                    setSelectedPair(e.target.value);
                  }}
                  className="flex-1 p-2 border rounded"
                >
                  <option value="">Sélectionner une paire</option>
                  {Object.values(PANCAKE_POOLS).map(pool => (
                    <option key={pool.name} value={pool.name}>
                      {pool.name}
                    </option>
                  ))}
                </select>
                {isLoadingBalance && (
                  <span className="text-sm text-gray-500">Chargement...</span>
                )}
              </div>
              
              {selectedPair && availableLPBalance !== '0' && (
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-purple-700">
                    Balance disponible: {parseFloat(availableLPBalance).toFixed(6)} LP tokens
                  </p>
                  <div className="mt-2">
                    <label className="text-sm text-gray-600">Montant à staker:</label>
                    <input
                      type="number"
                      value={lpTokensToStake}
                      onChange={(e) => setLpTokensToStake(e.target.value)}
                      max={availableLPBalance}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              )}
              
              {selectedPair && availableLPBalance === '0' && !isLoadingBalance && (
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-sm text-yellow-700">
                    Aucun LP token {selectedPair} dans votre wallet.
                    Créez d'abord des LP tokens via l'onglet "Créer LP (Smart)".
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Étape 3: Staker sur PancakeSwap */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium mb-2">3. Staker sur PancakeSwap</h3>
            {lpTokensToStake !== '0' && (
              <p className="mb-2 text-sm text-gray-600">
                Montant à staker: {lpTokensToStake} LP tokens
              </p>
            )}
            <button
              onClick={() => {
                console.log('Clic sur Staker - lpTokensToStake:', lpTokensToStake);
                console.log('isProcessing:', isProcessing);
                if (!lpTokensToStake || lpTokensToStake === '0') {
                  toast.error('Aucun LP token à staker');
                  return;
                }
                if (parseFloat(lpTokensToStake) > parseFloat(availableLPBalance)) {
                  toast.error('Montant supérieur à votre balance');
                  return;
                }
                stakeLPTokens();
              }}
              disabled={!lpTokensToStake || lpTokensToStake === '0' || isProcessing || parseFloat(lpTokensToStake) > parseFloat(availableLPBalance)}
              className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? 'Traitement...' : 'Staker sur PancakeSwap'}
            </button>
          </div>
        </div>
      </div>

      {/* Positions actuelles */}
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold flex items-center">
      <TrendingUp className="mr-2" /> Positions Actives
    </h2>
    <div className="flex space-x-2">
      <button
        onClick={harvestAll}
        disabled={isProcessing || parseFloat(totalRewards) === 0}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Réclamer tout ({totalRewards} CAKE)
      </button>
    </div>
  </div>
  
  {positions.length === 0 ? (
    <p className="text-gray-500">Aucune position active</p>
  ) : (
    <div className="space-y-3">
      {positions.map(position => (
        <div key={position.poolId} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{position.poolName}</h4>
              <p className="text-sm text-gray-600">
                {position.amount} LP tokens stakés
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-lg font-semibold text-green-600">
                {position.pending} CAKE
              </p>
              <p className="text-xs text-gray-500">Récompenses</p>
              
              {/* Bouton Unstake */}
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => unstakeLP(position.poolId, position.amount, position.poolName)}
                  disabled={isProcessing}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Unstake LP
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* Historique */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Historique des Opérations</h2>
        {dailyHistory.length === 0 ? (
          <p className="text-gray-500">Aucune opération enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dépôts</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">LP Tokens</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pool</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyHistory.slice(-10).reverse().map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{entry.deposits}</td>
                    <td className="px-4 py-2 text-sm">{entry.lpTokens}</td>
                    <td className="px-4 py-2 text-sm">{entry.pool}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}