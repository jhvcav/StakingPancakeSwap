// src/components/DailyStakingManager.tsx (version mise à jour)
import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, AlertCircle, RefreshCw, ArrowRight, Layers, Minus, Plus, Calculator, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import des composants
import { DailyStakingSectionV3 } from './DailyStakingSectionV3'; // Mise à jour pour utiliser la nouvelle section de staking
import { DailyStakingSection } from './DailyStakingSectionV2'; // Ancienne section de staking pour la version 2
import { LiquidityRemover } from './LiquidityRemover';
import { SmartLPCreator } from './SmartLPCreator';
import { StakingMonitor } from './StakingMonitor';
import { InfinityStakingManager } from './InfinityStakingManager'; // Composant V3
import { OneClickFarming } from './OneClickFarming'; // NOUVEAU: Importez le composant One-Click Farming

export function DailyStakingManager() {StakingMonitor
  const [activeTab, setActiveTab] = useState('oneclick'); // 'oneclick', 'staking', 'infinity', 'create', 'liquidity' ou 'monitoring'
  const [version, setVersion] = useState('v3'); // 'v2' ou 'v3'
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion PancakeSwap</h1>
      
      {/* Onglets de navigation */}
      <div className="flex space-x-4 border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('oneclick')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'oneclick'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowRight className="inline w-4 h-4 mr-2" />
          Farming 1-Clic
        </button>
        <button
          onClick={() => setActiveTab('staking')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'staking'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Layers className="inline w-4 h-4 mr-2" />
          Staking V2
        </button>
        <button
          onClick={() => setActiveTab('infinity')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'infinity'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BarChart2 className="inline w-4 h-4 mr-2" />
          Infinity (V3)
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
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'monitoring'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <DollarSign className="inline w-4 h-4 mr-2" />
          Monitoring
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
{activeTab === 'oneclick' ? (
  <OneClickFarming />
) : activeTab === 'staking' ? (
  <div className="mb-4">
    <div className="flex space-x-2 mb-4">
      <button 
        onClick={() => setVersion('v2')}
        className={`px-3 py-1 rounded ${
          version === 'v2' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        Version 2
      </button>
      <button 
        onClick={() => setVersion('v3')}
        className={`px-3 py-1 rounded ${
          version === 'v3' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        Version 3 (Infinity)
      </button>
    </div>
    
    {version === 'v2' ? (
      <DailyStakingSection />
    ) : (
      <DailyStakingSectionV3 />
    )}
  </div>
) : activeTab === 'infinity' ? (
  <InfinityStakingManager />
) : activeTab === 'create' ? (
  <SmartLPCreator />
) : activeTab === 'liquidity' ? (
  <LiquidityRemover />
) : (
  <StakingMonitor />
)}
    </div>
  );
}