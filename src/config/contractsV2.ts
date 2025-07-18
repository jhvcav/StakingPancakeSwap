
import { Address } from 'viem';

export const STAKING_MANAGER_ADDRESS = '0xAd570f6F61655fE688483f2e46eab3b0A034d76f' as Address;
export const MONITORING_INTERFACE_ADDRESS = '0x0cEA474e80467355046def86677F5561DcB1e598' as Address;
export const ADMIN_DASHBOARD_ADDRESS = '0xa59cE5448b929b5508A800627230f289Dd8828f2' as Address;
export const STAKING_PANCAKESWAP_ADDRESS = '0x692fcF8Eb63c6795750db6c9d64b966fA9770128' as Address;
export const PANCAKE_ROUTER_ADDRESS= '0x10ED43C718714eb63d5aA57B78B54704E256024E' as Address;
export const BLOCK_EXPLORER_URL= 'https://bscscan.com' as string;

// ABIs pour l'interaction frontend
export const STAKING_MANAGER_ABI = [{"type":"constructor","stateMutability":"undefined","payable":false,"inputs":[]},{"type":"event","anonymous":false,"name":"GlobalStatsUpdated","inputs":[{"type":"uint256","name":"tvl","indexed":false},{"type":"uint256","name":"users","indexed":false},{"type":"uint256","name":"pools","indexed":false}]},{"type":"event","anonymous":false,"name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}]},{"type":"event","anonymous":false,"name":"StakingInstanceAdded","inputs":[{"type":"address","name":"stakingContract","indexed":true},{"type":"string","name":"name","indexed":false}]},{"type":"event","anonymous":false,"name":"StakingInstanceUpdated","inputs":[{"type":"address","name":"stakingContract","indexed":true},{"type":"bool","name":"isActive","indexed":false}]},{"type":"function","name":"addStakingInstance","constant":false,"payable":false,"inputs":[{"type":"address","name":"_stakingContract"},{"type":"string","name":"_name"}],"outputs":[]},{"type":"function","name":"getGlobalStatsSummary","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":"totalStakingInstances"},{"type":"uint256","name":"activeInstances"},{"type":"uint256","name":"tvl"},{"type":"uint256","name":"users"},{"type":"uint256","name":"pools"}]},{"type":"function","name":"getPendingRewards","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_stakingContract"},{"type":"uint256","name":"_pid"},{"type":"address","name":"_user"}],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"getPoolsForLpToken","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_lpToken"}],"outputs":[{"type":"address[]","name":""}]},{"type":"function","name":"getStakingInstanceCount","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"getStakingInstanceDetails","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_index"}],"outputs":[{"type":"address","name":"contractAddress"},{"type":"string","name":"name"},{"type":"bool","name":"isActive"},{"type":"uint256","name":"createdAt"},{"type":"uint256","name":"tvl"},{"type":"uint256","name":"users"},{"type":"uint256","name":"poolCount"}]},{"type":"function","name":"isRegisteredContract","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"isUserStaking","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_stakingContract"},{"type":"address","name":"_user"}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"owner","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"poolsByLpToken","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""},{"type":"uint256","name":""}],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"registerPoolByLpToken","constant":false,"payable":false,"inputs":[{"type":"address","name":"_stakingContract"},{"type":"address","name":"_lpToken"}],"outputs":[]},{"type":"function","name":"renounceOwnership","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"stakingInstances","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""}],"outputs":[{"type":"address","name":"stakingContract"},{"type":"string","name":"name"},{"type":"bool","name":"isActive"},{"type":"uint256","name":"createdAt"}]},{"type":"function","name":"totalPools","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"totalUsers","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"totalValueLockedUSD","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"transferOwnership","constant":false,"payable":false,"inputs":[{"type":"address","name":"newOwner"}],"outputs":[]},{"type":"function","name":"updateGlobalStats","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"updateStakingInstance","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_index"},{"type":"bool","name":"_isActive"}],"outputs":[]}];
export const MONITORING_INTERFACE_ABI = [{"type":"constructor","stateMutability":"undefined","payable":false,"inputs":[{"type":"address","name":"_stakingManager"}]},{"type":"event","anonymous":false,"name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}]},{"type":"event","anonymous":false,"name":"UserDataFetched","inputs":[{"type":"address","name":"user","indexed":true},{"type":"uint256","name":"totalStaked","indexed":false},{"type":"uint256","name":"totalRewards","indexed":false}]},{"type":"event","anonymous":false,"name":"UserRegistered","inputs":[{"type":"address","name":"user","indexed":true}]},{"type":"function","name":"getPoolDetails","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_stakingContract"},{"type":"uint256","name":"_pid"}],"outputs":[{"type":"address","name":"lpToken"},{"type":"uint256","name":"allocPoint"},{"type":"uint256","name":"totalStaked"},{"type":"bool","name":"isActive"},{"type":"uint256","name":"apr"}]},{"type":"function","name":"getUserStakingData","constant":false,"payable":false,"inputs":[{"type":"address","name":"_user"}],"outputs":[{"type":"tuple[]","name":"stakingData","components":[{"type":"address","name":"stakingContract"},{"type":"uint256","name":"poolId"},{"type":"uint256","name":"amount"},{"type":"uint256","name":"pendingRewards"},{"type":"uint256","name":"lastStakeTime"},{"type":"bool","name":"isActive"}]},{"type":"uint256","name":"totalStakedAmount"},{"type":"uint256","name":"totalPendingRewards"}]},{"type":"function","name":"getUserSummary","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_user"}],"outputs":[{"type":"uint256","name":"totalStakingContracts"},{"type":"uint256","name":"totalPools"},{"type":"uint256","name":"totalStaked"},{"type":"uint256","name":"totalRewards"},{"type":"uint256","name":"stakingSince"}]},{"type":"function","name":"isUserStakingInPool","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_user"},{"type":"address","name":"_stakingContract"},{"type":"uint256","name":"_pid"}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"owner","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"renounceOwnership","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"stakingManager","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"transferOwnership","constant":false,"payable":false,"inputs":[{"type":"address","name":"newOwner"}],"outputs":[]},{"type":"function","name":"updateStakingManager","constant":false,"payable":false,"inputs":[{"type":"address","name":"_newManager"}],"outputs":[]}];
export const ADMIN_DASHBOARD_ABI = [{"type":"constructor","stateMutability":"undefined","payable":false,"inputs":[{"type":"address","name":"_stakingManager"}]},{"type":"event","anonymous":false,"name":"AdminAdded","inputs":[{"type":"address","name":"admin","indexed":true}]},{"type":"event","anonymous":false,"name":"AdminRemoved","inputs":[{"type":"address","name":"admin","indexed":true}]},{"type":"event","anonymous":false,"name":"AnalyticsRecorded","inputs":[{"type":"uint256","name":"timestamp","indexed":false},{"type":"uint256","name":"tvl","indexed":false},{"type":"uint256","name":"users","indexed":false},{"type":"uint256","name":"pools","indexed":false}]},{"type":"event","anonymous":false,"name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}]},{"type":"event","anonymous":false,"name":"RecordIntervalUpdated","inputs":[{"type":"uint256","name":"oldInterval","indexed":false},{"type":"uint256","name":"newInterval","indexed":false}]},{"type":"function","name":"addAdmin","constant":false,"payable":false,"inputs":[{"type":"address","name":"_admin"}],"outputs":[]},{"type":"function","name":"admins","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"analyticsHistory","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""}],"outputs":[{"type":"uint256","name":"timestamp"},{"type":"uint256","name":"tvl"},{"type":"uint256","name":"users"},{"type":"uint256","name":"pools"}]},{"type":"function","name":"calculateGrowth","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_startIndex"},{"type":"uint256","name":"_endIndex"}],"outputs":[{"type":"int256","name":"tvlGrowth"},{"type":"int256","name":"usersGrowth"},{"type":"int256","name":"poolsGrowth"}]},{"type":"function","name":"forceRecordAnalytics","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"getAnalyticsCount","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"getRecentAnalytics","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_count"}],"outputs":[{"type":"uint256[]","name":"timestamps"},{"type":"uint256[]","name":"tvls"},{"type":"uint256[]","name":"userCounts"},{"type":"uint256[]","name":"poolCounts"}]},{"type":"function","name":"isAdmin","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_address"}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"lastRecordTimestamp","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"owner","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"recordAnalytics","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"recordInterval","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"removeAdmin","constant":false,"payable":false,"inputs":[{"type":"address","name":"_admin"}],"outputs":[]},{"type":"function","name":"renounceOwnership","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"stakingManager","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"transferOwnership","constant":false,"payable":false,"inputs":[{"type":"address","name":"newOwner"}],"outputs":[]},{"type":"function","name":"updateRecordInterval","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_newInterval"}],"outputs":[]},{"type":"function","name":"updateStakingManager","constant":false,"payable":false,"inputs":[{"type":"address","name":"_newManager"}],"outputs":[]}];
export const STAKING_PANCAKESWAP_ABI = [{"type":"constructor","stateMutability":"undefined","payable":false,"inputs":[{"type":"address","name":"_rewardToken"},{"type":"uint256","name":"_rewardPerBlock"},{"type":"uint256","name":"_startBlock"},{"type":"address","name":"_pancakeRouter"}]},{"type":"event","anonymous":false,"name":"Deposit","inputs":[{"type":"address","name":"user","indexed":true},{"type":"uint256","name":"pid","indexed":true},{"type":"uint256","name":"amount","indexed":false}]},{"type":"event","anonymous":false,"name":"EmergencyWithdraw","inputs":[{"type":"address","name":"user","indexed":true},{"type":"uint256","name":"pid","indexed":true},{"type":"uint256","name":"amount","indexed":false}]},{"type":"event","anonymous":false,"name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}]},{"type":"event","anonymous":false,"name":"PoolAdded","inputs":[{"type":"uint256","name":"pid","indexed":true},{"type":"address","name":"lpToken","indexed":false},{"type":"uint256","name":"allocPoint","indexed":false}]},{"type":"event","anonymous":false,"name":"PoolUpdated","inputs":[{"type":"uint256","name":"pid","indexed":true},{"type":"uint256","name":"allocPoint","indexed":false},{"type":"bool","name":"isActive","indexed":false}]},{"type":"event","anonymous":false,"name":"RewardClaimed","inputs":[{"type":"address","name":"user","indexed":true},{"type":"uint256","name":"pid","indexed":true},{"type":"uint256","name":"amount","indexed":false}]},{"type":"event","anonymous":false,"name":"RewardRateUpdated","inputs":[{"type":"uint256","name":"oldRate","indexed":false},{"type":"uint256","name":"newRate","indexed":false}]},{"type":"event","anonymous":false,"name":"StakingPeriodUpdated","inputs":[{"type":"uint256","name":"oldPeriod","indexed":false},{"type":"uint256","name":"newPeriod","indexed":false}]},{"type":"event","anonymous":false,"name":"Withdraw","inputs":[{"type":"address","name":"user","indexed":true},{"type":"uint256","name":"pid","indexed":true},{"type":"uint256","name":"amount","indexed":false}]},{"type":"event","anonymous":false,"name":"WithdrawalFeeUpdated","inputs":[{"type":"uint256","name":"oldFee","indexed":false},{"type":"uint256","name":"newFee","indexed":false}]},{"type":"function","name":"addPool","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_allocPoint"},{"type":"address","name":"_lpToken"},{"type":"bool","name":"_withUpdate"}],"outputs":[]},{"type":"function","name":"claimReward","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"}],"outputs":[]},{"type":"function","name":"deposit","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"},{"type":"uint256","name":"_amount"}],"outputs":[]},{"type":"function","name":"earlyWithdrawalFee","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"emergencyWithdraw","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"}],"outputs":[]},{"type":"function","name":"getPoolInfo","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_pid"}],"outputs":[{"type":"address","name":"lpToken"},{"type":"uint256","name":"allocPoint"},{"type":"uint256","name":"lastRewardBlock"},{"type":"uint256","name":"accRewardPerShare"},{"type":"uint256","name":"totalStaked"},{"type":"bool","name":"isActive"}]},{"type":"function","name":"getTotalValueLockedUSD","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"getUserInfo","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_pid"},{"type":"address","name":"_user"}],"outputs":[{"type":"uint256","name":"amount"},{"type":"uint256","name":"rewardDebt"},{"type":"uint256","name":"pendingRewards"},{"type":"uint256","name":"lastStakeTime"},{"type":"bool","name":"isStaking"}]},{"type":"function","name":"getUserPools","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_user"}],"outputs":[{"type":"uint256[]","name":""}]},{"type":"function","name":"isUserStaking","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""}],"outputs":[{"type":"bool","name":""}]},{"type":"function","name":"massUpdatePools","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"minStakingPeriod","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"owner","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"pancakeRouter","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"pendingReward","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"_pid"},{"type":"address","name":"_user"}],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"poolInfo","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""}],"outputs":[{"type":"address","name":"lpToken"},{"type":"uint256","name":"allocPoint"},{"type":"uint256","name":"lastRewardBlock"},{"type":"uint256","name":"accRewardPerShare"},{"type":"uint256","name":"totalStaked"},{"type":"bool","name":"isActive"}]},{"type":"function","name":"poolLength","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"recoverToken","constant":false,"payable":false,"inputs":[{"type":"address","name":"_token"}],"outputs":[]},{"type":"function","name":"renounceOwnership","constant":false,"payable":false,"inputs":[],"outputs":[]},{"type":"function","name":"rewardPerBlock","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"rewardToken","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},{"type":"function","name":"startBlock","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"totalAllocPoint","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"totalUsersStaking","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"totalValueLocked","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"transferOwnership","constant":false,"payable":false,"inputs":[{"type":"address","name":"newOwner"}],"outputs":[]},{"type":"function","name":"updateEarlyWithdrawalFee","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_earlyWithdrawalFee"}],"outputs":[]},{"type":"function","name":"updateMinStakingPeriod","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_minStakingPeriod"}],"outputs":[]},{"type":"function","name":"updatePool","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"},{"type":"uint256","name":"_allocPoint"},{"type":"bool","name":"_isActive"},{"type":"bool","name":"_withUpdate"}],"outputs":[]},{"type":"function","name":"updatePoolRewards","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"}],"outputs":[]},{"type":"function","name":"updateRewardPerBlock","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_rewardPerBlock"}],"outputs":[]},{"type":"function","name":"userInfo","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""},{"type":"address","name":""}],"outputs":[{"type":"uint256","name":"amount"},{"type":"uint256","name":"rewardDebt"},{"type":"uint256","name":"pendingRewards"},{"type":"uint256","name":"lastStakeTime"},{"type":"bool","name":"isStaking"}]},{"type":"function","name":"userPools","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""},{"type":"uint256","name":""}],"outputs":[{"type":"uint256","name":""}]},{"type":"function","name":"withdraw","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_pid"},{"type":"uint256","name":"_amount"}],"outputs":[]}];
export const PANCAKE_ROUTER_ABI = [
    // Fonction addLiquidity
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amountADesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBDesired",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountAMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "addLiquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "liquidity",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Fonction removeLiquidity
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "liquidity",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountAMin",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountBMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "name": "removeLiquidity",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Fonction getAmountsOut
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "address[]",
          "name": "path",
          "type": "address[]"
        }
      ],
      "name": "getAmountsOut",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  // ABI standard ERC20
  export const ERC20_ABI = [
    // Fonction balanceOf
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    },
    // Fonction approve
    {
      "constant": false,
      "inputs": [
        {"name": "_spender", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    // Fonction transfer
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    // Fonction allowance
    {
      "constant": true,
      "inputs": [
        {"name": "_owner", "type": "address"},
        {"name": "_spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    // Fonction decimals
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{"name": "", "type": "uint8"}],
      "type": "function"
    },
    // Fonction symbol
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function"
    },
    // Fonction name
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function"
    },
    // Fonction totalSupply
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    }
  ];
  
  // Pour le dev/test, vous pouvez définir des adresses simulées
  export const DEV_TOKENS = {
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    CAKE_BNB_LP: "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0",
    BUSD_BNB_LP: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"
  };