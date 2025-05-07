// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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