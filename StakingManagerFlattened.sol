// Sources flattened with hardhat v2.23.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/interfaces/IPancakeRouter01.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeRouter01
 * @dev Interface pour le routeur PancakeSwap V1
 */
interface IPancakeRouter01 {
    /**
     * @dev Retourne l'adresse de la factory
     */
    function factory() external pure returns (address);
    
    /**
     * @dev Retourne l'adresse WBNB
     */
    function WETH() external pure returns (address);

    /**
     * @dev Ajoute de la liquidité à une paire
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    
    /**
     * @dev Ajoute de la liquidité ETH à une paire
     */
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    
    /**
     * @dev Enlève de la liquidité d'une paire
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    
    /**
     * @dev Enlève de la liquidité ETH d'une paire
     */
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    
    /**
     * @dev Enlève de la liquidité avec autorisation
     */
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    
    /**
     * @dev Enlève de la liquidité ETH avec autorisation
     */
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    
    /**
     * @dev Échange des tokens exacts contre des tokens
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Échange des tokens contre des tokens exacts
     */
    function swapTokensForExactETH(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Échange des tokens exacts contre des ETH
     */
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Échange des ETH exacts contre des tokens
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    /**
     * @dev Échange des ETH pour des tokens exacts
     */
    function swapETHForExactTokens(
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    /**
     * @dev Calcule le montant d'entrée nécessaire
     */
    function getAmountIn(
        uint amountOut,
        uint reserveIn,
        uint reserveOut
    ) external pure returns (uint amountIn);
    
    /**
     * @dev Calcule le montant de sortie
     */
    function getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) external pure returns (uint amountOut);
    
    /**
     * @dev Calcule les montants
     */
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
    
    /**
     * @dev Calcule les montants d'entrée
     */
    function getAmountsIn(
        uint amountOut,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}


// File contracts/interfaces/IPancakeRouter02.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeRouter02
 * @dev Interface pour le routeur PancakeSwap V2
 */
interface IPancakeRouter02 is IPancakeRouter01 {
    /**
     * @dev Supprime la liquidité avec autorisation et montant minimum de tokens reçus
     */
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, 
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external returns (uint amountETH);

    /**
     * @dev Échange des tokens exacts contre BNB supportant les jetons avec taxe
     */
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    
    /**
     * @dev Échange des BNB exacts contre des tokens supportant les jetons avec taxe
     */
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    
    /**
     * @dev Échange des tokens exacts contre des tokens supportant les jetons avec taxe
     */
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    
    /**
     * @dev Échange des tokens contre le maximum de tokens
     */
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}


// File contracts/access/Ownable.sol

/**
 * @title Ownable
 * @dev Contrat qui fournit un contrôle d'accès de base avec un propriétaire
 */
abstract contract Ownable {
    address private _owner;

    /**
     * @dev Événement émis lorsque le propriétaire est changé
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initialise le contrat avec l'expéditeur comme propriétaire initial
     */
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Modificateur qui restreint une fonction aux appels du propriétaire
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, unicode"Ownable: l_appelant n_est pas le proprietaire");
        _;
    }

    /**
     * @dev Retourne l'adresse du propriétaire actuel
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Transfère la propriété du contrat à un nouveau compte
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), unicode"Ownable: nouveau propriétaire est l'adresse zéro");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Renonce à la propriété du contrat
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfère la propriété du contrat à un nouveau compte
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/interfaces/IERC20.sol

/**
 * @title IERC20
 * @dev Interface pour le standard ERC20
 */
interface IERC20 {
    /**
     * @dev Retourne le solde d'un compte
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @dev Retourne l'offre totale du token
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @dev Retourne le nombre de décimales du token
     */
    function decimals() external view returns (uint8);
    
    /**
     * @dev Retourne le symbole du token
     */
    function symbol() external view returns (string memory);
    
    /**
     * @dev Retourne le nom du token
     */
    function name() external view returns (string memory);
    
    /**
     * @dev Transfère des tokens à une adresse
     */
    function transfer(address recipient, uint256 amount) external returns (bool);
    
    /**
     * @dev Approuve une adresse à dépenser un certain montant
     */
    function approve(address spender, uint256 amount) external returns (bool);
    
    /**
     * @dev Retourne l'autorisation de dépense
     */
    function allowance(address owner, address spender) external view returns (uint256);
    
    /**
     * @dev Transfère des tokens d'une adresse à une autre
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    
    /**
     * @dev Événement émis lors d'un transfert de tokens
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /**
     * @dev Événement émis lors d'une approbation de dépense
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


// File contracts/interfaces/IPancakePair.sol

/**
 * @title IPancakePair
 * @dev Interface pour les paires de liquidité PancakeSwap
 */
interface IPancakePair {
    /**
     * @dev Événement émis lors d'un transfert de tokens
     */
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    /**
     * @dev Retourne le nom du token
     */
    function name() external pure returns (string memory);
    
    /**
     * @dev Retourne le symbole du token
     */
    function symbol() external pure returns (string memory);
    
    /**
     * @dev Retourne le nombre de décimales du token
     */
    function decimals() external pure returns (uint8);
    
    /**
     * @dev Retourne l'offre totale du token
     */
    function totalSupply() external view returns (uint);
    
    /**
     * @dev Retourne le solde d'un compte
     */
    function balanceOf(address owner) external view returns (uint);
    
    /**
     * @dev Retourne l'autorisation de dépense
     */
    function allowance(address owner, address spender) external view returns (uint);

    /**
     * @dev Approuve une dépense
     */
    function approve(address spender, uint value) external returns (bool);
    
    /**
     * @dev Transfère des tokens
     */
    function transfer(address to, uint value) external returns (bool);
    
    /**
     * @dev Transfère des tokens d'un compte à un autre
     */
    function transferFrom(address from, address to, uint value) external returns (bool);

    /**
     * @dev Domaine séparé pour les signatures EIP-712
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    
    /**
     * @dev Type hash pour les autorisations
     */
    function PERMIT_TYPEHASH() external pure returns (bytes32);
    
    /**
     * @dev Nonces pour les autorisations
     */
    function nonces(address owner) external view returns (uint);

    /**
     * @dev Approuve par signature
     */
    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;

    /**
     * @dev Retourne les réserves des deux tokens et le timestamp du dernier bloc
     */
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    
    /**
     * @dev Retourne l'adresse du token0
     */
    function token0() external view returns (address);
    
    /**
     * @dev Retourne l'adresse du token1
     */
    function token1() external view returns (address);

    /**
     * @dev Échange des tokens
     */
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    
    /**
     * @dev Ajoute de la liquidité
     */
    function mint(address to) external returns (uint liquidity);
    
    /**
     * @dev Brûle des tokens de liquidité
     */
    function burn(address to) external returns (uint amount0, uint amount1);
    
    /**
     * @dev Synchronise les réserves
     */
    function sync() external;
    
    /**
     * @dev Initialise la paire
     */
    function initialize(address, address) external;
}


// File contracts/security/ReentrancyGuard.sol

/**
 * @title ReentrancyGuard
 * @dev Contrat qui aide à prévenir les attaques par réentrance
 */
abstract contract ReentrancyGuard {
    // État du verrou pour éviter la réentrance
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Initialise le contrat avec un état non entré
     */
    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Modificateur qui empêche la réentrance
     */
    modifier nonReentrant() {
        require(_status != _ENTERED, unicode"ReentrancyGuard: reentrance detectee");

        _status = _ENTERED;

        _;

        _status = _NOT_ENTERED;
    }
}


// File contracts/utils/SafeMath.sol

/**
 * @title SafeMath
 * @dev Bibliothèque de fonctions mathématiques sécurisées
 */
library SafeMath {
    /**
     * @dev Retourne la somme de a et b, revient en arrière en cas de dépassement
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Retourne la différence entre a et b, revient en arrière si b > a
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Retourne la différence entre a et b, avec un message personnalisé en cas d'erreur
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;
        return c;
    }

    /**
     * @dev Retourne le produit de a et b, revient en arrière en cas de dépassement
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    /**
     * @dev Retourne le quotient de a divisé par b
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Retourne le quotient de a divisé par b, avec un message personnalisé en cas d'erreur
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        return c;
    }

    /**
     * @dev Retourne le reste de la division de a par b
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Retourne le reste de la division de a par b, avec un message personnalisé en cas d'erreur
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}


// File contracts/StakingPancakeSwap.sol

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
            uint112 reserve0;
            uint112 reserve1;
            uint32 blockTimestampLast;
            (reserve0, reserve1, blockTimestampLast) = pair.getReserves();
            
            // Simplification: utiliser BUSD/USDT/DAI comme référence USD
            // Cette partie nécessite une logique spécifique selon les paires
            // Pour simplifier, nous supposons que reserve1 est en USD
            totalUSDValue = totalUSDValue.add(reserve0, reserve1 * 2 * pool.totalStaked / (pair.totalSupply()));
        }
    }
        
        return totalUSDValue;
    }
}


// File contracts/StakingManager.sol

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
