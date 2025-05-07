/**
 * Script de déploiement des smart contracts
 */
const StakingPancakeSwap = artifacts.require("StakingPancakeSwap");
const StakingManager = artifacts.require("StakingManager");
const AdminDashboard = artifacts.require("AdminDashboard");
const MonitoringInterface = artifacts.require("MonitoringInterface");

module.exports = async function(deployer, network, accounts) {
  const admin = accounts[0];
  
  // Adresses selon le réseau
  let pancakeRouterAddress;
  let rewardTokenAddress;
  
  if (network === 'bscMainnet') {
    // Adresses de production
    pancakeRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Router PancakeSwap
    rewardTokenAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"; // CAKE token
  } else {
    // Adresses de testnet
    pancakeRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // Router testnet
    rewardTokenAddress = "0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e"; // CAKE token testnet
  }
  
  // Paramètres de déploiement
  const rewardPerBlock = "100000000000000000"; // 0.1 tokens par bloc
  const startBlock = await web3.eth.getBlockNumber();
  
  console.log(`\nDéploiement des contrats sur ${network}...`);
  console.log(`- Router PancakeSwap: ${pancakeRouterAddress}`);
  console.log(`- Token de récompense: ${rewardTokenAddress}`);
  console.log(`- Bloc de démarrage: ${startBlock}`);
  console.log(`- Récompense par bloc: ${rewardPerBlock}`);
  
  // 1. Déployer le contrat de staking
  await deployer.deploy(
    StakingPancakeSwap,
    rewardTokenAddress,
    rewardPerBlock,
    startBlock,
    pancakeRouterAddress
  );
  const stakingInstance = await StakingPancakeSwap.deployed();
  console.log(`\nContrat de staking déployé à l'adresse: ${stakingInstance.address}`);
  
  // 2. Déployer le gestionnaire de staking
  await deployer.deploy(StakingManager);
  const stakingManager = await StakingManager.deployed();
  console.log(`Gestionnaire de staking déployé à l'adresse: ${stakingManager.address}`);
  
  // 3. Déployer le tableau de bord d'administration
  await deployer.deploy(AdminDashboard, stakingManager.address);
  const adminDashboard = await AdminDashboard.deployed();
  console.log(`Tableau de bord d'administration déployé à l'adresse: ${adminDashboard.address}`);
  
  // 4. Déployer l'interface de monitoring
  await deployer.deploy(MonitoringInterface, stakingManager.address);
  const monitoringInterface = await MonitoringInterface.deployed();
  console.log(`Interface de monitoring déployée à l'adresse: ${monitoringInterface.address}`);
  
  // 5. Ajouter l'instance de staking au gestionnaire
  await stakingManager.addStakingInstance(stakingInstance.address, "PancakeSwap Staking Principal");
  console.log(`\nInstance de staking ajoutée au gestionnaire avec succès.`);
  
  console.log(`\nTous les contrats ont été déployés avec succès!`);
};