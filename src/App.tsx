import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { AdminPage } from './pages/Admin';
import { HomePage } from './pages/Home';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  

  const handleConnect = async () => {
    try {
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">PancakeSwap Staking</h1>
              <nav className="flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900">Accueil</Link>
              {isConnected && (
                <Link to="/admin" className="flex items-center space-x-1 text-purple-600 hover:text-purple-800">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
                </Link>
              )}
              </nav>
            </div>
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Connecter le Portefeuille
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;