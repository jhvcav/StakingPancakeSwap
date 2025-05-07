import React from 'react';
import { Wallet, LineChart, Users, Database, Settings } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useGlobalStats } from '../hooks/useContracts';
import { PoolCard } from '../components/PoolCard';

// Exemple de données de pool (à remplacer par les vraies données)
const pools = [
  {
    id: 0,
    name: "CAKE-BNB LP",
    apr: "120.5",
    totalStaked: "1,234,567",
    userStaked: "100",
    pendingRewards: "25.5"
  },
  {
    id: 1,
    name: "BUSD-BNB LP",
    apr: "85.2",
    totalStaked: "2,345,678",
    userStaked: "50",
    pendingRewards: "12.3"
  }
];

// Dans HomePage.tsx
export function HomePage() {
  const { isConnected } = useAccount();
  const { data: globalStats, isError, error, isLoading } = useGlobalStats();

  console.log("Rendu de HomePage");
  console.log("globalStats:", globalStats);
  console.log("isError:", isError);
  console.log("error:", error);
  console.log("isLoading:", isLoading);

  // Afficher un message plus détaillé en cas d'erreur
  if (isError) {
    console.error("Erreur détaillée:", error);
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Une erreur s'est produite lors du chargement des statistiques globales</h3>
          <p className="mt-2 text-sm text-red-600">
            {error?.message || "Veuillez réessayer ultérieurement."}
          </p>
        </div>
      </div>
    );
  }

  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
      </div>
    );
  }

  // Les données sont récupérées ou inexistantes, afficher 0 si les données sont nulles/indéfinies
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Database className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">TVL</p>
            <p className="text-xl font-semibold">${globalStats?.tvl ? globalStats.tvl.toString() : '0'}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Stakers</p>
            <p className="text-xl font-semibold">{globalStats?.users ? globalStats.users.toString() : '0'}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <LineChart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pools Actifs</p>
            <p className="text-xl font-semibold">{globalStats?.pools ? globalStats.pools.toString() : '0'}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Settings className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Instances</p>
            <p className="text-xl font-semibold">{globalStats?.activeInstances ? globalStats.activeInstances.toString() : '0'}</p>
          </div>
        </div>
      </div>

      {/* Message si non connecté ou contenu des pools */}
      {!isConnected ? (
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Pas de portefeuille connecté</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connectez votre portefeuille pour voir vos positions de staking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pools.map(pool => (
            <PoolCard key={pool.id} {...pool} />
          ))}
        </div>
      )}
    </main>
  );
}