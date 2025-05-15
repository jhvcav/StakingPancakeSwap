import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, AlertCircle, RefreshCw, ArrowRight, Layers, Minus, Plus, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import des composants
import { DailyStakingSection } from './DailyStakingSection';
import { LiquidityRemover } from './LiquidityRemover';
import { SmartLPCreator } from './SmartLPCreator';

export function DailyStakingManager() {
  const [activeTab, setActiveTab] = useState('staking'); // 'staking', 'liquidity' ou 'create'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion PancakeSwap</h1>
      
      {/* Onglets de navigation */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('staking')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'staking'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Layers className="inline w-4 h-4 mr-2" />
          Staking Quotidien
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calculator className="inline w-4 h-4 mr-2" />
          Créer LP (Smart)
        </button>
        <button
          onClick={() => setActiveTab('liquidity')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'liquidity'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Minus className="inline w-4 h-4 mr-2" />
          Retirer Liquidité
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'staking' ? (
        <DailyStakingSection />
      ) : activeTab === 'create' ? (
        <SmartLPCreator />
      ) : (
        <LiquidityRemover />
      )}
    </div>
  );
}