// components/TransactionsPage.tsx
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTransactionsFromBSC, getTransactionSummaryFromBSC } from '../services/transactionServiceBSC';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger les données depuis BSCScan
        const txData = await getTransactionsFromBSC({ limit: 100 });
        const summaryData = await getTransactionSummaryFromBSC();
        
        setTransactions(txData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Rafraîchir toutes les 30 secondes si autoRefresh est activé
    const interval = autoRefresh ? setInterval(loadData, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);
  
  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 180, 
      renderCell: (params) => formatDistance(new Date(params.value), new Date(), { 
        addSuffix: true, 
        locale: fr 
      }) 
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 150,
      renderCell: (params) => {
        const types = {
          conversion: 'Conversion',
          liquidity_add: 'Ajout de liquidité',
          liquidity_remove: 'Retrait de liquidité',
          stake: 'Staking',
          unstake: 'Unstaking',
          harvest: 'Récolte',
          token_approval: 'Approbation de token',
          update_pool: 'Mise à jour pool',
          add_pool: 'Ajout de pool',
          deposit: 'Dépôt',
          withdraw: 'Retrait',
          unknown: 'Inconnu'
        };
        return (
          <span className={`
            px-2 py-1 rounded-full text-xs
            ${params.value === 'update_pool' || params.value === 'add_pool' ? 'bg-purple-100 text-purple-800' : ''}
            ${params.value === 'deposit' || params.value === 'stake' ? 'bg-green-100 text-green-800' : ''}
            ${params.value === 'withdraw' || params.value === 'unstake' ? 'bg-orange-100 text-orange-800' : ''}
            ${params.value === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {types[params.value] || params.value}
          </span>
        );
      }
    },
    { field: 'description', headerName: 'Description', width: 250 },
    { 
      field: 'fromAmount', 
      headerName: 'Montant', 
      width: 120,
      renderCell: (params) => {
        const amount = parseFloat(params.value);
        return amount > 0 ? `${amount.toFixed(4)} BNB` : '-';
      }
    },
    { 
      field: 'gasFee', 
      headerName: 'Frais', 
      width: 120,
      renderCell: (params) => `${parseFloat(params.value).toFixed(6)} BNB`
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      width: 100,
      renderCell: (params) => {
        const statuses = {
          completed: 'Complété',
          failed: 'Échoué'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            params.value === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {statuses[params.value] || params.value}
          </span>
        );
      }
    },
    { 
      field: 'blockNumber', 
      headerName: 'Bloc', 
      width: 100,
      renderCell: (params) => `#${params.value}`
    },
    { 
      field: 'txHash', 
      headerName: 'Transaction', 
      width: 120,
      renderCell: (params) => (
        <a 
          href={`https://bscscan.com/tx/${params.value}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Explorer →
        </a>
      )
    },
  ];

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Frais totaux</h3>
            <p className="text-xl font-semibold">{summary.totalFees} BNB</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Valeur gérée</h3>
            <p className="text-xl font-semibold">{summary.totalValueManaged} BNB</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Ratio frais/valeur</h3>
            <p className="text-xl font-semibold">{summary.feesAsPercentage}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total transactions</h3>
            <p className="text-xl font-semibold">{transactions.length}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Historique des transactions (BSCScan)</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-purple-600"
              />
              <span className="text-sm">Actualisation auto (30s)</span>
            </label>
            <div className="flex space-x-2">
              <button 
                onClick={() => exportToCSV(transactions)} 
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Exporter CSV
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ height: 600, width: '100%' }} className="p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Aucune transaction trouvée sur BSCScan.
            </div>
          ) : (
            <DataGrid
              rows={transactions}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection={false}
              disableSelectionOnClick
              autoHeight
              getRowId={(row) => row.txHash}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Fonction d'exportation CSV mise à jour
function exportToCSV(data) {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }
  
  const headers = [
    'Date', 'Type', 'Description', 'Montant', 'Frais', 'Statut', 'Bloc', 'Transaction'
  ];
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const transaction of data) {
    const values = [
      new Date(transaction.date).toISOString(),
      transaction.type,
      transaction.description,
      transaction.fromAmount,
      transaction.gasFee,
      transaction.status,
      transaction.blockNumber,
      transaction.txHash
    ];
    
    const escapedValues = values.map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    
    csvRows.push(escapedValues.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}