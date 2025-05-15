// services/transactionService.ts
import axios from 'axios';

export async function recordTransaction(transaction) {
  try {
    console.log('Tentative d\'enregistrement de transaction:', transaction);
    const response = await axios.post('/api/transactions', transaction);
    console.log('Réponse de l\'API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la transaction:', error);
    
    // Stocker dans localStorage en cas d'échec de l'API
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    pendingTransactions.push({
      ...transaction,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending'
    });
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
    
    // Rethrow pour que l'appelant sache qu'il y a eu un problème
    throw error;
  }
}