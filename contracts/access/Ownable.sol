// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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