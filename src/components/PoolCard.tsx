import React, { useState } from 'react';
import { CakeIcon, ArrowUpIcon, ArrowDownIcon, GiftIcon } from 'lucide-react';
import { StakeModal } from './StakeModal';
import { UnstakeModal } from './UnstakeModal';
import { ClaimRewardsModal } from './ClaimRewardsModal';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  STAKING_MANAGER_ADDRESS, 
  STAKING_MANAGER_ABI 
} from '../config/contracts';
import { toast } from 'react-hot-toast'; // Vous devrez peut-être installer cette bibliothèque

interface PoolCardProps {
  id: number;
  name: string;
  apr: string;
  totalStaked: string;
  userStaked: string;
  pendingRewards: string;
}

export function PoolCard({ id, name, apr, totalStaked, userStaked, pendingRewards }: PoolCardProps) {
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook pour écrire sur le contrat
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // Hook pour suivre l'état de la transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fonction pour réclamer les récompenses directement
  const handleQuickClaim = async () => {
    try {
      setIsProcessing(true);
      
      await writeContract({
        address: STAKING_MANAGER_ADDRESS,
        abi: STAKING_MANAGER_ABI,
        functionName: 'claimRewards',
        args: [id],
      });
      
      toast.success('Demande de réclamation envoyée!');
    } catch (error) {
      console.error('Erreur lors de la réclamation:', error);
      toast.error('Erreur lors de la réclamation des récompenses');
    } finally {
      setIsProcessing(false);
    }
  };

  // Effet pour afficher un message de succès après la confirmation de la transaction
  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction confirmée!');
    }
  }, [isSuccess]);

  // Formater les nombres pour un affichage plus propre
  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    
    return new Intl.NumberFormat().format(num);
  };

  // Vérifier si l'utilisateur a des tokens stakés
  const hasStake = parseFloat(userStaked) > 0;
  
  // Vérifier si l'utilisateur a des récompenses à réclamer
  const hasRewards = parseFloat(pendingRewards) > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <CakeIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-500">APR: {apr}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Staké</p>
          <p className="font-semibold">{formatNumber(totalStaked)} LP</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Votre Stake</span>
            <span className="font-semibold">{formatNumber(userStaked)} LP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Récompenses</span>
            <span className="font-semibold text-purple-600">{formatNumber(pendingRewards)} CAKE</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setIsStakeModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
            disabled={isPending || isConfirming || isProcessing}
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span>Staker</span>
          </button>
          
          <button
            onClick={() => setIsUnstakeModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={!hasStake || isPending || isConfirming || isProcessing}
          >
            <ArrowDownIcon className="h-4 w-4" />
            <span>Retirer</span>
          </button>
          
          <button
            onClick={hasRewards ? () => setIsClaimModalOpen(true) : undefined}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
              hasRewards 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
            disabled={!hasRewards || isPending || isConfirming || isProcessing}
          >
            <GiftIcon className="h-4 w-4" />
            <span>Réclamer</span>
          </button>
        </div>
      </div>

      {/* Afficher un message si une transaction est en cours */}
      {(isPending || isConfirming) && (
        <div className="mt-4 text-center text-sm text-amber-600">
          {isPending ? 'Transaction en cours d\'envoi...' : 'Transaction en cours de confirmation...'}
        </div>
      )}

      {/* Afficher un message si la transaction est réussie */}
      {isSuccess && (
        <div className="mt-4 text-center text-sm text-green-600">
          Transaction confirmée! ✓
        </div>
      )}

      <StakeModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        poolId={id}
        poolName={name}
        stakingAddress={STAKING_MANAGER_ADDRESS}
        stakingAbi={STAKING_MANAGER_ABI}
      />
      
      <UnstakeModal
        isOpen={isUnstakeModalOpen}
        onClose={() => setIsUnstakeModalOpen(false)}
        poolId={id}
        poolName={name}
        stakedAmount={userStaked}
        stakingAddress={STAKING_MANAGER_ADDRESS}
        stakingAbi={STAKING_MANAGER_ABI}
      />
      
      <ClaimRewardsModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        poolId={id}
        poolName={name}
        pendingRewards={pendingRewards}
        stakingAddress={STAKING_MANAGER_ADDRESS}
        stakingAbi={STAKING_MANAGER_ABI}
      />
    </div>
  );
}