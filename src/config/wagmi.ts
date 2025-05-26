import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Détection de l'environnement plus fiable
const isDev = import.meta.env ? 
  (import.meta.env.DEV === true || import.meta.env.MODE === 'development') : 
  (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');

const defaultChain = isDev ? bscTestnet : bsc;

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
});