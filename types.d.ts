import { Chain } from 'wagmi';

// Déclarer les propriétés manquantes
declare module 'wagmi' {
  interface CreateConfigParameters {
    transports?: Record<number, any>;
  }
}