// components/AdminLayout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Database, 
  LineChart, 
  Settings, 
  RefreshCw 
} from 'lucide-react';

export function AdminLayout({ children }) {
  const location = useLocation();
  
  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
          <Link 
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            Retour à l'accueil
          </Link>
        </div>
        
        {/* Navigation latérale et contenu principal */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Barre de navigation latérale */}
          <nav className="w-full md:w-64 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Menu Admin</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/admin"
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    isActive('/admin') 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/pools"
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    isActive('/admin/pools') 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Database className="h-5 w-5" />
                  <span>Gestion des pools</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/transactions"
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    isActive('/admin/transactions') 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Transactions</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/settings"
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    isActive('/admin/settings') 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Paramètres</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Contenu principal */}
          <main className="flex-1 bg-white rounded-lg shadow p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}