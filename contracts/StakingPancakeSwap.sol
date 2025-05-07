// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IPancakePair.sol";
import "./interfaces/IERC20.sol";
import "./access/Ownable.sol";
import "./security/ReentrancyGuard.sol";
import "./utils/SafeMath.sol";

/**
 * @title StakingPancakeSwap
 * @dev Contrat de staking pour PancakeSwap permettant aux utilisateurs de staker leurs tokens LP et gagner des récompenses
 * @author Bolt AI
 */
contract StakingPancakeSwap is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Structures
    struct PoolInfo {
        IERC20 lpToken;           // Adresse du token LP à staker
        uint256 allocPoint;       // Points d'allocation pour ce pool
        uint256 lastRewardBlock;  // Dernier bloc où les récompenses ont été distribuées
        uint256 accRewardPerShare; // Récompense accumulée par part
        uint256 totalStaked;      // Montant total staké dans ce pool
        bool isActive;            // Indique si le pool est actif
    }

    struct UserInfo {
        uint256 amount;           // Montant de LP tokens stakés
        uint256 rewardDebt;       // Dette de récompense
        uint256 pendingRewards;   // Récompenses en attente
        uint256 lastStakeTime;    // Dernier moment de stake
        bool isStaking;           // Indique si l'utilisateur est en train de staker
    }

    // Variables d'état
    IERC20 public rewardToken;    // Token de récompense (généralement CAKE)
    uint256 public rewardPerBlock; // Récompense par bloc
    uint256 public startBlock;     // Bloc de démarrage
    uint256 public totalAllocPoint = 0; // Total des points d'allocation
    
    // Période minimale de staking en secondes (par défaut: 7 jours)
    uint256 public minStakingPeriod = 7 days;
    
    // Pénalité de retrait anticipé en pourcentage (par défaut: 10%)
    uint256 public earlyWithdrawalFee = 10;
    
    // Adresse du routeur PancakeSwap
    IPancakeRouter02 public pancakeRouter;
    
    // Mapping des informations de pool et utilisateurs
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    // Variables pour le suivi et monitoring
    uint256 public totalUsersStaking;
    uint256 public totalValueLocked;
    mapping(address => uint256[]) public userPools;
    mapping(address => bool) public isUserStaking;
    
    // Événements
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint, bool isActive);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event StakingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event WithdrawalFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @dev Constructeur du contrat
     * @param _rewardToken Adresse du token de récompense
     * @param _rewardPerBlock Récompense par bloc
     * @param _startBlock Bloc de démarrage
     * @param _pancakeRouter Adresse du routeur PancakeSwap
     */
    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        IPancakeRouter02 _pancakeRouter
    ) Ownable(msg.sender) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        pancakeRouter = _pancakeRouter;
    }

    /**
     * @dev Retourne le nombre de pools
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev Ajoute un nouveau pool de LP tokens
     * @param _allocPoint Points d'allocation pour ce pool
     * @param _lpToken Adresse du token LP
     * @param _withUpdate Indique s'il faut mettre à jour tous les pools
     */
    function addPool(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            totalStaked: 0,
            isActive: true
        }));
        
        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    /**
     * @dev Met à jour les points d'allocation pour un pool
     * @param _pid ID du pool
     * @param _allocPoint Nouveaux points d'allocation
     * @param _isActive Nouveau statut d'activité
     * @param _withUpdate Indique s'il faut mettre à jour tous les pools
     */
    function updatePool(uint256 _pid, uint256 _allocPoint, bool _isActive, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].isActive = _isActive;
        
        emit PoolUpdated(_pid, _allocPoint, _isActive);
    }

    /**
     * @dev Met à jour tous les pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePoolRewards(pid);
        }
    }

    /**
     * @dev Met à jour les récompenses pour un pool
     * @param _pid ID du pool
     */
    function updatePoolRewards(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number.sub(pool.lastRewardBlock);
        uint256 reward = multiplier.mul(rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        
        // Mettre à jour l'accumulation de récompense par part
        pool.accRewardPerShare = pool.accRewardPerShare.add(
            reward.mul(1e12).div(pool.totalStaked)
        );
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev Calcule les récompenses en attente pour un utilisateur
     * @param _pid ID du pool
     * @param _user Adresse de l'utilisateur
     * @return Montant des récompenses en attente
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (block.number > pool.lastRewardBlock && pool.totalStaked != 0) {
            uint256 multiplier = block.number.sub(pool.lastRewardBlock);
            uint256 reward = multiplier.mul(rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accRewardPerShare = accRewardPerShare.add(reward.mul(1e12).div(pool.totalStaked));
        }
        
        return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.pendingRewards);
    }

    /**
     * @dev Dépose des tokens LP dans un pool
     * @param _pid ID du pool
     * @param _amount Montant à déposer
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        require(_pid < poolInfo.length, "Pool inexistant");
        require(_amount > 0, unicode"Montant doit etre superieur a 0");
        require(poolInfo[_pid].isActive, "Pool inactif");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        // Calcul des récompenses en attente
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
            user.pendingRewards = user.pendingRewards.add(pending);
        }
        
        // Transfert des tokens LP
        pool.lpToken.transferFrom(msg.sender, address(this), _amount);
        pool.totalStaked = pool.totalStaked.add(_amount);
        
        // Mise à jour des informations utilisateur
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        user.lastStakeTime = block.timestamp;
        
        if (!user.isStaking) {
            user.isStaking = true;
            totalUsersStaking = totalUsersStaking.add(1);
            
            if (!isUserStaking[msg.sender]) {
                isUserStaking[msg.sender] = true;
            }
            
            userPools[msg.sender].push(_pid);
        }
        
        // Mise à jour du total verrouillé
        totalValueLocked = totalValueLocked.add(_amount);
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Retire des tokens LP d'un pool
     * @param _pid ID du pool
     * @param _amount Montant à retirer
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        require(_pid < poolInfo.length, "Pool inexistant");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Montant insuffisant");
        
        updatePoolRewards(_pid);
        
        // Calcul des récompenses en attente
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        user.pendingRewards = user.pendingRewards.add(pending);
        
        // Vérifier si le retrait est anticipé
        uint256 stakingDuration = block.timestamp.sub(user.lastStakeTime);
        uint256 withdrawalAmount = _amount;
        
        if (stakingDuration < minStakingPeriod) {
            uint256 fee = _amount.mul(earlyWithdrawalFee).div(100);
            withdrawalAmount = _amount.sub(fee);
            
            // La fee est conservée dans le contrat et ajoutée aux récompenses
            pool.totalStaked = pool.totalStaked.sub(fee);
        }
        
        // Mise à jour des informations utilisateur
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        // Mise à jour du total staké
        pool.totalStaked = pool.totalStaked.sub(_amount);
        
        // Transfert des tokens LP
        pool.lpToken.transfer(msg.sender, withdrawalAmount);
        
        // Mise à jour du total verrouillé
        totalValueLocked = totalValueLocked.sub(_amount);
        
        // Mise à jour du statut de staking de l'utilisateur
        if (user.amount == 0) {
            user.isStaking = false;
            totalUsersStaking = totalUsersStaking.sub(1);
            
            // Vérifier si l'utilisateur stake encore dans d'autres pools
            bool stillStaking = false;
            for (uint256 i = 0; i < userPools[msg.sender].length; i++) {
                uint256 pid = userPools[msg.sender][i];
                if (userInfo[pid][msg.sender].isStaking) {
                    stillStaking = true;
                    break;
                }
            }
            
            if (!stillStaking) {
                isUserStaking[msg.sender] = false;
            }
        }
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Réclame les récompenses sans retirer les tokens stakés
     * @param _pid ID du pool
     */
    function claimReward(uint256 _pid) external nonReentrant {
        require(_pid < poolInfo.length, "Pool inexistant");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        // Calcul des récompenses en attente
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        uint256 totalRewards = user.pendingRewards.add(pending);
        
        // Vérifier qu'il y a des récompenses à réclamer
        require(totalRewards > 0, unicode"Pas de récompenses à réclamer");
        
        // Réinitialiser les récompenses en attente
        user.pendingRewards = 0;
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        // Transfert des récompenses
        safeRewardTransfer(msg.sender, totalRewards);
        
        emit RewardClaimed(msg.sender, _pid, totalRewards);
    }

    /**
     * @dev Permet un retrait d'urgence sans réclamer les récompenses
     * @param _pid ID du pool
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        
        // Réinitialiser les informations utilisateur
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        user.isStaking = false;
        
        // Mise à jour du total staké
        pool.totalStaked = pool.totalStaked.sub(amount);
        
        // Transfert des tokens LP
        pool.lpToken.transfer(msg.sender, amount);
        
        // Mise à jour du total verrouillé
        totalValueLocked = totalValueLocked.sub(amount);
        
        // Mise à jour du nombre d'utilisateurs en staking
        totalUsersStaking = totalUsersStaking.sub(1);
        
        // Vérifier si l'utilisateur stake encore dans d'autres pools
        bool stillStaking = false;
        for (uint256 i = 0; i < userPools[msg.sender].length; i++) {
            uint256 pid = userPools[msg.sender][i];
            if (pid != _pid && userInfo[pid][msg.sender].isStaking) {
                stillStaking = true;
                break;
            }
        }
        
        if (!stillStaking) {
            isUserStaking[msg.sender] = false;
        }
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev Transfert sécurisé des tokens de récompense
     * @param _to Adresse du destinataire
     * @param _amount Montant à transférer
     */
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.transfer(_to, rewardBal);
        } else {
            rewardToken.transfer(_to, _amount);
        }
    }

    /**
     * @dev Met à jour le taux de récompense par bloc
     * @param _rewardPerBlock Nouveau taux de récompense
     */
    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        massUpdatePools();
        uint256 oldRate = rewardPerBlock;
        rewardPerBlock = _rewardPerBlock;
        emit RewardRateUpdated(oldRate, _rewardPerBlock);
    }

    /**
     * @dev Met à jour la période minimale de staking
     * @param _minStakingPeriod Nouvelle période minimale en secondes
     */
    function updateMinStakingPeriod(uint256 _minStakingPeriod) external onlyOwner {
        uint256 oldPeriod = minStakingPeriod;
        minStakingPeriod = _minStakingPeriod;
        emit StakingPeriodUpdated(oldPeriod, _minStakingPeriod);
    }

    /**
     * @dev Met à jour la pénalité de retrait anticipé
     * @param _earlyWithdrawalFee Nouvelle pénalité en pourcentage
     */
    function updateEarlyWithdrawalFee(uint256 _earlyWithdrawalFee) external onlyOwner {
        require(_earlyWithdrawalFee <= 20, unicode"Fee trop élevée");
        uint256 oldFee = earlyWithdrawalFee;
        earlyWithdrawalFee = _earlyWithdrawalFee;
        emit WithdrawalFeeUpdated(oldFee, _earlyWithdrawalFee);
    }

    /**
     * @dev Récupère les tokens envoyés par erreur au contrat
     * @param _token Adresse du token à récupérer
     */
    function recoverToken(IERC20 _token) external onlyOwner {
        require(address(_token) != address(rewardToken), unicode"Impossible de récupérer le token de récompense");
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(owner(), balance);
    }

    /**
     * @dev Obtient les informations détaillées d'un pool
     * @param _pid ID du pool
     * @return lpToken Adresse du token LP
     * @return allocPoint Points d'allocation
     * @return lastRewardBlock Dernier bloc de récompense
     * @return accRewardPerShare Récompense accumulée par part
     * @return totalStaked Montant total staké
     * @return isActive Statut d'activité du pool
     */
    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardBlock,
        uint256 accRewardPerShare,
        uint256 totalStaked,
        bool isActive
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardBlock,
            pool.accRewardPerShare,
            pool.totalStaked,
            pool.isActive
        );
    }

    /**
     * @dev Obtient les informations d'un utilisateur dans un pool
     * @param _pid ID du pool
     * @param _user Adresse de l'utilisateur
     * @return amount Montant staké
     * @return rewardDebt Dette de récompense
     * @return pendingRewards Récompenses en attente
     * @return lastStakeTime Dernier moment de stake
     * @return isStaking Indique si l'utilisateur est en train de staker
     */
    function getUserInfo(uint256 _pid, address _user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 pendingRewards,
        uint256 lastStakeTime,
        bool isStaking
    ) {
        UserInfo storage user = userInfo[_pid][_user];
        return (
            user.amount,
            user.rewardDebt,
            user.pendingRewards,
            user.lastStakeTime,
            user.isStaking
        );
    }

    /**
     * @dev Obtient les pools dans lesquels un utilisateur stake
     * @param _user Adresse de l'utilisateur
     * @return Liste des IDs de pool
     */
    function getUserPools(address _user) external view returns (uint256[] memory) {
        return userPools[_user];
    }

    /**
     * @dev Calculer la valeur totale verrouillée en USD
     * @return Valeur totale verrouillée en USD (avec 18 décimales)
     */
    function getTotalValueLockedUSD() external view returns (uint256) {
        uint256 totalUSDValue = 0;
        
        for (uint256 pid = 0; pid < poolInfo.length; pid++) {
            PoolInfo storage pool = poolInfo[pid];
            if (pool.totalStaked > 0) {
                // Obtenir l'adresse de la paire LP
                address lpAddress = address(pool.lpToken);
                IPancakePair pair = IPancakePair(lpAddress);
                
                // Obtenir les réserves de tokens
                (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
                
                // Simplification: utiliser BUSD/USDT/DAI comme référence USD
                // Cette partie nécessite une logique spécifique selon les paires
                // Pour simplifier, nous supposons que reserve1 est en USD
                totalUSDValue = totalUSDValue.add(reserve1.mul(2).mul(pool.totalStaked).div(pair.totalSupply()));
            }
        }
        
        return totalUSDValue;
    }
}