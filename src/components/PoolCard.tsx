import React, { useState } from 'react';
import { CakeIcon, ArrowUpIcon, ArrowDownIcon, GiftIcon } from 'lucide-react';
import { StakeModal } from './StakeModal';
import { UnstakeModal } from './UnstakeModal';
import { ClaimRewardsModal } from './ClaimRewardsModal';

interface PoolCardProps {
  id: number;
  name: string;
  apr: string;
  totalStaked: string;
  userStaked: string;
  pendingRewards: string;
}

export function PoolCard({ id, name, apr, totalStaked, userStaked, pendingRewards }: PoolCardProps) {
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <CakeIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-500">APR: {apr}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Staké</p>
          <p className="font-semibold">{totalStaked} LP</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Votre Stake</span>
            <span className="font-semibold">{userStaked} LP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Récompenses</span>
            <span className="font-semibold text-purple-600">{pendingRewards} CAKE</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setIsStakeModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span>Staker</span>
          </button>
          
          <button
            onClick={() => setIsUnstakeModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            <ArrowDownIcon className="h-4 w-4" />
            <span>Retirer</span>
          </button>
          
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <GiftIcon className="h-4 w-4" />
            <span>Réclamer</span>
          </button>
        </div>
      </div>

      <StakeModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        poolId={id}
        poolName={name}
      />
      
      <UnstakeModal
        isOpen={isUnstakeModalOpen}
        onClose={() => setIsUnstakeModalOpen(false)}
        poolId={id}
        poolName={name}
        stakedAmount={userStaked}
      />
      
      <ClaimRewardsModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        poolId={id}
        poolName={name}
        pendingRewards={pendingRewards}
      />
    </div>
  );
}