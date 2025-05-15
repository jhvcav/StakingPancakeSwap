import React from 'react';

export function TestDashboard({ cryptoVaultData, setCryptoVaultData, totalRewards }) {
  return (
    <div className="bg-red-500 p-8 mb-6">
      <h1 className="text-white text-2xl font-bold mb-4">TEST - VOUS DEVEZ VOIR CECI</h1>
      <div className="flex gap-4">
        <button 
          className="bg-blue-600 text-white px-8 py-4 text-xl font-bold"
          onClick={() => alert('Bouton Modifier cliqué!')}
        >
          MODIFIER (TEST)
        </button>
        <button 
          className="bg-green-600 text-white px-8 py-4 text-xl font-bold"
          onClick={() => alert('Bouton Réinitialiser cliqué!')}
        >
          RÉINITIALISER (TEST)
        </button>
      </div>
      <div className="mt-4 text-white">
        <p>Total déposé: {cryptoVaultData.totalDeposits}</p>
        <p>Total rewards: {totalRewards}</p>
      </div>
    </div>
  );
}