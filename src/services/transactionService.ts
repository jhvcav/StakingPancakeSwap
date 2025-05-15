import axios from 'axios';

// Définir l'URL de base pour les requêtes API
// Remplacez par l'URL de GitHub Codespaces pour votre API
// const API_BASE_URL = 'https://probable-spork-r445p9g9w4pr2prw6-5000.app.github.dev/api';
const API_BASE_URL = '/api'; // Cela utilisera automatiquement l'URL de votre site

export async function recordTransaction(transaction) {
  try {
    console.log('Enregistrement d\'une transaction:', transaction);

    // S'assurer que toutes les données nécessaires sont présentes
    const transactionData = {
      type: transaction.type,
      date: transaction.date || new Date(),
      fromToken: transaction.fromToken || '',
      fromAmount: transaction.fromAmount || '0',
      toToken: transaction.toToken || '',
      toAmount: transaction.toAmount || '0',
      gasFee: transaction.gasFee || '0',
      status: transaction.status || 'completed',
      txHash: transaction.txHash || '',
      description: transaction.description || '',
      metadata: transaction.metadata || {}
    };

    const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData);
    console.log('Transaction enregistrée avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la transaction:', error);
    
    // Fallback vers localStorage
    try {
      const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
      pendingTransactions.push({
        ...transaction,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      });
      localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
      console.log('Transaction stockée localement en attendant la synchronisation');
    } catch (localError) {
      console.error('Erreur lors du stockage local:', localError);
    }
    
    throw error;
  }
}

export async function getTransactions(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    const url = `${API_BASE_URL}/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Récupération des transactions depuis:', url);
    
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return [];
  }
}

export async function getTransactionSummary() {
  try {
    const response = await axios.get(`${API_BASE_URL}/transactions/summary`);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des transactions:', error);
    return {
      totalConversionFees: '0',
      totalLiquidityFees: '0',
      totalStakingFees: '0',
      totalFees: '0',
      totalValueManaged: '0',
      feesAsPercentage: '0'
    };
  }
}

// Fonction pour récupérer les transactions en attente du localStorage
export function getPendingTransactions() {
  try {
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    return pendingTransactions.map((tx, index) => ({
      ...tx,
      id: `pending-${index}`,
      date: tx.timestamp || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions en attente:', error);
    return [];
  }
}

// Fonction pour synchroniser les transactions en attente
export async function syncPendingTransactions() {
  try {
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    if (pendingTransactions.length === 0) return 0;
    
    let successCount = 0;
    
    for (let i = pendingTransactions.length - 1; i >= 0; i--) {
      try {
        await axios.post(`${API_BASE_URL}/transactions`, pendingTransactions[i]);
        pendingTransactions.splice(i, 1); // Supprimer après succès
        successCount++;
      } catch (error) {
        console.error(`Échec de la synchronisation de la transaction:`, error);
        pendingTransactions[i].syncRetries = (pendingTransactions[i].syncRetries || 0) + 1;
      }
    }
    
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
    return successCount;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des transactions:', error);
    return 0;
  }
}