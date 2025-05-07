import React from 'react';
import { useContractWrite } from 'wagmi';

interface ClaimRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: number;
  poolName: string;
  pendingRewards: string;
}

export function ClaimRewardsModal({ isOpen, onClose, poolId, poolName, pendingRewards }: ClaimRewardsModalProps) {
  const { write: claim, isLoading } = useContractWrite({
    address: '0x...',
    abi: [],
    functionName: 'claimReward',
  });

  if (!isOpen) return null;

  const handleClaim = () => {
    claim({
      args: [poolId],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Réclamer les récompenses de {poolName}
        </h3>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600">Récompenses en attente:</p>
            <p className="text-2xl font-bold text-purple-600">{pendingRewards} CAKE</p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? 'Transaction en cours...' : 'Réclamer'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}