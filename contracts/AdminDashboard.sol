// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StakingManager.sol";
import "./access/Ownable.sol";

/**
 * @title AdminDashboard
 * @dev Contrat pour fournir des fonctionnalités de tableau de bord administratif pour la gestion de staking
 * @author Bolt AI
 */
contract AdminDashboard is Ownable {
    // Référence au gestionnaire de staking
    StakingManager public stakingManager;
    
    // Structure pour les données analytiques
    struct AnalyticsData {
        uint256 timestamp;
        uint256 tvl;
        uint256 users;
        uint256 pools;
    }
    
    // Tableau pour stocker l'historique des données
    AnalyticsData[] public analyticsHistory;
    
    // Intervalle d'enregistrement des données (par défaut: 1 jour)
    uint256 public recordInterval = 1 days;
    uint256 public lastRecordTimestamp;
    
    // Administrateurs autorisés
    mapping(address => bool) public admins;
    
    // Événements
    event AnalyticsRecorded(uint256 timestamp, uint256 tvl, uint256 users, uint256 pools);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event RecordIntervalUpdated(uint256 oldInterval, uint256 newInterval);

    /**
     * @dev Modificateur pour restreindre l'accès aux administrateurs
     */
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), unicode"Non autorise");
        _;
    }

    /**
     * @dev Constructeur du contrat
     * @param _stakingManager Adresse du gestionnaire de staking
     */
    constructor(StakingManager _stakingManager) Ownable(msg.sender) {
        stakingManager = _stakingManager;
        admins[msg.sender] = true;
        lastRecordTimestamp = block.timestamp;
    }

    /**
     * @dev Ajoute un administrateur
     * @param _admin Adresse du nouvel administrateur
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Adresse invalide");
        require(!admins[_admin], unicode"Déjà administrateur");
        
        admins[_admin] = true;
        
        emit AdminAdded(_admin);
    }

    /**
     * @dev Supprime un administrateur
     * @param _admin Adresse de l'administrateur à supprimer
     */
    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Pas un administrateur");
        require(_admin != owner(), unicode"Impossible de supprimer le propriétaire");
        
        admins[_admin] = false;
        
        emit AdminRemoved(_admin);
    }

    /**
     * @dev Met à jour l'intervalle d'enregistrement des données
     * @param _newInterval Nouvel intervalle en secondes
     */
    function updateRecordInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval > 0, "Intervalle invalide");
        
        uint256 oldInterval = recordInterval;
        recordInterval = _newInterval;
        
        emit RecordIntervalUpdated(oldInterval, _newInterval);
    }

    /**
     * @dev Enregistre les données analytiques actuelles
     */
    function recordAnalytics() external onlyAdmin {
        require(block.timestamp >= lastRecordTimestamp + recordInterval, unicode"Intervalle non écoulé");
        
        // Obtenir les statistiques globales
        (
            ,
            ,
            uint256 tvl,
            uint256 users,
            uint256 pools
        ) = stakingManager.getGlobalStatsSummary();
        
        // Enregistrer les données
        analyticsHistory.push(AnalyticsData({
            timestamp: block.timestamp,
            tvl: tvl,
            users: users,
            pools: pools
        }));
        
        lastRecordTimestamp = block.timestamp;
        
        emit AnalyticsRecorded(block.timestamp, tvl, users, pools);
    }

    /**
     * @dev Force l'enregistrement des données analytiques
     */
    function forceRecordAnalytics() external onlyOwner {
        // Obtenir les statistiques globales
        (
            ,
            ,
            uint256 tvl,
            uint256 users,
            uint256 pools
        ) = stakingManager.getGlobalStatsSummary();
        
        // Enregistrer les données
        analyticsHistory.push(AnalyticsData({
            timestamp: block.timestamp,
            tvl: tvl,
            users: users,
            pools: pools
        }));
        
        lastRecordTimestamp = block.timestamp;
        
        emit AnalyticsRecorded(block.timestamp, tvl, users, pools);
    }

    /**
     * @dev Obtient les données analytiques récentes
     * @param _count Nombre d'enregistrements à récupérer (0 pour tous)
     */
    function getRecentAnalytics(uint256 _count) external view returns (
        uint256[] memory timestamps,
        uint256[] memory tvls,
        uint256[] memory userCounts,
        uint256[] memory poolCounts
    ) {
        uint256 length = analyticsHistory.length;
        uint256 count = _count == 0 || _count > length ? length : _count;
        
        timestamps = new uint256[](count);
        tvls = new uint256[](count);
        userCounts = new uint256[](count);
        poolCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 index = length - count + i;
            AnalyticsData storage data = analyticsHistory[index];
            
            timestamps[i] = data.timestamp;
            tvls[i] = data.tvl;
            userCounts[i] = data.users;
            poolCounts[i] = data.pools;
        }
        
        return (timestamps, tvls, userCounts, poolCounts);
    }

    /**
     * @dev Obtient le nombre de points de données analytiques
     */
    function getAnalyticsCount() external view returns (uint256) {
        return analyticsHistory.length;
    }

    /**
     * @dev Calcule la croissance entre deux points
     * @param _startIndex Index de départ
     * @param _endIndex Index de fin
     */
    function calculateGrowth(uint256 _startIndex, uint256 _endIndex) external view returns (
        int256 tvlGrowth,
        int256 usersGrowth,
        int256 poolsGrowth
    ) {
        require(_startIndex < analyticsHistory.length, unicode"Index de départ invalide");
        require(_endIndex < analyticsHistory.length, "Index de fin invalide");
        require(_startIndex < _endIndex, unicode"L'index de départ doit être inférieur à l'index de fin");
        
        AnalyticsData storage startData = analyticsHistory[_startIndex];
        AnalyticsData storage endData = analyticsHistory[_endIndex];
        
        // Calcul de la croissance en pourcentage
        if (startData.tvl > 0) {
            tvlGrowth = int256((endData.tvl * 100) / startData.tvl) - 100;
        } else {
            tvlGrowth = endData.tvl > 0 ? int256(100) : int256(0);
        }
        
        if (startData.users > 0) {
            usersGrowth = int256((endData.users * 100) / startData.users) - 100;
        } else {
            usersGrowth = endData.users > 0 ? int256(100) : int256(0);
        }
        
        if (startData.pools > 0) {
            poolsGrowth = int256((endData.pools * 100) / startData.pools) - 100;
        } else {
            poolsGrowth = endData.pools > 0 ? int256(100) : int256(0);
        }
        
        return (tvlGrowth, usersGrowth, poolsGrowth);
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
     * @dev Vérifie si une adresse est administrateur
     * @param _address Adresse à vérifier
     */
    function isAdmin(address _address) external view returns (bool) {
        return admins[_address] || _address == owner();
    }
}