import React, { useState } from 'react';
import { Shield, Plus, Settings, AlertTriangle, LineChart } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAdminStatus, useAnalytics, usePoolManagement } from '../hooks/useAdmin';
import { AddPoolModal } from '../components/admin/AddPoolModal';
import { UpdatePoolModal } from '../components/admin/UpdatePoolModal';
import { EmergencyActionsModal } from '../components/admin/EmergencyActionsModal';
import { AnalyticsChart } from '../components/admin/AnalyticsChart';

export function AdminPage() {
  const { address } = useAccount();
  const { data: isAdmin } = useAdminStatus(address);
  const { data: analytics } = useAnalytics();
  const { pools, updatePool } = usePoolManagement();

  const [isAddPoolModalOpen, setIsAddPoolModalOpen] = useState(false);
  const [isUpdatePoolModalOpen, setIsUpdatePoolModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<number | null>(null);

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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
          <div className="flex space-x-4">
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Gestion des Pools</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pools?.map((pool) => (
              <div key={pool.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{pool.name}</h3>
                  <p className="text-sm text-gray-500">
                    APR: {pool.apr}% | Total Staké: {pool.totalStaked}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPool(pool.id);
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
        </div>

        <AddPoolModal
          isOpen={isAddPoolModalOpen}
          onClose={() => setIsAddPoolModalOpen(false)}
        />
        
        <UpdatePoolModal
          isOpen={isUpdatePoolModalOpen}
          onClose={() => setIsUpdatePoolModalOpen(false)}
          poolId={selectedPool}
        />
        
        <EmergencyActionsModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
        />
      </div>
    </div>
  );
}