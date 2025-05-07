// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StakingManager.sol";
import "./access/Ownable.sol";

/**
 * @title MonitoringInterface
 * @dev Contrat pour fournir une interface de surveillance aux utilisateurs
 * @author Bolt AI
 */
contract MonitoringInterface is Ownable {
    // Référence au gestionnaire de staking
    StakingManager public stakingManager;
    
    // Structure pour les données d'utilisateur
    struct UserStakingData {
        address stakingContract;
        uint256 poolId;
        uint256 amount;
        uint256 pendingRewards;
        uint256 lastStakeTime;
        bool isActive;
    }
    
    // Événements
    event UserRegistered(address indexed user);
    event UserDataFetched(address indexed user, uint256 totalStaked, uint256 totalRewards);

    /**
     * @dev Constructeur du contrat
     * @param _stakingManager Adresse du gestionnaire de staking
     */
    constructor(StakingManager _stakingManager) Ownable(msg.sender) {
        stakingManager = _stakingManager;
    }

    /**
     * @dev Met à jour le gestionnaire de staking
     * @param _newManager Nouvelle adresse du gestionnaire
     */
    function updateStakingManager(StakingManager _newManager) external onlyOwner {
        require(address(_newManager) != address(0), "Adresse invalide");
        stakingManager = _newManager;
    }

    /**
     * @dev Obtient les données de staking d'un utilisateur
     * @param _user Adresse de l'utilisateur
     */
    function getUserStakingData(address _user) external returns (
        UserStakingData[] memory stakingData,
        uint256 totalStakedAmount,
        uint256 totalPendingRewards
    ) {
        uint256 instanceCount = stakingManager.getStakingInstanceCount();
        
        // Première passe: compter le nombre total de pools où l'utilisateur stake
        uint256 totalUserPools = 0;
        
        for (uint256 i = 0; i < instanceCount; i++) {
            (
                address contractAddress,
                ,
                bool isActive,
                ,
                ,
                ,
                uint256 poolCount
            ) = stakingManager.getStakingInstanceDetails(i);
            
            if (isActive) {
                StakingPancakeSwap stakingContract = StakingPancakeSwap(contractAddress);
                
                if (stakingContract.isUserStaking(_user)) {
                    uint256[] memory userPools = stakingContract.getUserPools(_user);
                    totalUserPools += userPools.length;
                }
            }
        }
        
        // Allouer le tableau de résultats
        stakingData = new UserStakingData[](totalUserPools);
        
        // Deuxième passe: remplir les données
        uint256 dataIndex = 0;
        totalStakedAmount = 0;
        totalPendingRewards = 0;
        
        for (uint256 i = 0; i < instanceCount; i++) {
            (
                address contractAddress,
                ,
                bool isActive,
                ,
                ,
                ,
                uint256 poolCount
            ) = stakingManager.getStakingInstanceDetails(i);
            
            if (isActive) {
                StakingPancakeSwap stakingContract = StakingPancakeSwap(contractAddress);
                
                if (stakingContract.isUserStaking(_user)) {
                    uint256[] memory userPools = stakingContract.getUserPools(_user);
                    
                    for (uint256 j = 0; j < userPools.length; j++) {
                        uint256 poolId = userPools[j];
                        
                        (
                            uint256 amount,
                            ,
                            uint256 pendingRewards,
                            uint256 lastStakeTime,
                            bool isStaking
                        ) = stakingContract.getUserInfo(poolId, _user);
                        
                        if (isStaking) {
                            stakingData[dataIndex] = UserStakingData({
                                stakingContract: contractAddress,
                                poolId: poolId,
                                amount: amount,
                                pendingRewards: pendingRewards,
                                lastStakeTime: lastStakeTime,
                                isActive: true
                            });
                            
                            totalStakedAmount += amount;
                            totalPendingRewards += pendingRewards;
                            
                            dataIndex++;
                        }
                    }
                }
            }
        }
        
        emit UserDataFetched(_user, totalStakedAmount, totalPendingRewards);
        
        return (stakingData, totalStakedAmount, totalPendingRewards);
    }

    /**
     * @dev Vérifie si un utilisateur stake dans un pool spécifique
     * @param _user Adresse de l'utilisateur
     * @param _stakingContract Adresse du contrat de staking
     * @param _pid ID du pool
     */
    function isUserStakingInPool(address _user, address _stakingContract, uint256 _pid) external view returns (bool) {
        require(stakingManager.isRegisteredContract(_stakingContract), unicode"Contrat non enregistre");
        
        StakingPancakeSwap stakingContract = StakingPancakeSwap(_stakingContract);
        (
            ,
            ,
            ,
            ,
            bool isStaking
        ) = stakingContract.getUserInfo(_pid, _user);
        
        return isStaking;
    }

    /**
     * @dev Obtient des détails sur un pool spécifique
     * @param _stakingContract Adresse du contrat de staking
     * @param _pid ID du pool
     */
    function getPoolDetails(address _stakingContract, uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 totalStaked,
        bool isActive,
        uint256 apr
    ) {
        require(stakingManager.isRegisteredContract(_stakingContract), unicode"Contrat non enregistré");
        
        StakingPancakeSwap stakingContract = StakingPancakeSwap(_stakingContract);
        
        (
            lpToken,
            allocPoint,
            ,
            ,
            totalStaked,
            isActive
        ) = stakingContract.getPoolInfo(_pid);
        
        // Calcul approximatif de l'APR (dépend de la logique spécifique du contrat)
        // Ceci est une approximation simplifiée
        uint256 rewardPerBlock = stakingContract.rewardPerBlock();
        uint256 totalAllocPoint = stakingContract.totalAllocPoint();
        
        if (totalAllocPoint > 0 && totalStaked > 0) {
            // Calculer la part des récompenses allouées à ce pool
            uint256 poolRewardPerBlock = rewardPerBlock * allocPoint / totalAllocPoint;
            
            // Estimer les récompenses sur une année
            // ~10512000 blocs par an (en supposant un bloc toutes les 3 secondes)
            uint256 yearlyRewards = poolRewardPerBlock * 10512000;
            
            // Calculer l'APR
            apr = yearlyRewards * 100 / totalStaked;
        } else {
            apr = 0;
        }
        
        return (lpToken, allocPoint, totalStaked, isActive, apr);
    }

    /**
     * @dev Obtient un résumé global pour un utilisateur
     * @param _user Adresse de l'utilisateur
     */
    function getUserSummary(address _user) external view returns (
        uint256 totalStakingContracts,
        uint256 totalPools,
        uint256 totalStaked,
        uint256 totalRewards,
        uint256 stakingSince
    ) {
        uint256 instanceCount = stakingManager.getStakingInstanceCount();
        uint256 firstStakeTime = type(uint256).max;
        
        for (uint256 i = 0; i < instanceCount; i++) {
            (
                address contractAddress,
                ,
                bool isActive,
                ,
                ,
                ,
                
            ) = stakingManager.getStakingInstanceDetails(i);
            
            if (isActive) {
                StakingPancakeSwap stakingContract = StakingPancakeSwap(contractAddress);
                
                if (stakingContract.isUserStaking(_user)) {
                    totalStakingContracts++;
                    
                    uint256[] memory userPools = stakingContract.getUserPools(_user);
                    totalPools += userPools.length;
                    
                    for (uint256 j = 0; j < userPools.length; j++) {
                        uint256 poolId = userPools[j];
                        
                        (
                            uint256 amount,
                            ,
                            uint256 pendingRewards,
                            uint256 lastStakeTime,
                            bool isStaking
                        ) = stakingContract.getUserInfo(poolId, _user);
                        
                        if (isStaking) {
                            totalStaked += amount;
                            totalRewards += pendingRewards;
                            
                            // Rechercher la date de première mise en stake
                            if (lastStakeTime < firstStakeTime) {
                                firstStakeTime = lastStakeTime;
                            }
                        }
                    }
                }
            }
        }
        
        stakingSince = firstStakeTime == type(uint256).max ? 0 : firstStakeTime;
        
        return (totalStakingContracts, totalPools, totalStaked, totalRewards, stakingSince);
    }
}