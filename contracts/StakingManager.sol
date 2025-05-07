// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StakingPancakeSwap.sol";
import "./access/Ownable.sol";
import "./interfaces/IERC20.sol";

/**
 * @title StakingManager
 * @dev Contrat pour gérer et surveiller plusieurs instances de staking
 * @author Bolt AI
 */
contract StakingManager is Ownable {
    // Structure pour suivre les instances de staking
    struct StakingInstance {
        StakingPancakeSwap stakingContract;
        string name;
        bool isActive;
        uint256 createdAt;
    }

    // Tableau des instances de staking
    StakingInstance[] public stakingInstances;
    
    // Mapping pour vérifier si un contrat est enregistré
    mapping(address => bool) public isRegisteredContract;
    
    // Mapping pour suivre les pools par token LP
    mapping(address => address[]) public poolsByLpToken;
    
    // Variables pour les statistiques globales
    uint256 public totalValueLockedUSD;
    uint256 public totalUsers;
    uint256 public totalPools;
    
    // Événements
    event StakingInstanceAdded(address indexed stakingContract, string name);
    event StakingInstanceUpdated(address indexed stakingContract, bool isActive);
    event GlobalStatsUpdated(uint256 tvl, uint256 users, uint256 pools);

    /**
     * @dev Constructeur du contrat
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Ajoute une nouvelle instance de staking
     * @param _stakingContract Adresse du contrat de staking
     * @param _name Nom de l'instance
     */
    function addStakingInstance(StakingPancakeSwap _stakingContract, string memory _name) external onlyOwner {
        require(address(_stakingContract) != address(0), "Adresse de contrat invalide");
        require(!isRegisteredContract[address(_stakingContract)], unicode"Contrat deja enregistre");
        
        stakingInstances.push(StakingInstance({
            stakingContract: _stakingContract,
            name: _name,
            isActive: true,
            createdAt: block.timestamp
        }));
        
        isRegisteredContract[address(_stakingContract)] = true;
        
        emit StakingInstanceAdded(address(_stakingContract), _name);
    }

    /**
     * @dev Met à jour le statut d'une instance de staking
     * @param _index Index de l'instance
     * @param _isActive Nouveau statut d'activité
     */
    function updateStakingInstance(uint256 _index, bool _isActive) external onlyOwner {
        require(_index < stakingInstances.length, "Index invalide");
        
        stakingInstances[_index].isActive = _isActive;
        
        emit StakingInstanceUpdated(address(stakingInstances[_index].stakingContract), _isActive);
    }

    /**
     * @dev Enregistre un nouveau pool LP
     * @param _stakingContract Adresse du contrat de staking
     * @param _lpToken Adresse du token LP
     */
    function registerPoolByLpToken(address _stakingContract, address _lpToken) external {
        require(isRegisteredContract[_stakingContract], unicode"Contrat non enregistré");
        require(msg.sender == _stakingContract || msg.sender == owner(), unicode"Non autorisé");
        
        poolsByLpToken[_lpToken].push(_stakingContract);
        totalPools++;
    }

    /**
     * @dev Met à jour les statistiques globales
     */
    function updateGlobalStats() external {
        uint256 tvl = 0;
        uint256 users = 0;
        
        for (uint256 i = 0; i < stakingInstances.length; i++) {
            if (stakingInstances[i].isActive) {
                StakingPancakeSwap stakingContract = stakingInstances[i].stakingContract;
                
                // Accumule TVL
                tvl += stakingContract.totalValueLocked();
                
                // Compte les utilisateurs uniques
                users += stakingContract.totalUsersStaking();
            }
        }
        
        totalValueLockedUSD = tvl;
        totalUsers = users;
        
        emit GlobalStatsUpdated(totalValueLockedUSD, totalUsers, totalPools);
    }

    /**
     * @dev Obtient le nombre d'instances de staking
     */
    function getStakingInstanceCount() external view returns (uint256) {
        return stakingInstances.length;
    }

    /**
     * @dev Obtient les détails d'une instance de staking
     * @param _index Index de l'instance
     */
    function getStakingInstanceDetails(uint256 _index) external view returns (
        address contractAddress,
        string memory name,
        bool isActive,
        uint256 createdAt,
        uint256 tvl,
        uint256 users,
        uint256 poolCount
    ) {
        require(_index < stakingInstances.length, "Index invalide");
        
        StakingInstance storage instance = stakingInstances[_index];
        StakingPancakeSwap stakingContract = instance.stakingContract;
        
        return (
            address(stakingContract),
            instance.name,
            instance.isActive,
            instance.createdAt,
            stakingContract.totalValueLocked(),
            stakingContract.totalUsersStaking(),
            stakingContract.poolLength()
        );
    }

    /**
     * @dev Obtient les pools pour un token LP
     * @param _lpToken Adresse du token LP
     */
    function getPoolsForLpToken(address _lpToken) external view returns (address[] memory) {
        return poolsByLpToken[_lpToken];
    }

    /**
     * @dev Vérifie si un utilisateur stake dans une instance
     * @param _stakingContract Adresse du contrat de staking
     * @param _user Adresse de l'utilisateur
     */
    function isUserStaking(address _stakingContract, address _user) external view returns (bool) {
        require(isRegisteredContract[_stakingContract], unicode"Contrat non enregistré");
        
        StakingPancakeSwap stakingContract = StakingPancakeSwap(_stakingContract);
        return stakingContract.isUserStaking(_user);
    }

    /**
     * @dev Obtient les récompenses en attente pour un utilisateur dans une instance
     * @param _stakingContract Adresse du contrat de staking
     * @param _pid ID du pool
     * @param _user Adresse de l'utilisateur
     */
    function getPendingRewards(address _stakingContract, uint256 _pid, address _user) external view returns (uint256) {
        require(isRegisteredContract[_stakingContract], unicode"Contrat non enregistré");
        
        StakingPancakeSwap stakingContract = StakingPancakeSwap(_stakingContract);
        return stakingContract.pendingReward(_pid, _user);
    }

    /**
     * @dev Obtient un résumé global des statistiques
     */
    function getGlobalStatsSummary() external view returns (
        uint256 totalStakingInstances,
        uint256 activeInstances,
        uint256 tvl,
        uint256 users,
        uint256 pools
    ) {
        uint256 active = 0;
        
        for (uint256 i = 0; i < stakingInstances.length; i++) {
            if (stakingInstances[i].isActive) {
                active++;
            }
        }
        
        return (
            stakingInstances.length,
            active,
            totalValueLockedUSD,
            totalUsers,
            totalPools
        );
    }
}