import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  TrendingUp, AlertCircle, RefreshCw, DollarSign, 
  BarChart2, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Adresse du contrat MasterChef PancakeSwap
const PANCAKE_MASTERCHEF_ADDRESS = '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652';

// Configuration des pools PancakeSwap
const PANCAKE_POOLS = {
  2: { 
    name: 'CAKE-BNB', 
    lpToken: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0', 
    token0: 'CAKE', 
    token1: 'BNB',
    estimatedAPR: 15.5 // APR estimé
  },
  3: { 
    name: 'BUSD-BNB', 
    lpToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16', 
    token0: 'BUSD', 
    token1: 'BNB',
    estimatedAPR: 10.2
  },
  4: { 
    name: 'USDT-BNB', 
    lpToken: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE', 
    token0: 'USDT', 
    token1: 'BNB',
    estimatedAPR: 12.7
  },
  5: { 
    name: 'USDC-BNB', 
    lpToken: '0xEC6557348085Aa57C72514D67070dC863C0a5A8c', 
    token0: 'USDC', 
    token1: 'BNB',
    estimatedAPR: 11.8
  },
  8: { 
    name: 'CAKE-USDT Boosted', 
    lpToken: '0x804678fa97d91B974ec2af3c843270886528a9E6', 
    token0: 'CAKE', 
    token1: 'USDT',
    estimatedAPR: 42.5
  }
};

// Prix des tokens (à mettre à jour dynamiquement dans une vraie implémentation)
const TOKEN_PRICES = {
  'CAKE': 2.45,
  'BNB': 250.0,
  'BUSD': 1.0,
  'USDT': 1.0,
  'USDC': 1.0
};

