# Smart Contract de Staking sur PancakeSwap

Ce projet fournit un système complet de smart contracts pour le staking sur PancakeSwap, permettant aux utilisateurs de staker leurs tokens LP et de gagner des récompenses, avec des fonctionnalités d'administration et de monitoring avancées.

## Caractéristiques

- Interface de staking connectée à PancakeSwap
- Fonctions administratives pour gérer les pools de staking
- Système de récompenses avec calcul automatique
- Tableau de bord de monitoring pour suivre les activités de staking
- Mécanisme de retrait sécurisé des fonds
- Fonctions d'urgence pour la sécurité du contrat

## Structure du Projet

Le projet est composé de plusieurs smart contracts:

- **StakingPancakeSwap**: Le contrat principal de staking pour gérer les dépôts, retraits et récompenses
- **StakingManager**: Contrat pour gérer et surveiller plusieurs instances de staking
- **AdminDashboard**: Fournit des fonctionnalités administratives et analytiques
- **MonitoringInterface**: Interface utilisateur pour surveiller les activités de staking

## Prérequis

- Node.js v14 ou plus récent
- Truffle v5.4 ou plus récent
- Un portefeuille Ethereum avec des BNB pour le déploiement

## Installation

1. Cloner ce dépôt:
   ```
   git clone [URL du dépôt]
   cd staking-pancakeswap
   ```

2. Installer les dépendances:
   ```
   npm install
   ```

3. Configurer les variables d'environnement en créant un fichier `.env`:
   ```
   MNEMONIC=votre_phrase_mnémonique_ici
   BSCSCAN_API_KEY=votre_clé_api_bscscan
   ```

## Compilation

Pour compiler les smart contracts:

```
truffle compile
```

## Déploiement

Pour déployer sur le testnet BSC:

```
truffle migrate --network bscTestnet
```

Pour déployer sur le mainnet BSC:

```
truffle migrate --network bscMainnet
```

## Utilisation

### Configuration des Pools de Staking

1. Après le déploiement, configurez des pools de staking en utilisant la fonction `addPool`:

```javascript
const stakingContract = await StakingPancakeSwap.at("adresse_du_contrat");
const lpTokenAddress = "adresse_du_token_lp";
const allocPoint = 100; // Points d'allocation pour ce pool

await stakingContract.addPool(allocPoint, lpTokenAddress, true);
```

### Staking

Les utilisateurs peuvent staker leurs tokens LP en appelant la fonction `deposit`:

```javascript
const pid = 0; // ID du pool
const amount = web3.utils.toWei("10"); // 10 tokens LP

await stakingContract.deposit(pid, amount);
```

### Réclamer les Récompenses

Les utilisateurs peuvent réclamer leurs récompenses sans retirer leurs tokens stakés:

```javascript
await stakingContract.claimReward(pid);
```

### Retrait

Pour retirer des tokens stakés:

```javascript
const amount = web3.utils.toWei("5"); // 5 tokens LP

await stakingContract.withdraw(pid, amount);
```

### Administration

Les administrateurs peuvent gérer les pools et mettre à jour les paramètres:

```javascript
// Mettre à jour la récompense par bloc
const newRewardPerBlock = web3.utils.toWei("0.2");
await stakingContract.updateRewardPerBlock(newRewardPerBlock);

// Mettre à jour la période minimale de staking
const newMinStakingPeriod = 14 * 24 * 60 * 60; // 14 jours
await stakingContract.updateMinStakingPeriod(newMinStakingPeriod);
```

### Monitoring

Utilisez le contrat `MonitoringInterface` pour suivre les activités de staking:

```javascript
const monitoringInterface = await MonitoringInterface.at("adresse_du_contrat");
const userAddress = "adresse_utilisateur";

const summary = await monitoringInterface.getUserSummary(userAddress);
console.log(`Total staké: ${web3.utils.fromWei(summary.totalStaked)}`);
console.log(`Récompenses en attente: ${web3.utils.fromWei(summary.totalRewards)}`);
```

## Sécurité

Ce projet implémente plusieurs mesures de sécurité:

- Protection contre les attaques par réentrance
- Vérification des autorisations pour les fonctions administratives
- Fonctions de secours pour les situations d'urgence
- Mécanismes de protection des fonds des utilisateurs

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.