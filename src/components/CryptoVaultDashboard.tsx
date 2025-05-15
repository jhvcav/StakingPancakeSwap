import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CryptoVaultDashboard({ cryptoVaultData, setCryptoVaultData, totalRewards }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState({
    totalDeposits: '0',
    apr: 0.15
  });

  const handleEditSave = () => {
    const newTotal = parseFloat(editValues.totalDeposits);
    const apr = parseFloat(editValues.apr);
    const dailyRate = apr / 365;
    const dailyRequired = newTotal * dailyRate;
    
    const updatedData = {
      totalDeposits: newTotal.toString(),
      totalPromised: (newTotal * (1 + apr)).toString(),
      dailyRequired: dailyRequired.toString(),
      lastUpdate: new Date().toISOString()
    };
    
    setCryptoVaultData(updatedData);
    localStorage.setItem('cryptoVaultData', JSON.stringify(updatedData));
    setIsEditMode(false);
    toast.success('Données mises à jour');
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données CryptoVault ?')) {
      const resetData = {
        totalDeposits: '0',
        totalPromised: '0',
        dailyRequired: '0',
        lastUpdate: new Date().toISOString()
      };
      setCryptoVaultData(resetData);
      localStorage.setItem('cryptoVaultData', JSON.stringify(resetData));
      toast.success('Données réinitialisées');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
      {/* En-tête avec boutons très visibles */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <DollarSign className="mr-2" /> Obligations CryptoVault
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditValues({
                  totalDeposits: cryptoVaultData.totalDeposits,
                  apr: 0.15
                });
                setIsEditMode(!isEditMode);
              }}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg"
            >
              {isEditMode ? 'Fermer' : 'Modifier'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Mode édition */}
      {isEditMode && (
        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total déposé (USDC)</label>
              <input
                type="number"
                value={editValues.totalDeposits}
                onChange={(e) => setEditValues({...editValues, totalDeposits: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
           
            <div>
              <label className="block text-sm font-medium mb-1">APR (%)</label>
              <input
                type="number"
                value={editValues.apr * 100}
                onChange={(e) => setEditValues({...editValues, apr: parseFloat(e.target.value) / 100})}
                className="w-full p-2 border rounded"
                step="0.1"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleEditSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Affichage des données */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/50 p-3 rounded">
          <p className="text-sm text-gray-600">Total déposé</p>
          <p className="text-xl font-bold">{cryptoVaultData.totalDeposits} USDC</p>
        </div>
        <div className="bg-white/50 p-3 rounded">
          <p className="text-sm text-gray-600">Total promis</p>
          <p className="text-xl font-bold text-orange-600">{cryptoVaultData.totalPromised} USDC</p>
        </div>
        <div className="bg-white/50 p-3 rounded">
          <p className="text-sm text-gray-600">Requis/jour</p>
          <p className="text-xl font-bold text-red-600">{cryptoVaultData.dailyRequired} USDC</p>
        </div>
        <div className="bg-white/50 p-3 rounded">
          <p className="text-sm text-gray-600">Gains actuels</p>
          <p className="text-xl font-bold text-green-600">{totalRewards} CAKE</p>
        </div>
          </div>
        </div>
  );
}