import { useReadContract, useWriteContract } from 'wagmi';
import {
  ADMIN_DASHBOARD_ADDRESS,
  ADMIN_DASHBOARD_ABI,
  STAKING_MANAGER_ADDRESS,
  STAKING_MANAGER_ABI
} from '../config/contracts';

export function useAdminStatus(address?: string) {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'isAdmin',
    args: [address as `0x${string}`],
    enabled: !!address,
  });
}

export function useAnalytics() {
  return useReadContract({
    address: ADMIN_DASHBOARD_ADDRESS,
    abi: ADMIN_DASHBOARD_ABI,
    functionName: 'getRecentAnalytics',
    args: [10], // Récupérer les 10 derniers points de données
  });
}

export function usePoolManagement() {
  const { data: poolCount } = useReadContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'poolLength',
  });

  const { write: addPool } = useWriteContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'addPool',
  });

  const { write: updatePool } = useWriteContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'updatePool',
  });

  return {
    poolCount,
    addPool,
    updatePool,
  };
}

export function useEmergencyActions() {
  const { write: emergencyWithdraw } = useWriteContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'emergencyWithdraw',
  });

  const { write: pausePool } = useWriteContract({
    address: STAKING_MANAGER_ADDRESS,
    abi: STAKING_MANAGER_ABI,
    functionName: 'pausePool',
  });

  return {
    emergencyWithdraw,
    pausePool,
  };
}