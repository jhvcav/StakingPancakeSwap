import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Download, RefreshCw, Calendar, Filter, DollarSign, 
  ArrowUpRight, ArrowDownRight, ExternalLink, Database,
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Search, FileText, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types pour les transactions
interface Transaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  date: string;
  from: string;
  to: string;
  value: string;
  valueUSD: string;
  gasUsed: string;
  gasPrice: string;
  gasFeeETH: string;
  gasFeeUSD: string;
  method: string;
  isError: string;
  type: 'normal' | 'internal' | 'token' | 'nft';
  category: 'income' | 'expense' | 'transfer' | 'investment' | 'farming' | 'staking' | 'fees';
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  contractAddress?: string;
  description: string;
  counterparty: string;
  counterpartyLabel?: string;
}

interface TokenPrice {
  [address: string]: number;
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalFees: number;
  totalTransactions: number;
  netFlow: number;
  monthlyData: { [month: string]: { income: number; expense: number; fees: number } };
}

// Configuration BSCScan API
const BSCSCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
const BSCSCAN_BASE_URL = import.meta.env.VITE_BSCSCAN_BASE_URL || "https://api.bscscan.com/api";

// Validation des variables d'environnement
if (!BSCSCAN_API_KEY) {
  console.error('❌ VITE_APP_BSCSCAN_API_KEY manquant dans les variables d\'environnement');
}

// Adresses connues pour labellisation
const KNOWN_ADDRESSES = {
  "0xa5f8c5dbd5f286960b9d90548680ae5ebff07652": "PancakeSwap MasterChef",
  "0x46a15b0b27311cedf172ab29e4f4766fbe7f4364": "PancakeSwap V3 Position Manager",
  "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0": "PancakeSwap Router",
  "0x10ed43c718714eb63d5aa57b78b54704e256024e": "PancakeSwap Router V2",
  "0x0000000000000000000000000000000000000000": "Burn Address",
  // Ajoutez d'autres adresses connues
};

