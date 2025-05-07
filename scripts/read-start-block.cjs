const { ethers } = require("hardhat");

async function main() {
  // L'adresse de votre contrat StakingPancakeSwap
  const contractAddress = "0x692fcF8Eb63c6795750db6c9d64b966fA9770128";
  
  // L'ABI minimal nécessaire pour appeler la fonction startBlock
  const minimalABI = [
    {
      "inputs": [],
      "name": "startBlock",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  // Connexion au contrat - syntaxe pour ethers v6
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
  const contract = new ethers.Contract(contractAddress, minimalABI, provider);
  
  // Appel de la fonction startBlock
  const startBlock = await contract.startBlock();
  console.log("Bloc de démarrage:", startBlock.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });