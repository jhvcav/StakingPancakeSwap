// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IPancakeRouter01.sol";

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