import React, { useState } from 'react';
import { usePoolManagement } from '../../hooks/useAdmin';

interface AddPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPoolModal({ isOpen, onClose }: AddPoolModalProps) {
  const [lpToken, setLpToken] = useState('');
  const [allocPoint, setAllocPoint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { addPool, refreshPools } = usePoolManagement();
  
  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Réinitialiser l'état
    setError('');
    setIsSuccess(false);
    setIsSubmitting(true);
    
    // Validation des entrées
    if (!lpToken || !lpToken.startsWith('0x')) {
      setError('Adresse de token LP invalide. Doit commencer par 0x.');
      setIsSubmitting(false);
      return;
    }
    
    if (!allocPoint || isNaN(parseInt(allocPoint)) || parseInt(allocPoint) <= 0) {
      setError('Points d\'allocation invalides. Doit être un nombre positif.');
      setIsSubmitting(false);
      return;
    }

    console.log("Début de la soumission avec lpToken:", lpToken, "allocPoint:", allocPoint);
    
    try {
      const result = await addPool({
        args: [BigInt(allocPoint), lpToken as `0x${string}`, true]
      });
      
      console.log("Pool ajouté avec succès, transaction:", result);
      setIsSuccess(true);
      
      // Rafraîchir les données
      refreshPools();
      
      // Fermer le modal après un court délai
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du pool:', error);
      setError(`Erreur: ${error.message || "Erreur inconnue"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ajouter un Nouveau Pool
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {isSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Pool ajouté avec succès! Actualisation des données...
          </div>
        )}
        
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
              disabled={isSubmitting || isSuccess}
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
              disabled={isSubmitting || isSuccess}
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              className={`flex-1 py-2 px-4 rounded-lg ${
                isSubmitting || isSuccess
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
              disabled={isSubmitting || isSuccess}
            >
              {isSubmitting ? 'Ajout en cours...' : isSuccess ? 'Ajouté !' : 'Ajouter'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              {isSuccess ? 'Fermer' : 'Annuler'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}