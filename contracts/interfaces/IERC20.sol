// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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