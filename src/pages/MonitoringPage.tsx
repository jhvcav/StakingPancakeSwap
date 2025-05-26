// pages/MonitoringPage.tsx
import React from 'react';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';
import { StakingMonitor } from './components/StakingMonitor';

export function MonitoringPage() {
  const { isConnected } = useAccount();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!isConnected ? (
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Pas de portefeuille connecté</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connectez votre portefeuille pour accéder au monitoring de staking.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord de monitoring</h1>
          <StakingMonitor />
        </div>
      )}
    </main>
  );
}