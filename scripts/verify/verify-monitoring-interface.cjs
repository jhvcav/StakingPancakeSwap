const hre = require("hardhat");

async function main() {
  console.log("Vérification du contrat MonitoringInterface...");
  
  try {
    await hre.run("verify:verify", {
      address: "0x0cEA474e80467355046def86677F5561DcB1e598", // Adresse de votre MonitoringInterface
      constructorArguments: [
        "0xAd570f6F61655fE688483f2e46eab3b0A034d76f" // Adresse du StakingManager
      ]
    });
    console.log("MonitoringInterface vérifié avec succès!");
  } catch (error) {
    console.error("Erreur lors de la vérification de MonitoringInterface:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });