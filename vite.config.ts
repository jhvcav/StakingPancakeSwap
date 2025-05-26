import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/StakingPancakeSwap/',
  
  // Configuration plus robuste pour le chargement des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', '@tanstack/react-query', 'lucide-react'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  
  // Amélioration de la résolution des modules
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Configuration du serveur de développement
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  
  // Configuration de build
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Configuration de l'environnement
  define: {
    'process.env': {}
  },
});