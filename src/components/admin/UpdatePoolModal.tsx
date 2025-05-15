import React, { useState, useEffect } from 'react';
import { usePoolManagement } from '../../hooks/useAdmin';
import { resetStakingPoolsCounter } from '../../hooks/useStakingPools';
import { toast } from 'react-hot-toast';
import { recordTransaction } from '../../services/transactionService';

interface UpdatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: number | null;
  currentPoolInfo?: {
    id?: number;
    lpToken?: string;
    allocPoint?: string;
    lastRewardBlock?: string;
    accRewardPerShare?: string;
    totalStaked?: string;
    isActive?: boolean;
    name?: string;
  };
}

export function UpdatePoolModal({
  isOpen, 
  onClose, 
  poolId, 
  currentPoolInfo,
}: UpdatePoolModalProps) {
  const [allocPoint, setAllocPoint] = useState('');
  const [isActive, setIsActive] = useState(false);
  const { updatePool } = usePoolManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mettre à jour les états quand le pool sélectionné change
  useEffect(() => {
    if (currentPoolInfo) {
      setAllocPoint(currentPoolInfo.allocPoint || '');
      setIsActive(currentPoolInfo.isActive !== false);
    }
  }, [currentPoolInfo, poolId]);

  if (!isOpen || poolId === null) return null;

  const isFormValid = allocPoint !== '';

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // AJOUTER DES LOGS POUR DÉBOGUER
      console.log('=== DÉBUT DE LA MISE À JOUR DU POOL ===');
      console.log('PoolId:', poolId);
      console.log('AllocPoint:', allocPoint);
      console.log('IsActive:', isActive);

      const result = await updatePool({
        args: [BigInt(poolId), BigInt(allocPoint), isActive, true],
      });

      console.log('Résultat de la transaction blockchain:', result);

      // Attendre un peu pour que la transaction soit confirmée
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ENREGISTRER LA TRANSACTION AVANT TOUT RECHARGEMENT
      if (result && result.hash) {
        console.log('Tentative d\'enregistrement de la transaction...');
        
        const transactionData = {
          type: 'pool_update',
          date: new Date(),
          fromToken: 'ADMIN',
          fromAmount: '0',
          toToken: `POOL_${poolId}`,
          toAmount: allocPoint,
          gasFee: '0.00001', // Valeur par défaut
          status: 'completed',
          txHash: result.hash,
          description: `Mise à jour du pool ${poolId} - Points: ${allocPoint}, Actif: ${isActive}`,
          metadata: {
            poolId: poolId.toString(),
            allocPoint: allocPoint,
            isActive: isActive,
            action: 'update',
            poolName: currentPoolInfo?.name || `Pool ${poolId}`,
            previousAllocPoint: currentPoolInfo?.allocPoint || '0',
            previousIsActive: currentPoolInfo?.isActive
          }
        };

        console.log('Données de la transaction à enregistrer:', transactionData);

        try {
          // ATTENDRE que l'enregistrement soit complété
          await recordTransaction(transactionData);
          console.log('Transaction enregistrée avec succès');
          
          // Notification de succès
          toast.success(`Pool ${poolId} mis à jour avec succès`);
          
        } catch (recordError) {
          console.error('ERREUR lors de l\'enregistrement:', recordError);
          toast.error('La mise à jour a réussi mais l\'enregistrement a échoué');
          
          // Stocker dans localStorage comme fallback
          const failedTransactions = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
          failedTransactions.push({
            ...transactionData,
            error: recordError.message,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('failedTransactions', JSON.stringify(failedTransactions));
          console.log('Transaction sauvegardée dans localStorage pour retry ultérieur');
        }
      } else {
        console.error('Pas de hash de transaction disponible');
      }

      // Attendre encore un peu avant de fermer/recharger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Réinitialiser le compteur
      resetStakingPoolsCounter();

      // Fermer le modal
      onClose();
      setIsSubmitting(false);

      // NE PAS RECHARGER AUTOMATIQUEMENT - laissez l'utilisateur décider
      // Si vous voulez recharger, décommentez la ligne suivante mais attendez plus longtemps
      // setTimeout(() => window.location.reload(), 3000);

    } catch (error) {
      console.error('ERREUR lors de la mise à jour du pool:', error);
      toast.error("Échec de la mise à jour du pool");
      setIsSubmitting(false);
    }
  };

  // AJOUTER UN BOUTON POUR VOIR LES LOGS
  const debugButton = process.env.NODE_ENV === 'development' && (
    <button
      type="button"
      onClick={() => {
        console.log('=== DEBUG INFO ===');
        console.log('poolId:', poolId);
        console.log('currentPoolInfo:', currentPoolInfo);
        console.log('allocPoint:', allocPoint);
        console.log('isActive:', isActive);
        console.log('Failed transactions:', localStorage.getItem('failedTransactions'));
        console.log('Pending transactions:', localStorage.getItem('pendingTransactions'));
      }}
      className="text-xs text-gray-500 underline"
    >
      Debug Info
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Mise à jour...' : 'Mettre à Jour'}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
          
          {debugButton}
        </div>
      </div>
    </div>
  );
}