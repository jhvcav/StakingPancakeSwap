import React, { useState } from 'react';
import { usePoolManagement } from '../../hooks/useAdmin';

interface AddPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPoolModal({ isOpen, onClose }: AddPoolModalProps) {
  const [lpToken, setLpToken] = useState('');
  const [allocPoint, setAllocPoint] = useState('');
  const { addPool } = usePoolManagement();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      await addPool({
        args: [BigInt(allocPoint), lpToken as `0x${string}`, true],
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du pool:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ajouter un Nouveau Pool
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adresse du Token LP
            </label>
            <input
              type="text"
              value={lpToken}
              onChange={(e) => setLpToken(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0x..."
            />
          </div>

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

          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Ajouter
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