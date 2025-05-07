const hre = require("hardhat");

async function main() {
  console.log("Vérification du contrat StakingManager...");
  
  try {
    await hre.run("verify:verify", {
      address: "0xAd570f6F61655fE688483f2e46eab3b0A034d76f", // Adresse de votre StakingManager
      constructorArguments: [] // Pas d'arguments pour ce contrat
    });
    console.log("StakingManager vérifié avec succès!");
  } catch (error) {
    console.error("Erreur lors de la vérification de StakingManager:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });