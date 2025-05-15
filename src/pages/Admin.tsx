// pages/Admin.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Plus, Settings, AlertTriangle, LineChart, RefreshCw, Database } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAdminStatus, useAnalytics, usePoolManagement } from '../hooks/useAdmin';
import { AddPoolModal } from '../components/admin/AddPoolModal';
import { UpdatePoolModal } from '../components/admin/UpdatePoolModal';
import { EmergencyActionsModal } from '../components/admin/EmergencyActionsModal';
import { AnalyticsChart } from '../components/admin/AnalyticsChart';
import { AdminLayout } from '../components/AdminLayout';

export function AdminPage() {
  const { address } = useAccount();
  const { data: isAdmin } = useAdminStatus(address);
  const { data: analytics } = useAnalytics();
  const { 
    pools, 
    isLoading: isPoolsLoading, 
    refreshPools 
  } = usePoolManagement();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddPoolModalOpen, setIsAddPoolModalOpen] = useState(false);
  const [isUpdatePoolModalOpen, setIsUpdatePoolModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [selectedPoolInfo, setSelectedPoolInfo] = useState(null);

  // Rafraîchir les pools au chargement de la page
  useEffect(() => {
    console.log("Chargement initial de la page Admin");
    handleRefreshPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fonction pour rafraîchir les pools avec indicateur visuel
  const handleRefreshPools = () => {
    setIsRefreshing(true);
    refreshPools();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Accès Restreint</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-gray-900">Vue d'ensemble</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleRefreshPools}
            className={`flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
          <button
            onClick={() => setIsAddPoolModalOpen(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un Pool</span>
          </button>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Actions d'Urgence</span>
          </button>
        </div>
      </div>

      {/* Graphique d'analytics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Évolution des Métriques</h2>
          <LineChart className="h-6 w-6 text-gray-400" />
        </div>
        <AnalyticsChart data={analytics} />
      </div>

      {/* Liste des pools */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Gestion des Pools</h2>
          <span className="text-sm text-gray-500">{pools?.length || 0} pool(s) trouvé(s)</span>
        </div>
        
        {isPoolsLoading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="mt-4 text-gray-500">Chargement des pools...</p>
          </div>
        ) : pools?.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>Aucun pool n'a été trouvé.</p>
            <p className="mt-2">Cliquez sur "Ajouter un Pool" pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pools.map((pool) => (
              <div key={pool.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{pool.name}</h3>
                  <p className="text-sm text-gray-500">
                    APR: {pool.apr}% | Total Staké: {pool.totalStaked}
                  </p>
                  {pool.lpToken && (
                    <p className="text-xs text-gray-400 mt-1">
                      Token LP: {typeof pool.lpToken === 'string' ? 
                        `${pool.lpToken.substring(0, 6)}...${pool.lpToken.substring(pool.lpToken.length - 4)}` : 
                        'Non disponible'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedPool(pool.id);
                    setSelectedPoolInfo(pool);
                    setIsUpdatePoolModalOpen(true);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-5 w-5" />
                  <span>Configurer</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accès rapide à la page de transactions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Accès Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a 
            href="/admin/transactions" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center"
          >
            <div className="bg-blue-100 p-3 rounded-full mb-3">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-gray-700 font-medium">Suivi des Transactions</span>
          </a>
          
          <a 
            href="/admin/pools" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center"
          >
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-gray-700 font-medium">Gestion avancée des Pools</span>
          </a>

          <a 
            href="/admin/dashboard" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center"
          >
            <div className="bg-indigo-100 p-3 rounded-full mb-3">
              <LineChart className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-gray-700 font-medium">Synthèse par Jour</span>
          </a>
          
          <a 
            href="/admin/settings" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center"
          >
            <div className="bg-purple-100 p-3 rounded-full mb-3">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-gray-700 font-medium">Paramètres</span>
          </a>
        </div>
      </div>

      <AddPoolModal
        isOpen={isAddPoolModalOpen}
        onClose={() => {
          setIsAddPoolModalOpen(false);
          // Rafraîchir les pools après la fermeture du modal
          setTimeout(() => handleRefreshPools(), 500);
        }}
      />
      
      <UpdatePoolModal
        isOpen={isUpdatePoolModalOpen}
        onClose={() => {
          setIsUpdatePoolModalOpen(false);
          setSelectedPool(null);
          setSelectedPoolInfo(null);
          // Rafraîchir les pools après la fermeture du modal
          setTimeout(() => handleRefreshPools(), 500);
        }}
        poolId={selectedPool}
        currentPoolInfo={selectedPoolInfo}
      />
      
      <EmergencyActionsModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </AdminLayout>
  );
}