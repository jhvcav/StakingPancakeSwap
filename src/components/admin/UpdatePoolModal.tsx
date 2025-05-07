import React, { useState, useEffect } from 'react';
import { usePoolManagement } from '../../hooks/useAdmin';

interface UpdatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: number | null;
}

export function UpdatePoolModal({ isOpen, onClose, poolId }: UpdatePoolModalProps) {
  const [allocPoint, setAllocPoint] = useState('');
  const [isActive, setIsActive] = useState(true);
  const { updatePool } = usePoolManagement();

  if (!isOpen || poolId === null) return null;

  const handleSubmit = async () => {
    try {
      await updatePool({
        args: [BigInt(poolId), BigInt(allocPoint), isActive, true],
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du pool:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Mettre à Jour le Pool #{poolId}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Points d'Allocation
            </label>
            <input
              type="number"
              value={allocPoint}
              onChange={(e) => setAllocPoint(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="100"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Pool Actif
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Mettre à Jour
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}