// src/components/DailyStakingSectionV3.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Calendar, TrendingUp, DollarSign, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { CryptoVaultDashboard } from './CryptoVaultDashboard';
import { PANCAKE_V3_CONTRACTS } from '../config/contracts';
import { MASTERCHEF_V3_ABI, POSITION_MANAGER_ABI } from '../abis/pancakeV3Abis';

export function DailyStakingSectionV3() {
  // États pour le workflow quotidien
  const [dailyDeposits, setDailyDeposits] = useState('0');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  // Positions V3
  const [availablePositions, setAvailablePositions] = useState([]);
  const [stakedPositions, setStakedPositions] = useState([]);
  const [totalRewards, setTotalRewards] = useState('0');
  
  // Historique des opérations quotidiennes
  const [dailyHistory, setDailyHistory] = useState([]);

  // Charger les données depuis le localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('dailyStakingHistoryV3');
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
    localStorage.setItem('dailyStakingHistoryV3', JSON.stringify(updatedHistory));
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

  // Étape 2: Récupérer les positions V3 non stakées disponibles
  const fetchAvailablePositions = async () => {
  if (!window.ethereum) return;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Vérifier si l'utilisateur est connecté
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      console.log("Wallet non connecté");
      setAvailablePositions([]);
      return;
    }
    
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    try {
      // Contrat de gestion des positions NFT
      const positionManager = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        provider
      );
      
      // Récupérer le nombre de positions NFT avec try/catch
      let balance;
      try {
        balance = await positionManager.balanceOf(userAddress);
        console.log(`L'utilisateur possède ${balance.toString()} positions NFT`);
      } catch (error) {
        console.log("Erreur lors de la récupération du nombre de positions:", error.message);
        setAvailablePositions([]);
        return;
      }
      
      if (balance > 0) {
        const positions = [];
        
        // Récupérer chaque position
        for (let i = 0; i < balance; i++) {
          try {
            // Récupérer le tokenId de la position
            const tokenId = await positionManager.tokenOfOwnerByIndex(userAddress, i);
            console.log(`Position #${i+1} - Token ID: ${tokenId.toString()}`);
            
            // Récupérer les détails de la position
            const positionInfo = await positionManager.positions(tokenId);
            
            // Vérifier si la position a de la liquidité
            if (positionInfo.liquidity > 0) {
              // Récupérer les adresses des tokens
              const token0 = positionInfo.token0;
              const token1 = positionInfo.token1;
              
              // Pour simplifier, on utilise des tokens connus
              const token0Symbol = token0.toLowerCase() === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase() ? 'CAKE' : 
                                token0.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ? 'BNB' : 
                                token0.substring(0, 6);
              
              const token1Symbol = token1.toLowerCase() === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase() ? 'CAKE' : 
                                token1.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ? 'BNB' : 
                                token1.substring(0, 6);
              
              positions.push({
                tokenId: tokenId.toString(),
                pairName: `${token0Symbol}-${token1Symbol}`,
                fee: (positionInfo.fee / 10000) + '%',
                liquidity: ethers.formatEther(positionInfo.liquidity),
                tickLower: positionInfo.tickLower,
                tickUpper: positionInfo.tickUpper
              });
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération de la position ${i}:`, error);
          }
        }
        
        setAvailablePositions(positions);
      } else {
        setAvailablePositions([]);
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du contrat:", error);
      setAvailablePositions([]);
    }
  } catch (error) {
    console.error('Erreur globale:', error);
    setAvailablePositions([]);
  }
};

  // Étape 3: Staker une position sur MasterChef V3
  const stakePosition = async (tokenId) => {
    if (!tokenId || !window.ethereum) {
        console.log("MetaMask non détecté");
      toast.error('Sélectionnez une position à staker');
      return;
    }

    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
    console.log("Wallet non connecté");
    return;
    }
      
      console.log(`Staking de la position ${tokenId}...`);
      
      // 1. Approuver le MasterChef pour utiliser la position NFT
      const positionManager = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        signer
      );
      
      console.log(`Approbation pour le MasterChef V3: ${PANCAKE_V3_CONTRACTS.MASTERCHEF_V3}...`);
      const approveTx = await positionManager.approve(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        tokenId
      );
      
      toast.info('Approbation en cours...');
      await approveTx.wait();
      console.log('Approbation réussie');
      
      // 2. Staker la position NFT dans le MasterChef V3
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        signer
      );
      
      console.log(`Staking de la position ${tokenId}...`);
      const stakeTx = await masterChefV3.deposit(tokenId);
      
      toast.info('Staking en cours...');
      await stakeTx.wait();
      console.log('Staking réussi');
      
      // Trouver la position stakée dans les available positions
      const stakedPosition = availablePositions.find(pos => pos.tokenId === tokenId);
      
      // Enregistrer l'opération
      const operation = {
        date: new Date().toISOString(),
        deposits: dailyDeposits,
        positionId: tokenId,
        pair: stakedPosition ? stakedPosition.pairName : 'Position V3',
        status: 'staked'
      };
      
      saveHistory(operation);
      
      toast.success('Position stakée avec succès!');
      
      // Rafraîchir les positions
      await fetchAvailablePositions();
      await fetchStakedPositions();
      
      // Réinitialiser
      setSelectedPositionId('');
      
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error('Erreur lors du staking: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Récupérer les positions stakées
  const fetchStakedPositions = async () => {
  if (!window.ethereum) return;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Vérifier si l'utilisateur est connecté
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      console.log("Wallet non connecté");
      setStakedPositions([]);
      setTotalRewards('0');
      return;
    }
    
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    try {
      // Contrat MasterChef V3
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        provider
      );
      
      // Vérifier si la méthode tokenIdsOf existe
      if (typeof masterChefV3.tokenIdsOf !== 'function') {
        console.error("La méthode tokenIdsOf n'existe pas sur le contrat MasterChef V3");
        setStakedPositions([]);
        setTotalRewards('0');
        return;
      }
      
      // Récupérer les tokenIds des positions stakées avec try/catch
      let stakedTokenIds;
      try {
        stakedTokenIds = await masterChefV3.tokenIdsOf(userAddress);
        console.log(`L'utilisateur a ${stakedTokenIds.length} positions stakées`);
      } catch (error) {
        console.log("Erreur lors de la récupération des positions stakées:", error.message);
        setStakedPositions([]);
        setTotalRewards('0');
        return;
      }
      
      if (stakedTokenIds && stakedTokenIds.length > 0) {
        const positionManager = new ethers.Contract(
          PANCAKE_V3_CONTRACTS.POSITION_MANAGER,
          POSITION_MANAGER_ABI,
          provider
        );
        
        const positions = [];
        let totalPendingRewards = 0;
        
        // Récupérer les détails de chaque position stakée
        for (let i = 0; i < stakedTokenIds.length; i++) {
          try {
            const tokenId = stakedTokenIds[i];
            console.log(`Position stakée #${i+1} - Token ID: ${tokenId.toString()}`);
            
            // Récupérer les détails de la position
            const positionInfo = await positionManager.positions(tokenId);
            
            // Récupérer les récompenses en attente
            const pendingCake = await masterChefV3.pendingCake(tokenId);
            const formattedPendingCake = ethers.formatEther(pendingCake);
            totalPendingRewards += parseFloat(formattedPendingCake);
            
            // Récupérer les adresses des tokens
            const token0 = positionInfo.token0;
            const token1 = positionInfo.token1;
            
            // Pour simplifier, on utilise des tokens connus
            const token0Symbol = token0.toLowerCase() === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase() ? 'CAKE' : 
                              token0.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ? 'BNB' : 
                              token0.substring(0, 6);
            
            const token1Symbol = token1.toLowerCase() === PANCAKE_V3_CONTRACTS.CAKE.toLowerCase() ? 'CAKE' : 
                              token1.toLowerCase() === PANCAKE_V3_CONTRACTS.WBNB.toLowerCase() ? 'BNB' : 
                              token1.substring(0, 6);
            
            positions.push({
              tokenId: tokenId.toString(),
              pairName: `${token0Symbol}-${token1Symbol}`,
              fee: (positionInfo.fee / 10000) + '%',
              liquidity: ethers.formatEther(positionInfo.liquidity),
              pendingCake: formattedPendingCake
            });
          } catch (error) {
            console.error(`Erreur lors de la récupération de la position stakée ${i}:`, error);
          }
        }
        
        setStakedPositions(positions);
        setTotalRewards(totalPendingRewards.toFixed(4));
        
      } else {
        setStakedPositions([]);
        setTotalRewards('0');
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du contrat:", error);
      setStakedPositions([]);
      setTotalRewards('0');
    }
  } catch (error) {
    console.error('Erreur globale:', error);
    setStakedPositions([]);
    setTotalRewards('0');
  }
};

  // Fonction pour retirer (unstake) une position
  const unstakePosition = async (tokenId) => {
    if (!tokenId || !window.ethereum) {
        console.log("MetaMask non détecté");
      toast.error('ID de position invalide');
      return;
    }
    
    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
        console.log("Wallet non connecté");
    return;
    }
      
      // Contrat MasterChef V3
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        signer
      );
      
      console.log(`Unstaking de la position ${tokenId}...`);
      const tx = await masterChefV3.withdraw(tokenId, userAddress);
      
      toast.info('Unstaking en cours...');
      await tx.wait();
      console.log('Unstaking réussi');
      
      // Trouver la position dans stakedPositions
      const unstackedPosition = stakedPositions.find(pos => pos.tokenId === tokenId);
      
      // Enregistrer l'opération
      const operation = {
        date: new Date().toISOString(),
        positionId: tokenId,
        pair: unstackedPosition ? unstackedPosition.pairName : 'Position V3',
        status: 'unstaked'
      };
      
      saveHistory(operation);
      
      toast.success('Position unstakée avec succès!');
      
      // Rafraîchir les positions
      await fetchAvailablePositions();
      await fetchStakedPositions();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du unstaking: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Réclamer les récompenses
  const harvestRewards = async (tokenId) => {
    if (!tokenId || !window.ethereum) {
        console.log("MetaMask non détecté");
      toast.error('ID de position invalide');
      return;
    }
    
    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
        console.log("Wallet non connecté");
    return;
    }
      
      // Contrat MasterChef V3
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        signer
      );
      
      console.log(`Récolte des récompenses pour la position ${tokenId}...`);
      const tx = await masterChefV3.harvest(tokenId, userAddress);
      
      toast.info('Récolte en cours...');
      await tx.wait();
      console.log('Récolte réussie');
      
      toast.success('Récompenses récoltées avec succès!');
      
      // Rafraîchir les positions
      await fetchStakedPositions();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récolte: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Récolter toutes les récompenses
  const harvestAll = async () => {
    if (stakedPositions.length === 0 || !window.ethereum) {
        console.log("MetaMask non détecté");
      toast.error('Aucune position stakée');
      return;
    }
    
    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
    console.log("Wallet non connecté");
    return;
    }
      
      // Contrat MasterChef V3
      const masterChefV3 = new ethers.Contract(
        PANCAKE_V3_CONTRACTS.MASTERCHEF_V3,
        MASTERCHEF_V3_ABI,
        signer
      );
      
      // Récolter les récompenses pour chaque position
      for (const position of stakedPositions) {
        if (parseFloat(position.pendingCake) > 0) {
          console.log(`Récolte des récompenses pour la position ${position.tokenId}...`);
          const tx = await masterChefV3.harvest(position.tokenId, userAddress);
          await tx.wait();
          console.log(`Récolte réussie pour la position ${position.tokenId}`);
        }
      }
      
      toast.success('Toutes les récompenses ont été récoltées');
      
      // Rafraîchir les positions
      await fetchStakedPositions();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récolte: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Charger les positions au démarrage
  useEffect(() => {
  // Vérifier si l'utilisateur est connecté avant de charger les positions
  const checkConnectionAndLoadPositions = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          // L'utilisateur est connecté, on charge les positions
          await fetchAvailablePositions();
          await fetchStakedPositions();
        } else {
          console.log("Wallet non connecté, skip du chargement des positions");
          setAvailablePositions([]);
          setStakedPositions([]);
          setTotalRewards('0');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion:", error);
      }
    }
  };
  
  checkConnectionAndLoadPositions();
  
  // Rafraîchir les positions toutes les minutes seulement si l'utilisateur est connecté
  const interval = setInterval(async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        await fetchStakedPositions();
      }
    }
  }, 60000);
  
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
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" /> Workflow du Jour (V3)
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

          {/* Étape 2: Sélectionner la position V3 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium mb-2">2. Sélectionner une position V3</h3>
            <div className="space-y-3">
              {availablePositions.length === 0 ? (
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-yellow-700">
                    Aucune position V3 disponible dans votre wallet.
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Créez d'abord une position sur{' '}
                    <a 
                      href="https://pancakeswap.finance/liquidity" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center inline-flex"
                    >
                      PancakeSwap V3 <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedPositionId}
                    onChange={(e) => setSelectedPositionId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Sélectionner une position</option>
                    {availablePositions.map(position => (
                      <option key={position.tokenId} value={position.tokenId}>
                        #{position.tokenId} - {position.pairName} ({position.fee})
                      </option>
                    ))}
                  </select>
                  
                  {selectedPositionId && (
                    <div className="bg-purple-50 p-3 rounded">
                      {availablePositions
                        .filter(p => p.tokenId === selectedPositionId)
                        .map(position => (
                          <div key={position.tokenId}>
                            <p className="font-medium">Position #{position.tokenId}</p>
                            <p className="text-sm text-purple-700">
                              Paire: {position.pairName} - Frais: {position.fee}
                            </p>
                            <p className="text-sm text-purple-700">
                              Liquidité: {parseFloat(position.liquidity).toFixed(6)}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Étape 3: Staker sur PancakeSwap V3 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium mb-2">3. Staker sur PancakeSwap V3</h3>
            <button
              onClick={() => stakePosition(selectedPositionId)}
              disabled={!selectedPositionId || isProcessing || availablePositions.length === 0}
              className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? 'Traitement...' : 'Staker la position V3'}
            </button>
          </div>
        </div>
      </div>

      {/* Positions V3 stakées */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <TrendingUp className="mr-2" /> Positions V3 Stakées
          </h2>
          <button
            onClick={harvestAll}
            disabled={isProcessing || stakedPositions.length === 0 || parseFloat(totalRewards) === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Réclamer tout ({totalRewards} CAKE)
          </button>
        </div>
        
        {stakedPositions.length === 0 ? (
          <p className="text-gray-500">Aucune position V3 stakée</p>
        ) : (
          <div className="space-y-3">
            {stakedPositions.map(position => (
              <div key={position.tokenId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">#{position.tokenId} - {position.pairName}</h4>
                    <p className="text-sm text-gray-600">
                      Liquidité: {parseFloat(position.liquidity).toFixed(6)} - Frais: {position.fee}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-semibold text-green-600">
                      {parseFloat(position.pendingCake).toFixed(4)} CAKE
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => harvestRewards(position.tokenId)}
                        disabled={isProcessing || parseFloat(position.pendingCake) <= 0}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Récolter
                      </button>
                      <button
                        onClick={() => unstakePosition(position.tokenId)}
                        disabled={isProcessing}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Unstake
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
        <h2 className="text-lg font-semibold mb-4">Historique des Opérations V3</h2>
        {dailyHistory.length === 0 ? (
          <p className="text-gray-500">Aucune opération enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Position ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Paire</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyHistory.slice(-10).reverse().map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm">#{entry.positionId}</td>
                    <td className="px-4 py-2 text-sm">{entry.pair}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === 'staked' 
                          ? 'bg-green-100 text-green-800'
                         : 'bg-red-100 text-red-800'
                     }`}>
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
     
     {/* Informations sur V3 */}
     <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
       <h3 className="font-medium text-blue-800 mb-2">À propos de PancakeSwap V3</h3>
       <p className="text-sm text-blue-700 mb-2">
         PancakeSwap V3 utilise un modèle de liquidité concentrée où:
       </p>
       <ul className="list-disc pl-5 text-sm text-blue-600 space-y-1 mb-2">
         <li>Les positions sont des tokens NFT non-fongibles (contrairement aux LP tokens V2)</li>
         <li>Chaque position a une fourchette de prix spécifique qui définit où la liquidité est active</li>
         <li>Vous pouvez créer plusieurs positions avec différentes fourchettes</li>
         <li>L'efficacité du capital peut être jusqu'à 4000 fois supérieure à V2</li>
       </ul>
       <p className="text-sm text-blue-700">
         <a 
           href="https://pancakeswap.finance/liquidity" 
           target="_blank"
           rel="noopener noreferrer"
           className="flex items-center text-blue-800 font-medium hover:underline inline-flex"
         >
           Créer une position V3 sur PancakeSwap <ExternalLink className="h-3 w-3 ml-1" />
         </a>
       </p>
     </div>
   </div>
 );
}