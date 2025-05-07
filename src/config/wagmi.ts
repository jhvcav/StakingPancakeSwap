import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Utiliser le testnet par défaut en développement
const defaultChain = import.meta.env.PROD ? bsc : bscTestnet;

export const config = createConfig({
  chains: [bsc, bscTestnet], // Assurez-vous d'inclure les deux chaînes ici
  connectors: [
    injected(),
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
});