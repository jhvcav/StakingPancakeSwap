// src/components/LpTokenAdder.tsx
import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'ethers';
import { Plus, X } from 'lucide-react';
import { PANCAKE_ROUTER_ADDRESS, PANCAKE_ROUTER_ABI, ERC20_ABI } from '../config/contracts';
import { recordTransaction } from '../services/transactionService'; // Ajoutez cette importation

export function LpTokenAdder({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [token0, setToken0] = useState('');
  const [token1, setToken1] = useState('');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTxHash, setCurrentTxHash] = useState(null);
  
  // Hooks pour écrire dans le contrat et attendre les transactions
  const writeContract = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: currentTxHash,
  });

  // Fonction pour enregistrer les transactions
  const saveTransaction = async (type, fromToken, fromAmount, toToken, toAmount, txHash, status, gasUsed = '0', gasFee = '0', notes = '') => {
    try {
      await recordTransaction({
        type,
        fromToken,
        fromAmount,
        toToken,
        toAmount,
        gasUsed,
        gasFee,
        txHash,
        status,
        notes
      });
      console.log(`Transaction ${type} enregistrée avec succès`);
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de la transaction ${type}:`, error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!token0 || !token1 || !amount0 || !amount1) {
        throw new Error('Tous les champs sont requis');
      }
      
      if (!token0.startsWith('0x') || token0.length !== 42 || !token1.startsWith('0x') || token1.length !== 42) {
        throw new Error('Adresses de tokens invalides');
      }
      
      // Convertir les montants en BigInt
      const parsedAmount0 = parseUnits(amount0, 18); // Ajustez selon le token
      const parsedAmount1 = parseUnits(amount1, 18); // Ajustez selon le token
      
      // 1. D'abord approuver le routeur pour dépenser le premier token
      try {
        const approveToken0Hash = await writeContract.writeContractAsync({
          address: token0 as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [PANCAKE_ROUTER_ADDRESS, parsedAmount0]
        });
        
        setCurrentTxHash(approveToken0Hash);
        console.log("Approbation du token 0 soumise, hash:", approveToken0Hash);
        
        // Enregistrer la transaction d'approbation
        await saveTransaction(
          'token_approval',
          'ETH', // La transaction est payée en ETH/BNB
          '0', // Montant dépensé en frais (à récupérer après confirmation)
          token0,
          amount0,
          approveToken0Hash,
          'pending'
        );
        
        // Attendre un peu pour que l'approbation soit confirmée
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mettre à jour le statut si la transaction est confirmée
        if (isConfirmed) {
          // Dans un cas réel, vous récupéreriez les frais exacts ici
          await saveTransaction(
            'token_approval',
            'ETH',
            '0.001', // Frais estimés
            token0,
            amount0,
            approveToken0Hash,
            'completed',
            '100000', // gasUsed estimé
            '0.001' // gasFee estimé
          );
        }
      } catch (error) {
        console.error("Erreur lors de l'approbation du token 0:", error);
        
        // Enregistrer l'échec de la transaction
        if (error.transactionHash) {
          await saveTransaction(
            'token_approval',
            'ETH',
            '0',
            token0,
            amount0,
            error.transactionHash,
            'failed',
            '0',
            '0',
            error.message
          );
        }
        
        throw new Error(`Échec de l'approbation du premier token: ${error.message}`);
      }
      
      // 2. Ensuite approuver le routeur pour dépenser le deuxième token
      try {
        const approveToken1Hash = await writeContract.writeContractAsync({
          address: token1 as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [PANCAKE_ROUTER_ADDRESS, parsedAmount1]
        });
        
        setCurrentTxHash(approveToken1Hash);
        console.log("Approbation du token 1 soumise, hash:", approveToken1Hash);
        
        // Enregistrer la transaction d'approbation
        await saveTransaction(
          'token_approval',
          'ETH',
          '0',
          token1,
          amount1,
          approveToken1Hash,
          'pending'
        );
        
        // Attendre un peu pour que l'approbation soit confirmée
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mettre à jour le statut si la transaction est confirmée
        if (isConfirmed) {
          await saveTransaction(
            'token_approval',
            'ETH',
            '0.001',
            token1,
            amount1,
            approveToken1Hash,
            'completed',
            '100000',
            '0.001'
          );
        }
      } catch (error) {
        console.error("Erreur lors de l'approbation du token 1:", error);
        
        // Enregistrer l'échec de la transaction
        if (error.transactionHash) {
          await saveTransaction(
            'token_approval',
            'ETH',
            '0',
            token1,
            amount1,
            error.transactionHash,
            'failed',
            '0',
            '0',
            error.message
          );
        }
        
        throw new Error(`Échec de l'approbation du deuxième token: ${error.message}`);
      }
      
      // 3. Ajouter la liquidité
      try {
        const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes
        
        const addLiquidityHash = await writeContract.writeContractAsync({
          address: PANCAKE_ROUTER_ADDRESS,
          abi: PANCAKE_ROUTER_ABI,
          functionName: 'addLiquidity',
          args: [
            token0,
            token1,
            parsedAmount0,
            parsedAmount1,
            parsedAmount0 * BigInt(95) / BigInt(100), // 5% slippage
            parsedAmount1 * BigInt(95) / BigInt(100), // 5% slippage
            window.ethereum.selectedAddress,
            BigInt(deadline)
          ]
        });
        
        setCurrentTxHash(addLiquidityHash);
        console.log("Ajout de liquidité soumis, hash:", addLiquidityHash);
        
        // Enregistrer la transaction de liquidité
        await saveTransaction(
          'liquidity_add',
          `${token0}+${token1}`,
          `${amount0}+${amount1}`,
          'LP Token',
          '0', // Le montant exact de LP token sera connu après confirmation
          addLiquidityHash,
          'pending'
        );
        
        // Attendre un peu pour la confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mettre à jour le statut si la transaction est confirmée
        if (isConfirmed) {
          await saveTransaction(
            'liquidity_add',
            `${token0}+${token1}`,
            `${amount0}+${amount1}`,
            'LP Token',
            '1', // Valeur estimée, idéalement vous récupérez la valeur réelle
            addLiquidityHash,
            'completed',
            '300000', // Estimé
            '0.003' // Estimé
          );
        }
        
        setSuccessMessage('Liquidité ajoutée avec succès!');
        
        // Notifier le parent du succès
        if (onSuccess) onSuccess();
        
        // Réinitialiser le formulaire après un délai
        setTimeout(() => {
          setToken0('');
          setToken1('');
          setAmount0('');
          setAmount1('');
          setIsOpen(false);
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error("Erreur lors de l'ajout de liquidité:", error);
        
        // Enregistrer l'échec de la transaction
        if (error.transactionHash) {
          await saveTransaction(
            'liquidity_add',
            `${token0}+${token1}`,
            `${amount0}+${amount1}`,
            'LP Token',
            '0',
            error.transactionHash,
            'failed',
            '0',
            '0',
            error.message
          );
        }
        
        throw new Error(`Échec de l'ajout de liquidité: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de liquidité:', error);
      setErrorMessage(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Ajouter des Tokens LP</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adresse du Token 1
            </label>
            <input
              type="text"
              value={token0}
              onChange={(e) => setToken0(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0x..."
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Montant du Token 1
            </label>
            <input
              type="text"
              value={amount0}
              onChange={(e) => setAmount0(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0.0"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adresse du Token 2
            </label>
            <input
              type="text"
              value={token1}
              onChange={(e) => setToken1(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0x..."
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Montant du Token 2
            </label>
            <input
              type="text"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="0.0"
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-lg ${
              isSubmitting 
                ? 'bg-purple-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter la Liquidité'}
          </button>
        </form>
      </div>
    </div>
  );
}