export function TransactionHistoryManager() {
  // Vérification des variables d'environnement au démarrage
  useEffect(() => {
    if (!BSCSCAN_API_KEY) {
      toast.error('⚠️ Configuration manquante : Clé API BSCScan non trouvée');
      console.error('Ajoutez VITE_APP_BSCSCAN_API_KEY dans votre fichier .env');
    }
  }, []);
  // États
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    totalFees: 0,
    totalTransactions: 0,
    netFlow: 0,
    monthlyData: {}
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    category: 'all',
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  
  // Prix des tokens (cache)
  const [tokenPrices, setTokenPrices] = useState<TokenPrice>({});

  // Fonction pour récupérer le prix d'un token
  const getTokenPrice = async (tokenAddress: string = 'bnb'): Promise<number> => {
    if (tokenPrices[tokenAddress]) {
      return tokenPrices[tokenAddress];
    }
    
    try {
      let url = '';
      if (tokenAddress === 'bnb' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        url = `https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd`;
      } else {
        url = `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${tokenAddress}&vs_currencies=usd`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      let price = 0;
      if (tokenAddress === 'bnb') {
        price = data.binancecoin?.usd || 0;
      } else {
        price = data[tokenAddress.toLowerCase()]?.usd || 0;
      }
      
      setTokenPrices(prev => ({...prev, [tokenAddress]: price}));
      return price;
    } catch (error) {
      console.error(`Erreur prix pour ${tokenAddress}:`, error);
      return 0;
    }
  };

  // Fonction pour déterminer la catégorie d'une transaction
  const categorizeTransaction = (tx: any, walletAddr: string, type: string): string => {
    const from = tx.from?.toLowerCase();
    const to = tx.to?.toLowerCase();
    const wallet = walletAddr.toLowerCase();
    const method = tx.functionName || tx.method || '';
    
    // Catégories basées sur les méthodes connues
    if (method.includes('swap') || method.includes('addLiquidity') || method.includes('removeLiquidity')) {
      return 'investment';
    }
    
    if (method.includes('stake') || method.includes('deposit') || method.includes('harvest')) {
      return 'staking';
    }
    
    if (method.includes('farm') || method.includes('collect')) {
      return 'farming';
    }
    
    // Catégories basées sur les adresses
    if (KNOWN_ADDRESSES[to] || KNOWN_ADDRESSES[from]) {
      return 'investment';
    }
    
    // Catégories basées sur le sens de la transaction
    if (from === wallet && to !== wallet) {
      return parseFloat(tx.value) > 0 ? 'expense' : 'fees';
    } else if (from !== wallet && to === wallet) {
      return 'income';
    }
    
    return 'transfer';
  };

  // Fonction pour récupérer les transactions normales
  const fetchNormalTransactions = async (address: string): Promise<Transaction[]> => {
    console.log('🔑 API Key:', BSCSCAN_API_KEY ? 'Présente' : 'MANQUANTE');
    console.log('🌐 URL complète:', `${BSCSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${BSCSCAN_API_KEY}`);
    try {
      const response = await fetch(
        `${BSCSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${BSCSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status !== '1') {
        // Si pas de transactions trouvées, retourner un tableau vide
            if (data.message === 'No transactions found' || data.message === 'No records found') {
                return [];
            }
        // Sinon, c'est une vraie erreur
            throw new Error(data.message || 'Erreur API BSCScan');
    }

      const bnbPrice = await getTokenPrice('bnb');
      
      return data.result.map((tx: any) => {
        const valueETH = ethers.formatEther(tx.value || '0');
        const valueUSD = (parseFloat(valueETH) * bnbPrice).toFixed(2);
        const gasFeeETH = ethers.formatEther((BigInt(tx.gasUsed || '0') * BigInt(tx.gasPrice || '0')).toString());
        const gasFeeUSD = (parseFloat(gasFeeETH) * bnbPrice).toFixed(2);
        
        return {
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          timeStamp: tx.timeStamp,
          date: new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
          from: tx.from,
          to: tx.to,
          value: valueETH,
          valueUSD,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          gasFeeETH,
          gasFeeUSD,
          method: tx.functionName || 'Transfer',
          isError: tx.isError,
          type: 'normal' as const,
          category: categorizeTransaction(tx, address, 'normal') as any,
          description: `${tx.functionName || 'Transfer'} - ${parseFloat(valueETH).toFixed(4)} BNB`,
          counterparty: tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from,
          counterpartyLabel: KNOWN_ADDRESSES[tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from] || ''
        };
      });
    } catch (error) {
      console.error('Erreur transactions normales:', error);
      return [];
    }
  };

  // Fonction pour récupérer les transactions internes
  const fetchInternalTransactions = async (address: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(
        `${BSCSCAN_BASE_URL}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${BSCSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status !== '1') {
        return []; // Pas d'erreur si pas de transactions internes
      }

      const bnbPrice = await getTokenPrice('bnb');
      
      return data.result.map((tx: any) => {
        const valueETH = ethers.formatEther(tx.value || '0');
        const valueUSD = (parseFloat(valueETH) * bnbPrice).toFixed(2);
        
        return {
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          timeStamp: tx.timeStamp,
          date: new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
          from: tx.from,
          to: tx.to,
          value: valueETH,
          valueUSD,
          gasUsed: '0',
          gasPrice: '0',
          gasFeeETH: '0',
          gasFeeUSD: '0',
          method: 'Internal Transfer',
          isError: tx.isError || '0',
          type: 'internal' as const,
          category: categorizeTransaction(tx, address, 'internal') as any,
          description: `Internal Transfer - ${parseFloat(valueETH).toFixed(4)} BNB`,
          counterparty: tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from,
          counterpartyLabel: KNOWN_ADDRESSES[tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from] || ''
        };
      });
    } catch (error) {
      console.error('Erreur transactions internes:', error);
      return [];
    }
  };

  // Fonction pour récupérer les transfers de tokens BEP-20
  const fetchTokenTransfers = async (address: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(
        `${BSCSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${BSCSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status !== '1') {
        return [];
      }
      
      const results = [];
      for (const tx of data.result) {
        const decimals = parseInt(tx.tokenDecimal) || 18;
        const tokenAmount = ethers.formatUnits(tx.value || '0', decimals);
        const tokenPrice = await getTokenPrice(tx.contractAddress);
        const valueUSD = (parseFloat(tokenAmount) * tokenPrice).toFixed(2);
        
        results.push({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          timeStamp: tx.timeStamp,
          date: new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
          from: tx.from,
          to: tx.to,
          value: tokenAmount,
          valueUSD,
          gasUsed: tx.gasUsed || '0',
          gasPrice: tx.gasPrice || '0',
          gasFeeETH: '0', // Les frais de gas sont dans la transaction normale correspondante
          gasFeeUSD: '0',
          method: 'Token Transfer',
          isError: '0',
          type: 'token' as const,
          category: categorizeTransaction(tx, address, 'token') as any,
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          tokenDecimal: tx.tokenDecimal,
          contractAddress: tx.contractAddress,
          description: `${tx.tokenSymbol} Transfer - ${parseFloat(tokenAmount).toFixed(4)} ${tx.tokenSymbol}`,
          counterparty: tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from,
          counterpartyLabel: KNOWN_ADDRESSES[tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from] || ''
        });
      }
      
      return results;
    } catch (error) {
      console.error('Erreur token transfers:', error);
      return [];
    }
  };

  // Fonction pour récupérer les transfers NFT
  const fetchNFTTransfers = async (address: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(
        `${BSCSCAN_BASE_URL}?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${BSCSCAN_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status !== '1') {
        return [];
      }
      
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timeStamp: tx.timeStamp,
        date: new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
        from: tx.from,
        to: tx.to,
        value: '1', // NFT = 1 unité
        valueUSD: '0', // Difficile d'évaluer automatiquement
        gasUsed: tx.gasUsed || '0',
        gasPrice: tx.gasPrice || '0',
        gasFeeETH: '0',
        gasFeeUSD: '0',
        method: 'NFT Transfer',
        isError: '0',
        type: 'nft' as const,
        category: 'transfer' as any,
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        contractAddress: tx.contractAddress,
        description: `NFT ${tx.tokenSymbol} #${tx.tokenID}`,
        counterparty: tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from,
        counterpartyLabel: KNOWN_ADDRESSES[tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from] || ''
      }));
    } catch (error) {
      console.error('Erreur NFT transfers:', error);
      return [];
    }
  };

  // Fonction principale pour récupérer toutes les transactions
  const fetchAllTransactions = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      toast.error('Adresse wallet invalide');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Récupération de l\'historique des transactions...');
      
      // Récupérer tous les types de transactions en parallèle
      const [normalTxs, internalTxs, tokenTxs, nftTxs] = await Promise.all([
        fetchNormalTransactions(walletAddress),
        fetchInternalTransactions(walletAddress),
        fetchTokenTransfers(walletAddress),
        fetchNFTTransfers(walletAddress)
      ]);

      // Combiner toutes les transactions
      const allTransactions = [...normalTxs, ...internalTxs, ...tokenTxs, ...nftTxs];
      
      // Trier par timestamp décroissant
      allTransactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));
      
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      // Calculer le résumé
      calculateSummary(allTransactions);
      
      toast.success(`✅ ${allTransactions.length} transactions récupérées`);
      console.log(`📊 Résumé: ${normalTxs.length} normales, ${internalTxs.length} internes, ${tokenTxs.length} tokens, ${nftTxs.length} NFTs`);
      
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour calculer le résumé financier
  const calculateSummary = (txs: Transaction[]) => {
    const summary: TransactionSummary = {
      totalIncome: 0,
      totalExpense: 0,
      totalFees: 0,
      totalTransactions: txs.length,
      netFlow: 0,
      monthlyData: {}
    };

    txs.forEach(tx => {
      const valueUSD = parseFloat(tx.valueUSD) || 0;
      const feesUSD = parseFloat(tx.gasFeeUSD) || 0;
      const month = tx.date.substring(0, 7); // YYYY-MM
      
      if (!summary.monthlyData[month]) {
        summary.monthlyData[month] = { income: 0, expense: 0, fees: 0 };
      }
      
      summary.totalFees += feesUSD;
      summary.monthlyData[month].fees += feesUSD;
      
      if (tx.category === 'income') {
        summary.totalIncome += valueUSD;
        summary.monthlyData[month].income += valueUSD;
      } else if (['expense', 'investment', 'staking', 'farming'].includes(tx.category)) {
        summary.totalExpense += valueUSD;
        summary.monthlyData[month].expense += valueUSD;
      }
    });
    
    summary.netFlow = summary.totalIncome - summary.totalExpense - summary.totalFees;
    setSummary(summary);
  };

  // Fonction pour appliquer les filtres
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => tx.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx => tx.date <= filters.dateTo);
    }
    
    // Filtre par type
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }
    
    // Filtre par catégorie
    if (filters.category !== 'all') {
      filtered = filtered.filter(tx => tx.category === filters.category);
    }
    
    // Filtre par montant
    if (filters.minAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.valueUSD) >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.valueUSD) <= parseFloat(filters.maxAmount));
    }
    
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchLower) ||
        tx.description.toLowerCase().includes(searchLower) ||
        tx.method.toLowerCase().includes(searchLower) ||
        tx.counterpartyLabel?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredTransactions(filtered);
    calculateSummary(filtered);
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Aucune transaction à exporter');
      return;
    }

    const headers = [
      'Date', 'Hash', 'Type', 'Catégorie', 'Méthode', 'De', 'Vers', 
      'Montant', 'Symbole', 'Valeur USD', 'Frais ETH', 'Frais USD',
      'Description', 'Contrepartie', 'Label Contrepartie', 'Statut'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => [
        tx.date,
        tx.hash,
        tx.type,
        tx.category,
        tx.method,
        tx.from,
        tx.to,
        tx.value,
        tx.tokenSymbol || 'BNB',
        tx.valueUSD,
        tx.gasFeeETH,
        tx.gasFeeUSD,
        `"${tx.description}"`,
        tx.counterparty,
        `"${tx.counterpartyLabel || ''}"`,
        tx.isError === '0' ? 'Succès' : 'Échec'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${walletAddress}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export CSV réussi!');
  };

  // Fonction pour sauvegarder en localStorage (préparation MongoDB)
  const saveToLocalStorage = () => {
    const dataToSave = {
      walletAddress,
      transactions: filteredTransactions,
      summary,
      exportDate: new Date().toISOString(),
      totalTransactions: filteredTransactions.length
    };
    
    localStorage.setItem(`wallet_history_${walletAddress}`, JSON.stringify(dataToSave));
    toast.success('Données sauvegardées localement');
  };

  // Formatage des montants
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('fr-FR');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'income': return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'expense': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'investment': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'staking': return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'farming': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <ArrowUpRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'internal': return 'bg-green-100 text-green-800';
      case 'token': return 'bg-purple-100 text-purple-800';
      case 'nft': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 Historique des Transactions - Suivi Comptable</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={saveToLocalStorage}
            disabled={filteredTransactions.length === 0}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            <Database className="mr-2 h-4 w-4" />
            Sauvegarder
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Configuration du wallet */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse du Wallet Propriétaire
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 border rounded-md"
            />
          </div>
          <button
            onClick={fetchAllTransactions}
            disabled={isLoading || !walletAddress}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Récupération...' : 'Analyser'}
          </button>
        </div>
      </div>

      {/* Dashboard financier */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entrées</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sorties</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Frais</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalFees)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flux Net</p>
                <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netFlow)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between"></div>
            <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
      )}

      {/* Filtres */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 mr-2 text-gray-600" />
            <h3 className="text-lg font-semibold">Filtres</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tous les types</option>
                <option value="normal">Transactions</option>
                <option value="internal">Internes</option>
                <option value="token">Tokens BEP-20</option>
                <option value="nft">NFT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Toutes les catégories</option>
                <option value="income">Entrées</option>
                <option value="expense">Sorties</option>
                <option value="investment">Investissement</option>
                <option value="staking">Staking</option>
                <option value="farming">Farming</option>
                <option value="fees">Frais</option>
                <option value="transfer">Transfert</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant min (USD)</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                placeholder="0.00"
                className="w-full p-2 border rounded-md"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant max (USD)</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                placeholder="1000000.00"
                className="w-full p-2 border rounded-md"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Hash, méthode, description..."
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {filteredTransactions.length} transaction(s) sur {transactions.length} total
            </p>
            <button
              onClick={() => setFilters({
                dateFrom: '', dateTo: '', type: 'all', category: 'all',
                minAmount: '', maxAmount: '', search: ''
              })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* Tableau des transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Historique Détaillé</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Catégorie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrepartie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frais
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="animate-spin h-6 w-6 mr-2" />
                          Récupération des transactions...
                        </div>
                      ) : transactions.length === 0 ? (
                        'Aucune transaction trouvée. Entrez une adresse wallet et cliquez sur Analyser.'
                      ) : (
                        'Aucune transaction ne correspond aux filtres appliqués.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, index) => (
                    <tr key={`${tx.hash}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{tx.date}</div>
                          <div className="text-gray-500 text-xs">{formatDate(tx.timeStamp)}</div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          <a
                            href={`https://bscscan.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <span className="font-mono">{tx.hash.substring(0, 10)}...</span>
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                          <div className="text-gray-500 text-xs">Block #{tx.blockNumber}</div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(tx.type)}`}>
                            {tx.type.toUpperCase()}
                          </span>
                          <div className="flex items-center">
                            {getCategoryIcon(tx.category)}
                            <span className="ml-1 text-xs capitalize">{tx.category}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="font-medium">{tx.method}</span>
                      </td>
                      
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-mono text-xs">
                            {tx.counterparty.substring(0, 6)}...{tx.counterparty.substring(-4)}
                          </div>
                          {tx.counterpartyLabel && (
                            <div className="text-blue-600 text-xs font-medium">{tx.counterpartyLabel}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          <div className="font-medium">
                            {parseFloat(tx.value).toFixed(4)} {tx.tokenSymbol || 'BNB'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatCurrency(parseFloat(tx.valueUSD))}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div>
                          <div className="text-orange-600 font-medium">
                            {parseFloat(tx.gasFeeETH).toFixed(6)} BNB
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatCurrency(parseFloat(tx.gasFeeUSD))}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {tx.isError === '0' ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Succès</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Échec</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination si nécessaire */}
          {filteredTransactions.length > 50 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage des 50 premières transactions
                </div>
                <div className="text-sm text-blue-600">
                  Utilisez les filtres pour affiner les résultats
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résumé mensuel */}
      {transactions.length > 0 && Object.keys(summary.monthlyData).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Résumé Mensuel</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mois
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrées
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sorties
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frais
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flux Net
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summary.monthlyData)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([month, data]) => {
                    const netFlow = data.income - data.expense - data.fees;
                    return (
                      <tr key={month}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(data.income)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                          {formatCurrency(data.expense)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {formatCurrency(data.fees)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <span className={netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(netFlow)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600">
                    {formatCurrency(summary.totalExpense)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-orange-600">
                    {formatCurrency(summary.totalFees)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">
                    <span className={summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(summary.netFlow)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      {transactions.length === 0 && !isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <FileText className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Suivi Comptable Complet de votre Wallet
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Cette interface vous permet de :</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Récupérer <strong>tous les types de transactions</strong> (normales, internes, tokens BEP-20, NFT)</li>
                  <li>Catégoriser automatiquement selon le <strong>type d'opération</strong> (investissement, staking, farming, etc.)</li>
                  <li>Calculer les <strong>flux financiers</strong> (entrées, sorties, frais) avec valeurs USD</li>
                  <li>Générer des <strong>rapports mensuels</strong> pour votre comptabilité</li>
                  <li>Exporter en <strong>CSV</strong> pour Excel/Access ou sauvegarder pour MongoDB</li>
                </ul>
                <p className="mt-3"><strong>Pour commencer :</strong> Entrez l'adresse de votre wallet propriétaire ci-dessus et cliquez sur "Analyser".</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistoryManager;