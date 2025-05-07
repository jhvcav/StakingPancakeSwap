import React, { useState } from 'react';
import { useEmergencyActions } from '../../hooks/useAdmin';

interface EmergencyActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyActionsModal({ isOpen, onClose }: EmergencyActionsModalProps) {
  const [poolId, setPoolId] = useState('');
  const { emergencyWithdraw, pausePool } = useEmergencyActions();

  if (!isOpen) return null;

  const handleEmergencyWithdraw = async () => {
    try {
      await emergencyWithdraw({
        args: [BigInt(poolId)],
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors du retrait d\'urgence:', error);
    }
  };

  const handlePausePool = async () => {
    try {
      await pausePool({
        args: [BigInt(poolId)],
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise en pause du pool:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-red-600 mb-4">
          Actions d'Urgence
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ID du Pool
            </label>
            <input
              type="number"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="0"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={handleEmergencyWithdraw}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              Retrait d'Urgence
            </button>
            <button
              onClick={handlePausePool}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
            >
              Mettre en Pause le Pool
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}