export function StakingMonitor() {
  // État pour les dépôts enregistrés
  const [deposits, setDeposits] = useState([]);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [newDeposit, setNewDeposit] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    token: 'USDC',
    promisedAPY: 15 // 15% par défaut
  });

  // État pour les positions de staking
  const [stakingPositions, setStakingPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // État pour les métriques de performance
  const [performance, setPerformance] = useState({
    totalPromisedDaily: 0,
    totalActualDaily: 0,
    deficit: 0,
    deficitPercentage: 0,
    recommendedAPR: 0
  });

  // Charger les données depuis localStorage
  useEffect(() => {
    const savedDeposits = localStorage.getItem('stakingDeposits');
    if (savedDeposits) {
      try {
        setDeposits(JSON.parse(savedDeposits));
      } catch (error) {
        console.error("Erreur lors du chargement des dépôts:", error);
      }
    }
    
    // Récupérer les positions de staking
    fetchStakingPositions();
  }, []);

  // Calculer le total déposé quand les dépôts changent
  useEffect(() => {
    const total = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    setTotalDeposited(total);
    
    // Sauvegarder les dépôts dans localStorage
    localStorage.setItem('stakingDeposits', JSON.stringify(deposits));
    
    // Calculer les métriques de performance
    calculatePerformance();
  }, [deposits, stakingPositions]);

  // Ajouter un nouveau dépôt
  const addDeposit = () => {
    if (!newDeposit.amount || parseFloat(newDeposit.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    
    const depositToAdd = {
      id: Date.now(),
      date: newDeposit.date,
      amount: parseFloat(newDeposit.amount),
      token: newDeposit.token,
      promisedAPY: parseFloat(newDeposit.promisedAPY)
    };
    
    setDeposits([...deposits, depositToAdd]);
    
    // Réinitialiser le formulaire
    setNewDeposit({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      token: 'USDC',
      promisedAPY: 15
    });
    
    toast.success(`Dépôt de ${depositToAdd.amount} ${depositToAdd.token} enregistré`);
  };

  // Supprimer un dépôt
  const removeDeposit = (id) => {
    setDeposits(deposits.filter(deposit => deposit.id !== id));
    toast.success("Dépôt supprimé");
  };

  // Récupérer les positions de staking
  const fetchStakingPositions = async () => {
    if (!window.ethereum) {
      toast.error("Provider Ethereum non disponible");
      return;
    }
    
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length === 0) {
        toast.error("Aucun compte connecté");
        setIsLoading(false);
        return;
      }
      
      const userAddress = accounts[0].address;
      
      const masterChef = new ethers.Contract(
        PANCAKE_MASTERCHEF_ADDRESS,
        [
          {
            "inputs": [
              {"internalType": "uint256", "name": "_pid", "type": "uint256"},
              {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "userInfo",
            "outputs": [
              {"internalType": "uint256", "name": "amount", "type": "uint256"},
              {"internalType": "uint256", "name": "rewardDebt", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [
              {"internalType": "uint256", "name": "_pid", "type": "uint256"},
              {"internalType": "address", "name": "_user", "type": "address"}
            ],
            "name": "pendingCake",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        provider
      );

      const positions = [];
      
      for (const [pid, poolInfo] of Object.entries(PANCAKE_POOLS)) {
        try {
          const userInfo = await masterChef.userInfo(pid, userAddress);
          const pendingCake = await masterChef.pendingCake(pid, userAddress);
          
          if (userInfo[0] > 0) {
            const amountStaked = parseFloat(ethers.formatEther(userInfo[0]));
            const pendingReward = parseFloat(ethers.formatEther(pendingCake));
            
            // Estimation de la valeur en USD
            const lpTokenPrice = estimateLPTokenPrice(poolInfo.token0, poolInfo.token1);
            const stakedValueUSD = amountStaked * lpTokenPrice;
            
            // Calcul du rendement quotidien
            const dailyRate = poolInfo.estimatedAPR / 100 / 365;
            const dailyRewardUSD = stakedValueUSD * dailyRate;
            
            positions.push({
              pid: pid,
              poolName: poolInfo.name,
              amountStaked: amountStaked,
              pendingReward: pendingReward,
              stakedValueUSD: stakedValueUSD,
              estimatedAPR: poolInfo.estimatedAPR,
              dailyRewardUSD: dailyRewardUSD
            });
          }
        } catch (error) {
          console.error(`Erreur pool ${pid}:`, error);
        }
      }
      
      setStakingPositions(positions);
      setLastUpdate(new Date());
      
      // Calculer les métriques de performance
      calculatePerformance();
      
      toast.success("Positions mises à jour");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la récupération des positions");
    } finally {
      setIsLoading(false);
    }
  };

  // Estimation du prix d'un LP token
  const estimateLPTokenPrice = (token0, token1) => {
    // Dans une implémentation réelle, vous feriez un appel à une API ou au contrat
    return (TOKEN_PRICES[token0] + TOKEN_PRICES[token1]) / 2;
  };

  // Calculer les métriques de performance
  const calculatePerformance = () => {
    // Rendement quotidien promis
    const totalPromisedDaily = deposits.reduce((sum, deposit) => {
      const dailyRate = deposit.promisedAPY / 100 / 365;
      return sum + (deposit.amount * dailyRate);
    }, 0);
    
    // Rendement quotidien réel
    const totalActualDaily = stakingPositions.reduce((sum, position) => {
      return sum + position.dailyRewardUSD;
    }, 0);
    
    // Déficit ou excédent
    const deficit = totalPromisedDaily - totalActualDaily;
    const deficitPercentage = totalPromisedDaily > 0 ? (deficit / totalPromisedDaily) * 100 : 0;
    
    // APR recommandé pour combler l'écart
    const totalStakedValue = stakingPositions.reduce((sum, position) => sum + position.stakedValueUSD, 0);
    
    let recommendedAPR = 0;
    if (totalStakedValue > 0 && totalPromisedDaily > 0) {
      recommendedAPR = (totalPromisedDaily * 365 * 100) / totalStakedValue;
    }
    
    setPerformance({
      totalPromisedDaily,
      totalActualDaily,
      deficit,
      deficitPercentage,
      recommendedAPR
    });
  };

  // Formatage des nombres pour l'affichage
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Monitoring des Rendements PancakeSwap</h2>
      
      {/* Tableau de bord principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
            Total déposé
          </h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalDeposited)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Rendement promis/jour
          </h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(performance.totalPromisedDaily)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-purple-500" />
            Rendement réel/jour
          </h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(performance.totalActualDaily)}</p>
        </div>
        
        <div className={`bg-white rounded-lg shadow p-4 ${performance.deficit > 0 ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            {performance.deficit > 0 ? (
              <ArrowDownRight className="w-5 h-5 mr-2 text-red-500" />
            ) : (
              <ArrowUpRight className="w-5 h-5 mr-2 text-green-500" />
            )}
            Écart quotidien
          </h3>
          <p className={`text-2xl font-bold mt-2 ${performance.deficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(performance.deficit))}
            <span className="text-sm ml-2">
              ({performance.deficit > 0 ? '-' : '+'}{formatPercentage(Math.abs(performance.deficitPercentage))})
            </span>
          </p>
        </div>
      </div>
      
      {/* Alerte si déficit */}
      {performance.deficit > 0 && performance.deficitPercentage > 5 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Alerte de rendement</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Le rendement réel est inférieur au rendement promis de {formatPercentage(performance.deficitPercentage)}.</p>
                <p className="mt-1">Pour combler cet écart, vous devriez viser un APR moyen de <strong>{performance.recommendedAPR.toFixed(2)}%</strong> sur vos positions.</p>
                <p className="mt-2 font-medium">Recommandation: Envisagez de déplacer vos fonds vers des pools à rendement plus élevé.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Section d'enregistrement des dépôts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Enregistrement des dépôts</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newDeposit.date}
              onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              value={newDeposit.amount}
              onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
              placeholder="Montant"
              className="w-full p-2 border rounded-md"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <select
              value={newDeposit.token}
              onChange={(e) => setNewDeposit({...newDeposit, token: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="BUSD">BUSD</option>
              <option value="BNB">BNB</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">APY Promis (%)</label>
            <input
              type="number"
              value={newDeposit.promisedAPY}
              onChange={(e) => setNewDeposit({...newDeposit, promisedAPY: e.target.value})}
              placeholder="APY en %"
              className="w-full p-2 border rounded-md"
              step="0.1"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={addDeposit}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Ajouter
            </button>
          </div>
        </div>
        
        {/* Tableau des dépôts */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY Promis</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendement/jour</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-sm text-gray-500 text-center">
                    Aucun dépôt enregistré
                  </td>
                </tr>
              ) : (
                deposits.map(deposit => {
                  const dailyReturn = deposit.amount * (deposit.promisedAPY / 100 / 365);
                  
                  return (
                    <tr key={deposit.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(deposit.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {deposit.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {deposit.token}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {deposit.promisedAPY}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(dailyReturn)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => removeDeposit(deposit.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Section Positions de Staking */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Positions de Staking Actives</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {lastUpdate ? (
                <span>Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</span>
              ) : (
                <span>Jamais mis à jour</span>
              )}
            </div>
            <button
              onClick={fetchStakingPositions}
              disabled={isLoading}
              className={`flex items-center px-3 py-1 rounded-md border ${isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Chargement...' : 'Rafraîchir'}
            </button>
          </div>
        </div>
        
        {/* Tableau des positions */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LP Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur (USD)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Récompenses Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/jour</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                    Chargement des positions...
                  </td>
                </tr>
              ) : stakingPositions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                    Aucune position de staking active trouvée
                  </td>
                </tr>
              ) : (
                stakingPositions.map((position) => (
                  <tr key={position.pid}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {position.poolName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {position.amountStaked.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.stakedValueUSD)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                      {position.pendingReward.toFixed(6)} CAKE
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {position.estimatedAPR.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(position.dailyRewardUSD)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {stakingPositions.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(stakingPositions.reduce((sum, pos) => sum + pos.stakedValueUSD, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    {stakingPositions.reduce((sum, pos) => sum + pos.pendingReward, 0).toFixed(6)} CAKE
                  </td>
                  <td></td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    {formatCurrency(performance.totalActualDaily)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      {/* Section Recommandations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 border rounded-lg ${performance.deficit > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <h4 className="font-medium text-gray-800 mb-2">État actuel</h4>
            
            {performance.deficit > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Pour combler l'écart actuel de <strong>{formatCurrency(performance.deficit)}</strong> par jour, 
                  vous devriez viser un APR moyen de <strong className="text-red-600">{performance.recommendedAPR.toFixed(2)}%</strong> sur vos positions.
                </p>
                
                <div className="space-y-1 mt-3">
                  <p className="text-sm font-medium text-gray-700">Options pour augmenter le rendement:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Déplacer vos fonds vers des pools à APR plus élevé comme CAKE-USDT Boosted (42.5%)</li>
                    <li>Augmenter le capital investi dans les pools actuels</li>
                    <li>Diversifier dans des pools plus récents avec des récompenses plus élevées</li>
                    <li>Ajuster les rendements promis aux utilisateurs</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Félicitations! Votre rendement réel de <strong>{formatCurrency(performance.totalActualDaily)}</strong> par jour
                  dépasse le rendement promis.
                </p>
                
                <div className="space-y-1 mt-3">
                  <p className="text-sm font-medium text-gray-700">Recommandations:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Maintenir la stratégie actuelle</li>
                    <li>Créer une réserve avec l'excédent pour les périodes difficiles</li>
                    <li>Envisager d'augmenter légèrement les rendements promis</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2">Meilleurs pools recommandés</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">CAKE-USDT Boosted</p>
                  <p className="text-xs text-gray-500">Risque: Moyen</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">42.5% APR</p>
                  <p className="text-xs text-gray-500">~$0.23/jour pour 2 LP</p>
                </div>
              </div>
              
              <div className="flex justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">Nouveaux pools</p>
                  <p className="text-xs text-red-500">Risque: Élevé</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">80-150% APR</p>
                  <p className="text-xs text-gray-500">~$0.44-0.82/jour pour 2 LP</p>
                </div>
              </div>
              
              <div className="flex justify-between p-3 bg-white rounded border">
                <div>
                  <p className="font-medium">CAKE-BNB</p>
                  <p className="text-xs text-green-500">Risque: Faible</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">15.5% APR</p>
                  <p className="text-xs text-gray-500">~$0.08/jour pour 2 LP</p>
                </div>
              </div>
              
              <div className="mt-4">
                <a 
                  href="https://pancakeswap.finance/farms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  Voir tous les pools sur PancakeSwap
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}