// pages/admin/transactions.tsx
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTransactions, getTransactionSummary } from '../../services/transactionService';
import { Tabs, Tab, Box, Typography, Chip } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: null
  });
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Construire les paramètres de filtrage
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.dateRange?.start) params.fromDate = filters.dateRange.start.toISOString();
        if (filters.dateRange?.end) params.toDate = filters.dateRange.end.toISOString();
        
        const [txData, summaryData] = await Promise.all([
          getTransactions(params),
          getTransactionSummary()
        ]);
        
        setTransactions(txData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Rafraîchir toutes les 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [filters]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Configuration du tableau de transactions...
  // (Même code que dans l'exemple précédent)
  
  // Préparation des données pour les graphiques
  const prepareChartData = () => {
    if (!summary) return [];
    
    return [
      {
        name: 'Conversion',
        value: parseFloat(summary.totalConversionFees)
      },
      {
        name: 'Liquidité',
        value: parseFloat(summary.totalLiquidityFees)
      },
      {
        name: 'Staking',
        value: parseFloat(summary.totalStakingFees)
      }
    ];
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Suivi des transactions</h1>
      
      {/* Résumé des frais */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Cards de résumé... */}
        </div>
      )}
      
      {/* Onglets */}
      <div className="bg-white rounded-lg shadow mb-6">
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transactions tabs">
          <Tab label="Transactions" />
          <Tab label="Analyse" />
          <Tab label="Exportation" />
        </Tabs>
        
        {/* Contenu des onglets */}
        <Box p={3}>
          {tabValue === 0 && (
            <div style={{ height: 600, width: '100%' }}>
              {/* DataGrid des transactions */}
            </div>
          )}
          
          {tabValue === 1 && summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique en barres des frais */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Répartition des frais</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Frais (BNB)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Graphique en camembert */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Proportion des frais</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Statistiques supplémentaires */}
              <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Statistiques des transactions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Statistiques... */}
                </div>
              </div>
            </div>
          )}
          
          {tabValue === 2 && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Exporter les données</h3>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {/* Implémentation de l'export CSV */}}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Exporter CSV
                  </button>
                  <button 
                    onClick={() => {/* Implémentation de l'export PDF */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Exporter PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}