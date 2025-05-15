import React from 'react';
import { useAccount } from 'wagmi';
import { Wallet } from 'lucide-react';
import { DailyStakingManager } from '../components/DailyStakingManager';

export function HomePage() {
  const { isConnected } = useAccount();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!isConnected ? (
        <div className="text-center py-12">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Pas de portefeuille connecté</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connectez votre portefeuille pour accéder au gestionnaire de staking.
          </p>
        </div>
      ) : (
        <DailyStakingManager />
      )}
    </main>
  );
}