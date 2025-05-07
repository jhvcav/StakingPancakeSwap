// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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