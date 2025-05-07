const hre = require("hardhat");

async function main() {
  console.log("Vérification du contrat StakingPancakeSwap...");

  // A remplacer ces valeurs par celles utilisées lors du déploiement
  const CAKE_TOKEN = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"; // À remplacer par l'adresse réelle
  const rewardPerBlock = hre.ethers.parseEther("0.1");
  const startBlock = 49203937; // À remplacer par le bloc de démarrage réel utilisé
  const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  
  try {
    await hre.run("verify:verify", {
      address: "0x692fcF8Eb63c6795750db6c9d64b966fA9770128", // Adresse de votre StakingPancakeSwap
      constructorArguments: [
        CAKE_TOKEN,
        rewardPerBlock,
        startBlock,
        PANCAKESWAP_ROUTER
      ]
    });
    console.log("StakingPancakeSwap vérifié avec succès!");
  } catch (error) {
    console.error("Erreur lors de la vérification de StakingPancakeSwap:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });