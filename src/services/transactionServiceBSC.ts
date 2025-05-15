// services/transactionServiceBSC.ts
import axios from 'axios';
import { STAKING_PANCAKESWAP_ADDRESS, PANCAKE_ROUTER_ADDRESS } from '../config/contracts';

const BSCSCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';

// Types de transactions avec les bonnes signatures
const TRANSACTION_TYPES = {
  '0x60803461': 'contract_creation',
  '0x7abceffd': 'addPool',
  '0x64482f79': 'updatePool',
  '0xe2bbb158': 'deposit',
  '0x441a3e70': 'withdraw',
  '0x00e2a039': 'claimReward',
  '0x600e1b31': 'emergencyWithdraw',
};

// Fonction principale pour récupérer les transactions
export async function getTransactionsFromBSC(filters = {}) {
  try {
    const response = await axios.get(BSCSCAN_API_URL, {
      params: {
        module: 'account',
        action: 'txlist',
        address: STAKING_PANCAKESWAP_ADDRESS,
        startblock: filters.startBlock || 0,
        endblock: filters.endBlock || 99999999,
        page: filters.page || 1,
        offset: filters.limit || 50,
        sort: 'desc',
        apikey: BSCSCAN_API_KEY
      }
    });

    if (response.data.status !== '1') {
      console.error('Erreur BSCScan:', response.data.message);
      return [];
    }

    // Transformer les données
    const transactions = response.data.result.map(tx => {
      const methodId = tx.methodId || tx.input.slice(0, 10);
      const transactionType = TRANSACTION_TYPES[methodId] || 'unknown';
      
      return formatTransaction(tx, transactionType, 'staking');
    });

    return transactions;
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return [];
  }
}

// Fonction pour formater les transactions
function formatTransaction(tx, transactionType, category) {
  // Calcul détaillé des frais
  const gasUsed = parseInt(tx.gasUsed);
  const gasPrice = parseInt(tx.gasPrice);
  const gasFeeWei = gasUsed * gasPrice;
  const gasFee = gasFeeWei / 1e18;
  
  // Prix du BNB (vous pouvez récupérer le prix actuel via une API)
  const bnbPriceUSD = 600; // Prix approximatif, à remplacer par un appel API
  const gasFeeUSD = gasFee * bnbPriceUSD;
  
  let description = `${transactionType}`;
  let poolId = null;
  let amount = '0';
  let allocPoint = '0';
  
  // Utiliser functionName si disponible pour la description
  if (tx.functionName) {
    description = tx.functionName;
  }
  
  // Décoder selon le type de transaction
  try {
    if (tx.input.length > 10) {
      const params = tx.input.slice(10);
      
      switch (transactionType) {
        case 'addPool':
          // addPool(uint256 _allocPoint, address _lpToken, bool _withUpdate)
          allocPoint = parseInt(params.slice(0, 64), 16);
          const lpToken = '0x' + params.slice(88, 128);
          description = `Ajout de pool - Points: ${allocPoint}`;
          break;
          
        case 'updatePool':
          // updatePool(uint256 _pid, uint256 _allocPoint, bool _isActive, bool _withUpdate)
          poolId = parseInt(params.slice(0, 64), 16);
          allocPoint = parseInt(params.slice(64, 128), 16);
          const isActive = params.slice(128, 192) === '0'.repeat(63) + '1';
          description = `Mise à jour du pool ${poolId} - Points: ${allocPoint}, Actif: ${isActive}`;
          break;
          
        case 'deposit':
        case 'withdraw':
          poolId = parseInt(params.slice(0, 64), 16);
          amount = (parseInt(params.slice(64, 128), 16) / 1e18).toString();
          description = `${transactionType === 'deposit' ? 'Dépôt' : 'Retrait'} pool ${poolId} - ${amount} tokens`;
          break;
      }
    }
  } catch (e) {
    console.error('Erreur de décodage:', e);
  }
  
  return {
    id: tx.hash,
    type: transactionType,
    date: new Date(parseInt(tx.timeStamp) * 1000),
    fromToken: tx.from,
    fromAmount: (parseInt(tx.value) / 1e18).toString(),
    toToken: poolId ? `POOL_${poolId}` : 'CONTRACT',
    toAmount: amount || allocPoint,
    gasFee: gasFee.toFixed(6),
    gasFeeUSD: gasFeeUSD.toFixed(2),
    gasUsed: gasUsed.toString(),
    gasPrice: (gasPrice / 1e9).toFixed(1) + ' Gwei',
    status: tx.isError === '0' ? 'completed' : 'failed',
    txHash: tx.hash,
    description: description,
    blockNumber: tx.blockNumber,
    from: tx.from,
    to: tx.to || 'Contract Creation',
    category: category,
    metadata: {
      methodId: tx.methodId || tx.input.slice(0, 10),
      functionName: tx.functionName,
      gasPriceWei: gasPrice,
      gasFeeWei: gasFeeWei,
      poolId: poolId,
      allocPoint: allocPoint
    }
  };
}

// Amélioration du résumé pour inclure plus de détails sur les frais
export async function getTransactionSummaryFromBSC() {
  try {
    const transactions = await getTransactionsFromBSC({ limit: 1000 });
    
    const summary = {
      totalConversionFees: '0',
      totalLiquidityFees: '0', 
      totalStakingFees: '0',
      totalFees: '0',
      totalFeesUSD: '0',
      averageGasPrice: '0',
      totalTransactions: 0,
      totalValueManaged: '0',
      feesAsPercentage: '0',
      transactionCounts: {},
      feesByCategory: {},
      lastUpdate: new Date()
    };

    let totalFees = 0;
    let totalFeesUSD = 0;
    let totalGasPrice = 0;
    let totalValue = 0;

    transactions.forEach(tx => {
      const fee = parseFloat(tx.gasFee);
      const feeUSD = parseFloat(tx.gasFeeUSD || 0);
      const value = parseFloat(tx.fromAmount);
      
      totalFees += fee;
      totalFeesUSD += feeUSD;
      totalGasPrice += parseFloat(tx.metadata.gasPriceWei) / 1e9; // en Gwei
      if (value > 0) totalValue += value;

      // Compter par type
      if (!summary.transactionCounts[tx.type]) {
        summary.transactionCounts[tx.type] = 0;
      }
      summary.transactionCounts[tx.type]++;

      // Frais par catégorie
      if (!summary.feesByCategory[tx.category]) {
        summary.feesByCategory[tx.category] = 0;
      }
      summary.feesByCategory[tx.category] += fee;

      // Répartir les frais par type
      if (tx.category === 'staking') {
        summary.totalStakingFees = (parseFloat(summary.totalStakingFees) + fee).toString();
      } else if (tx.category === 'liquidity') {
        summary.totalLiquidityFees = (parseFloat(summary.totalLiquidityFees) + fee).toString();
      }
    });

    summary.totalFees = totalFees.toFixed(6);
    summary.totalFeesUSD = totalFeesUSD.toFixed(2);
    summary.averageGasPrice = transactions.length > 0 ? (totalGasPrice / transactions.length).toFixed(1) : '0';
    summary.totalTransactions = transactions.length;
    summary.totalValueManaged = totalValue.toFixed(2);
    summary.feesAsPercentage = totalValue > 0 ? 
      ((totalFees / totalValue) * 100).toFixed(4) : '0';

    return summary;
  } catch (error) {
    console.error('Erreur lors du calcul du résumé:', error);
    return {
      totalConversionFees: '0',
      totalLiquidityFees: '0',
      totalStakingFees: '0',
      totalFees: '0',
      totalFeesUSD: '0',
      totalValueManaged: '0',
      feesAsPercentage: '0'
    };
  }
}

// Exports pour compatibilité avec l'ancien code
export const getTransactions = getTransactionsFromBSC;
export const getTransactionSummary = getTransactionSummaryFromBSC;

export const getPendingTransactions = () => {
  return [];
};

export const syncPendingTransactions = async () => {
  return 0;
};

export const recordTransaction = async (transaction: any) => {
  console.log('Transaction enregistrée sur la blockchain:', transaction);
  return { success: true, message: 'Transaction on-chain' };
};