import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { DollarSign, Download, RefreshCw } from 'lucide-react';
import { STAKING_PANCAKESWAP_ADDRESS, STAKING_PANCAKESWAP_ABI } from '../../config/contracts';

const WALLET_RECOMPENSES = '0x6Cf9fA1738C0c2AE386EF8a75025B53DEa95407a';

export function RewardsManager() {
  const [claimedRewards, setClaimedRewards] = useState('0');
  const [pendingWithdrawal, setPendingWithdrawal] = useState('0');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cakePrice, setCakePrice] = useState(3.5); // Prix par défaut

  // Fonction pour récupérer le prix actuel du CAKE
  useEffect(() => {
    const fetchCakePrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pancakeswap-token&vs_currencies=usd');
        const data = await response.json();
        if (data['pancakeswap-token']?.usd) {
          setCakePrice(data['pancakeswap-token'].usd);
        }
      } catch (error) {
        console.error('Erreur prix CAKE:', error);
      }
    };
    fetchCakePrice();
  }, []);

  // Fonction pour récupérer les informations sur les récompenses
  const fetchRewardsInfo = async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        STAKING_PANCAKESWAP_ADDRESS,
        STAKING_PANCAKESWAP_ABI,
        signer
      );

      // Récupérer le nombre total de pools
      const poolCount = await contract.poolLength();
      let totalClaimedRewards = ethers.getBigInt(0);
      let totalPendingInContract = ethers.getBigInt(0);

      // Pour chaque pool, vérifier les récompenses
      for (let i = 0; i < poolCount; i++) {
        try {
          // Récupérer les infos utilisateur pour chaque pool
          const userInfo = await contract.userInfo(i, await signer.getAddress());
          
          // Les récompenses réclamées sont généralement stockées dans rewardDebt
          if (userInfo.rewardDebt) {
            totalClaimedRewards += userInfo.rewardDebt;
          }
          
          // Les récompenses en attente dans le contrat (après claimReward)
          if (userInfo.pendingRewards && userInfo.pendingRewards > 0) {
            totalPendingInContract += userInfo.pendingRewards;
          }
        } catch (error) {
          console.error(`Erreur pool ${i}:`, error);
        }
      }

      // Vérifier aussi la balance de CAKE du contrat
      const cakeTokenAddress = await contract.rewardToken();
      const cakeContract = new ethers.Contract(
        cakeTokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      const contractBalance = await cakeContract.balanceOf(STAKING_PANCAKESWAP_ADDRESS);
      console.log('Balance CAKE du contrat:', ethers.formatEther(contractBalance));

      setClaimedRewards(ethers.formatEther(totalClaimedRewards));
      setPendingWithdrawal(ethers.formatEther(totalPendingInContract));
      
    } catch (error) {
      console.error('Erreur récupération infos récompenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    fetchRewardsInfo();
    // Rafraîchir toutes les minutes
    const interval = setInterval(fetchRewardsInfo, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour retirer les récompenses vers le wallet dédié
  const handleWithdrawToRewardsWallet = async () => {
    setIsWithdrawing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        STAKING_PANCAKESWAP_ADDRESS,
        STAKING_PANCAKESWAP_ABI,
        signer
      );

      // Récupérer l'adresse du token CAKE
      const cakeTokenAddress = await contract.rewardToken();
      console.log('Token CAKE:', cakeTokenAddress);

      // Options possibles selon votre contrat :
      
      // Option 1: S'il y a une fonction pour retirer les récompenses
      try {
        const tx = await contract.withdrawRewards(WALLET_RECOMPENSES);
        await tx.wait();
        toast.success('Récompenses retirées vers le wallet dédié!');
      } catch (e1) {
        console.log('Pas de fonction withdrawRewards, essai option 2');
        
        // Option 2: Si c'est le owner qui peut récupérer
        try {
          const tx = await contract.recoverToken(cakeTokenAddress);
          await tx.wait();
          
          // Puis transférer vers le wallet dédié
          const cakeContract = new ethers.Contract(
            cakeTokenAddress,
            ['function transfer(address to, uint256 amount) returns (bool)'],
            signer
          );
          
          const balance = await cakeContract.balanceOf(await signer.getAddress());
          if (balance > 0) {
            const transferTx = await cakeContract.transfer(WALLET_RECOMPENSES, balance);
            await transferTx.wait();
          }
          
          toast.success('Récompenses récupérées et transférées!');
        } catch (e2) {
          console.error('Erreur option 2:', e2);
          toast.error('Erreur lors du retrait. Vérifiez la fonction du contrat.');
        }
      }

      // Rafraîchir les données
      await fetchRewardsInfo();
      
    } catch (error) {
      console.error('Erreur retrait:', error);
      toast.error('Erreur lors du retrait des récompenses');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Gestion des Récompenses CAKE</h2>
        <button
          onClick={fetchRewardsInfo}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Récompenses réclamées */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-sm font-medium text-purple-900">Récompenses Réclamées</h3>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {parseFloat(claimedRewards).toFixed(4)} CAKE
          </p>
          <p className="text-sm text-purple-700 mt-1">
            ≈ ${(parseFloat(claimedRewards) * cakePrice).toFixed(2)} USD
          </p>
        </div>

        {/* Récompenses en attente de retrait */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Download className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-sm font-medium text-orange-900">En Attente de Retrait</h3>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {parseFloat(pendingWithdrawal).toFixed(4)} CAKE
          </p>
          <p className="text-sm text-orange-700 mt-1">
            ≈ ${(parseFloat(pendingWithdrawal) * cakePrice).toFixed(2)} USD
          </p>
        </div>
      </div>

      {/* Wallet de destination */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">Wallet de récompenses :</p>
        <code className="text-xs text-gray-800 bg-gray-200 px-2 py-1 rounded">
          {WALLET_RECOMPENSES}
        </code>
      </div>

      {/* Bouton de retrait */}
      <button
        onClick={handleWithdrawToRewardsWallet}
        disabled={isWithdrawing || parseFloat(pendingWithdrawal) <= 0}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isWithdrawing || parseFloat(pendingWithdrawal) <= 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isWithdrawing ? (
          <span className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-5 w-5 mr-2" />
            Retrait en cours...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            Retirer vers le Wallet Récompenses
          </span>
        )}
      </button>

      {/* Note d'information */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Les récompenses sont retirées vers le wallet dédié pour la gestion centralisée.
      </p>
    </div>
  );
}