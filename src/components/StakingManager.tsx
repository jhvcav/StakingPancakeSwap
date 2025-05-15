// components/StakingManager.tsx
import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { ERC20_ABI, STAKING_PANCAKESWAP_ABI, STAKING_PANCAKESWAP_ADDRESS } from '../config/contracts';
import { toast } from 'react-hot-toast';

interface StakingManagerProps {
  poolId: number;
  lpTokenAddress: string;
  onSuccess?: () => void;
}

export function StakingManager({ poolId, lpTokenAddress, onSuccess }: StakingManagerProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  
  // Charger balance et allowance
  useEffect(() => {
    if (!address || !walletClient || !lpTokenAddress) return;
    
    const loadData = async () => {
      try {
        // Attendre un peu pour s'assurer que tout est prêt
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("=== DEBUG LoadData ===");
        console.log("Address:", address);
        console.log("LP Token Address:", lpTokenAddress);
        
        // Convertir walletClient en provider ethers v6
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const lpContract = new Contract(lpTokenAddress, ERC20_ABI, signer);
        
        // Balance
        const userBalance = await lpContract.balanceOf(address);
        console.log("User Balance (raw):", userBalance.toString());
        console.log("User Balance (formatted):", ethers.formatEther(userBalance));
        
        setBalance(ethers.formatEther(userBalance));
        
        // Allowance
        const currentAllowance = await lpContract.allowance(address, STAKING_PANCAKESWAP_ADDRESS);
        console.log("Current Allowance:", ethers.formatEther(currentAllowance));
        setAllowance(ethers.formatEther(currentAllowance));
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    
    loadData();
  }, [address, walletClient, lpTokenAddress]);
  
  // Vérifier si l'approbation est nécessaire
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const amountWei = ethers.parseEther(amount);
      const allowanceWei = ethers.parseEther(allowance);
      setNeedsApproval(amountWei > allowanceWei);
    } else {
      setNeedsApproval(false);
    }
  }, [amount, allowance]);
  
  // Fonction d'approbation
  const handleApprove = async () => {
    if (!walletClient || !lpTokenAddress) return;
    
    setIsApproving(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const lpContract = new Contract(lpTokenAddress, ERC20_ABI, signer);
      
      // Approuver le montant maximum
      const tx = await lpContract.approve(
        STAKING_PANCAKESWAP_ADDRESS,
        ethers.MaxUint256
      );
      
      toast('Transaction d\'approbation envoyée...');
      await tx.wait();
      
      toast.success('Approbation réussie !');
      
      // Recharger l'allowance
      const newAllowance = await lpContract.allowance(address, STAKING_PANCAKESWAP_ADDRESS);
      setAllowance(ethers.formatEther(newAllowance));
      setNeedsApproval(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setIsApproving(false);
    }
  };
  
  // Fonction de staking
  const handleStake = async () => {
    if (!walletClient || !amount || parseFloat(amount) <= 0) return;
    
    setIsStaking(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const stakingContract = new Contract(
        STAKING_PANCAKESWAP_ADDRESS,
        STAKING_PANCAKESWAP_ABI,
        signer
      );
      
      const amountWei = ethers.parseEther(amount);
      
      // Vérifier une dernière fois l'allowance
      const lpContract = new Contract(lpTokenAddress, ERC20_ABI, signer);
      const currentAllowance = await lpContract.allowance(address, STAKING_PANCAKESWAP_ADDRESS);
      
      if (amountWei > currentAllowance) {
        toast.error('Veuillez d\'abord approuver le montant');
        setNeedsApproval(true);
        return;
      }
      
      // Effectuer le dépôt
      const tx = await stakingContract.deposit(poolId, amountWei);
      
      toast('Transaction de staking envoyée...');
      await tx.wait();
      
      toast.success('Staking réussi !');
      
      // Réinitialiser le formulaire
      setAmount('');
      
      // Callback de succès
      if (onSuccess) {
        onSuccess();
      }
      
      // Recharger la balance
      const newBalance = await lpContract.balanceOf(address);
      setBalance(ethers.formatEther(newBalance));
      
    } catch (error) {
      console.error('Erreur lors du staking:', error);
      
      // Analyser l'erreur
      if (error.message.includes('ds-math-sub-underflow')) {
        toast.error('Erreur: Vérifiez votre balance et l\'approbation');
      } else {
        toast.error('Erreur lors du staking');
      }
    } finally {
      setIsStaking(false);
    }
  };
  
  // Fonction pour définir le montant maximum
  const handleSetMax = () => {
    setAmount(balance);
  };
  
  return (
    <div className="space-y-4">
      {/* Affichage de la balance */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Balance LP disponible</p>
        <p className="text-xl font-semibold">{parseFloat(balance).toFixed(6)} LP</p>
      </div>
      
      {/* Input du montant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Montant à staker
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isApproving || isStaking}
          />
          <button
            onClick={handleSetMax}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={isApproving || isStaking}
          >
            MAX
          </button>
        </div>
      </div>
      
      {/* Affichage de l'état d'approbation */}
      {needsApproval && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            Vous devez d'abord approuver le contrat de staking pour utiliser vos LP tokens.
          </p>
        </div>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>Pool ID: {poolId}</p>
          <p>LP Token: {lpTokenAddress.slice(0, 10)}...{lpTokenAddress.slice(-8)}</p>
          <p>Allowance: {allowance} LP</p>
          <p>Needs Approval: {needsApproval.toString()}</p>
        </div>
      )}
      
      {/* Boutons d'action */}
      <div className="flex space-x-4">
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || !amount || parseFloat(amount) <= 0}
            className={`flex-1 py-3 px-4 rounded-lg font-medium ${
              isApproving || !amount || parseFloat(amount) <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isApproving ? 'Approbation en cours...' : 'Approuver'}
          </button>
        ) : (
          <button
            onClick={handleStake}
            disabled={isStaking || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium ${
              isStaking || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isStaking ? 'Staking en cours...' : 'Staker'}
          </button>
        )}
      </div>
      
      {/* Messages d'erreur */}
      {amount && parseFloat(amount) > parseFloat(balance) && (
        <p className="text-red-500 text-sm">Montant supérieur à votre balance</p>
      )}
    </div>
  );
}