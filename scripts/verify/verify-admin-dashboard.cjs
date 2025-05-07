const hre = require("hardhat");

async function main() {
  console.log("Vérification du contrat AdminDashboard...");
  
  try {
    await hre.run("verify:verify", {
      address: "0xa59cE5448b929b5508A800627230f289Dd8828f2", // Adresse de votre AdminDashboard
      constructorArguments: [
        "0xAd570f6F61655fE688483f2e46eab3b0A034d76f" // Adresse du StakingManager
      ]
    });
    console.log("AdminDashboard vérifié avec succès!");
  } catch (error) {
    console.error("Erreur lors de la vérification de AdminDashboard:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });