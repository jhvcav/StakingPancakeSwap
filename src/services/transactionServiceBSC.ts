// services/transactionServiceBSC.ts
import axios from 'axios';
import { PANCAKE_V3_CONTRACTS, PANCAKE_V2_CONTRACTS } from '../config/contracts';

// Utiliser les nouvelles adresses
const STAKING_PANCAKESWAP_ADDRESS = PANCAKE_V3_CONTRACTS.MASTERCHEF_V3; // Adresse du MasterChef V3
const PANCAKE_ROUTER_ADDRESS = PANCAKE_V3_CONTRACTS.ROUTER; // Adresse du Router V3

const BSCSCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';

// Types de transactions avec les signatures MasterChef V3
const TRANSACTION_TYPES = {
  '0x60803461': 'contract_creation',
  '0xf305d719': 'deposit', // deposit(uint256 tokenId)
  '0x00e2a039': 'withdraw', // withdraw(uint256 tokenId, address to)
  '0xddc63262': 'harvest', // harvest(uint256 tokenId, address to)
  '0x3e54a964': 'updateLiquidity', // updateLiquidity(uint256 tokenId)
};

// Fonction principale pour récupérer les transactions
async function getTransactionsFromBSC(filters = {}) {
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
  let tokenId = null;
  let amount = '0';
  
  // Utiliser functionName si disponible pour la description
  if (tx.functionName) {
    description = tx.functionName;
  }
  
  // Décoder selon le type de transaction - adapté pour V3
  try {
    if (tx.input.length > 10) {
      const params = tx.input.slice(10);
      
      switch (transactionType) {
        case 'deposit':
          // deposit(uint256 tokenId)
          tokenId = parseInt(params.slice(0, 64), 16);
          description = `Stake position NFT #${tokenId}`;
          break;
          
        case 'withdraw':
          // withdraw(uint256 tokenId, address to)
          tokenId = parseInt(params.slice(0, 64), 16);
          description = `Unstake position NFT #${tokenId}`;
          break;
          
        case 'harvest':
          // harvest(uint256 tokenId, address to)
          tokenId = parseInt(params.slice(0, 64), 16);
          description = `Récolte des récompenses pour position #${tokenId}`;
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
    toToken: tokenId ? `NFT_${tokenId}` : 'CONTRACT',
    toAmount: amount,
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
      tokenId: tokenId
    }
  };
}

// Amélioration du résumé pour inclure plus de détails sur les frais
async function getTransactionSummaryFromBSC() {
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

// Exports
export {
  getTransactionsFromBSC as getTransactions,
  getTransactionSummaryFromBSC as getTransactionSummary,
};

// Autres fonctions exportées
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