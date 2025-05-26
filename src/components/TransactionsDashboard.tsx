// components/TransactionsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTransactions } from '../services/transactionServiceBSC';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DailySummary {
  date: string;
  transactions: number;
  totalFees: number;
  totalVolume: number;
  types: Record<string, number>;
  categories: Record<string, number>;
}

export function TransactionsDashboard() {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [periodDays, setPeriodDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadTransactionData();
  }, [periodDays]);

  const loadTransactionData = async () => {
    setIsLoading(true);
    try {
      // Récupérer toutes les transactions pour la période
      const transactions = await getTransactions({ limit: 1000 });
      
      // Grouper par jour
      const summariesMap = new Map<string, DailySummary>();
      
      // Initialiser tous les jours de la période
      const endDate = new Date();
      const startDate = subDays(endDate, periodDays);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        summariesMap.set(dateKey, {
          date: dateKey,
          transactions: 0,
          totalFees: 0,
          totalVolume: 0,
          types: {},
          categories: {}
        });
      });
      
      // Traiter chaque transaction
      transactions.forEach(tx => {
        const dateKey = format(new Date(tx.date), 'yyyy-MM-dd');
        const summary = summariesMap.get(dateKey);
        
        if (summary && new Date(tx.date) >= startDate) {
          summary.transactions++;
          summary.totalFees += parseFloat(tx.gasFee || 0);
          summary.totalVolume += parseFloat(tx.fromAmount || 0);
          
          // Compter par type
          if (!summary.types[tx.type]) {
            summary.types[tx.type] = 0;
          }
          summary.types[tx.type]++;
          
          // Compter par catégorie
          if (!summary.categories[tx.category]) {
            summary.categories[tx.category] = 0;
          }
          summary.categories[tx.category]++;
        }
      });
      
      const summaries = Array.from(summariesMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setDailySummaries(summaries);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Données pour le graphique d'évolution quotidienne
  const dailyChartData = {
    labels: dailySummaries.map(s => format(new Date(s.date), 'dd/MM', { locale: fr })),
    datasets: [
      {
        label: 'Nombre de transactions',
        data: dailySummaries.map(s => s.transactions),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Frais totaux (BNB)',
        data: dailySummaries.map(s => s.totalFees),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.5)',
        yAxisID: 'y1',
      }
    ]
  };

  // Données pour le camembert des types
  const totalByType = dailySummaries.reduce((acc, summary) => {
    Object.entries(summary.types).forEach(([type, count]) => {
      acc[type] = (acc[type] || 0) + count;
    });
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(totalByType),
    datasets: [
      {
        data: Object.values(totalByType),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
      }
    ]
  };

  // Calculs des totaux
  const totals = dailySummaries.reduce((acc, summary) => {
    acc.transactions += summary.transactions;
    acc.fees += summary.totalFees;
    acc.volume += summary.totalVolume;
    return acc;
  }, { transactions: 0, fees: 0, volume: 0 });

  // Moyenne quotidienne
  const avgDaily = {
    transactions: totals.transactions / periodDays,
    fees: totals.fees / periodDays,
    volume: totals.volume / periodDays
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Synthèse des Transactions</h2>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </div>

      {/* Cards de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Transactions</h3>
          <p className="text-2xl font-bold">{totals.transactions}</p>
          <p className="text-xs text-gray-400">Moy. {avgDaily.transactions.toFixed(1)}/jour</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Frais Totaux</h3>
          <p className="text-2xl font-bold">{totals.fees.toFixed(4)} BNB</p>
          <p className="text-xs text-gray-400">Moy. {avgDaily.fees.toFixed(6)}/jour</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Volume Total</h3>
          <p className="text-2xl font-bold">{totals.volume.toFixed(2)} BNB</p>
          <p className="text-xs text-gray-400">Moy. {avgDaily.volume.toFixed(4)}/jour</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Coût Moyen/Tx</h3>
          <p className="text-2xl font-bold">{(totals.fees / totals.transactions).toFixed(6)} BNB</p>
          <p className="text-xs text-gray-400">≈ {((totals.fees / totals.transactions) * 600).toFixed(2)} USD</p>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Évolution Quotidienne</h3>
        <div className="h-64">
          <Line
            data={dailyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              scales: {
                y: {
                  type: 'linear' as const,
                  display: true,
                  position: 'left' as const,
                  title: {
                    display: true,
                    text: 'Transactions'
                  }
                },
                y1: {
                  type: 'linear' as const,
                  display: true,
                  position: 'right' as const,
                  title: {
                    display: true,
                    text: 'Frais (BNB)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Graphiques côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Répartition par Type</h3>
          <div className="h-64">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed;
                        const percentage = ((value / totals.transactions) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Top jours par volume */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Jours par Volume</h3>
          <div className="space-y-2">
            {dailySummaries
              .sort((a, b) => b.totalVolume - a.totalVolume)
              .slice(0, 10)
              .map((summary, index) => (
                <div key={summary.date} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">#{index + 1}</span>
                    <span className="ml-2">{format(new Date(summary.date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{summary.totalVolume.toFixed(4)} BNB</p>
                    <p className="text-xs text-gray-500">{summary.transactions} transactions</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Détails par jour */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b">Détails Quotidiens</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût Moyen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Répartition</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailySummaries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((summary) => (
                  <tr key={summary.date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(summary.date), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.transactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.totalVolume.toFixed(4)} BNB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.totalFees.toFixed(6)} BNB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.transactions > 0 ? (summary.totalFees / summary.transactions).toFixed(6) : '0'} BNB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {Object.entries(summary.types).map(([type, count]) => (
                          <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}