const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement des contrats avec le compte:", deployer.address);

  // Déployer StakingPancakeSwap
  const StakingPancakeSwap = await ethers.getContractFactory("StakingPancakeSwap");
  const stakingPancakeSwapDeployment = await StakingPancakeSwap.deploy(
    process.env.CAKE_TOKEN,
    ethers.parseEther("0.1"),
    await ethers.provider.getBlockNumber(),
    process.env.PANCAKESWAP_ROUTER
  );
  
  // Dans ethers v6, il faut attendre la transaction de déploiement
  const stakingPancakeSwap = await stakingPancakeSwapDeployment.waitForDeployment();
  const stakingPancakeSwapAddress = await stakingPancakeSwap.getAddress();
  console.log("StakingPancakeSwap déployé à:", stakingPancakeSwapAddress);

  // Déployer StakingManager
  const StakingManager = await ethers.getContractFactory("StakingManager");
  const stakingManagerDeployment = await StakingManager.deploy();
  const stakingManager = await stakingManagerDeployment.waitForDeployment();
  const stakingManagerAddress = await stakingManager.getAddress();
  console.log("StakingManager déployé à:", stakingManagerAddress);

  // Déployer AdminDashboard
  const AdminDashboard = await ethers.getContractFactory("AdminDashboard");
  const adminDashboardDeployment = await AdminDashboard.deploy(stakingManagerAddress);
  const adminDashboard = await adminDashboardDeployment.waitForDeployment();
  const adminDashboardAddress = await adminDashboard.getAddress();
  console.log("AdminDashboard déployé à:", adminDashboardAddress);

  // Déployer MonitoringInterface
  const MonitoringInterface = await ethers.getContractFactory("MonitoringInterface");
  const monitoringInterfaceDeployment = await MonitoringInterface.deploy(stakingManagerAddress);
  const monitoringInterface = await monitoringInterfaceDeployment.waitForDeployment();
  const monitoringInterfaceAddress = await monitoringInterface.getAddress();
  console.log("MonitoringInterface déployé à:", monitoringInterfaceAddress);

  // Configuration initiale
  await stakingManager.addStakingInstance(stakingPancakeSwapAddress, "PancakeSwap Staking Principal");
  console.log("Configuration initiale terminée");

  // Récupérer les ABIs pour le fichier de configuration
  // Pour ethers v6, utilisez la méthode appropriée pour récupérer les ABIs
  const stakingManagerABI = JSON.stringify(JSON.parse(StakingManager.interface.formatJson()));
  const monitoringInterfaceABI = JSON.stringify(JSON.parse(MonitoringInterface.interface.formatJson()));
  const adminDashboardABI = JSON.stringify(JSON.parse(AdminDashboard.interface.formatJson()));
  const stakingPancakeSwapABI = JSON.stringify(JSON.parse(StakingPancakeSwap.interface.formatJson()));

  // Mettre à jour src/config/contracts.ts avec les adresses et les ABIs
  const fs = require("fs");
  const contractsConfig = `
import { Address } from 'viem';

export const STAKING_MANAGER_ADDRESS = '${stakingManagerAddress}' as Address;
export const MONITORING_INTERFACE_ADDRESS = '${monitoringInterfaceAddress}' as Address;
export const ADMIN_DASHBOARD_ADDRESS = '${adminDashboardAddress}' as Address;
export const STAKING_PANCAKESWAP_ADDRESS = '${stakingPancakeSwapAddress}' as Address;

// ABIs pour l'interaction frontend
export const STAKING_MANAGER_ABI = ${stakingManagerABI};
export const MONITORING_INTERFACE_ABI = ${monitoringInterfaceABI};
export const ADMIN_DASHBOARD_ABI = ${adminDashboardABI};
export const STAKING_PANCAKESWAP_ABI = ${stakingPancakeSwapABI};
`;

  fs.writeFileSync("src/config/contracts.ts", contractsConfig);
  console.log("Configuration mise à jour dans src/config/contracts.ts avec adresses et ABIs");

  // Vérifier les contrats sur BscScan
  if (process.env.BSCSCAN_API_KEY) {
    console.log("Vérification des contrats sur BscScan...");
    await hre.run("verify:verify", {
      address: stakingPancakeSwapAddress,
      constructorArguments: [
        process.env.CAKE_TOKEN,
        ethers.parseEther("0.1"),
        await ethers.provider.getBlockNumber(),
        process.env.PANCAKESWAP_ROUTER
      ],
    });
    
    await hre.run("verify:verify", {
      address: stakingManagerAddress,
      constructorArguments: [],
    });
    
    await hre.run("verify:verify", {
      address: adminDashboardAddress,
      constructorArguments: [stakingManagerAddress],
    });
    
    await hre.run("verify:verify", {
      address: monitoringInterfaceAddress,
      constructorArguments: [stakingManagerAddress],
    });
    
    console.log("Vérification des contrats terminée");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });