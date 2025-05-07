import React, { useState } from 'react';
import { useContractWrite, useContractRead } from 'wagmi';
import { parseEther } from 'viem';

interface UnstakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: number;
  poolName: string;
  stakedAmount: string;
}

export function UnstakeModal({ isOpen, onClose, poolId, poolName, stakedAmount }: UnstakeModalProps) {
  const [amount, setAmount] = useState('');

  const { write: unstake, isLoading } = useContractWrite({
    address: '0x...',
    abi: [],
    functionName: 'withdraw',
  });

  if (!isOpen) return null;

  const handleUnstake = () => {
    if (!amount) return;
    
    unstake({
      args: [poolId, parseEther(amount)],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Retirer de {poolName}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Montant à retirer (Maximum: {stakedAmount})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0.0"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleUnstake}
              disabled={isLoading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? 'Transaction en cours...' : 'Confirmer'}
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