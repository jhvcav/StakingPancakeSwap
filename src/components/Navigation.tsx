import React from 'react';
import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="bg-white shadow mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold">Staking Manager</h1>
          <div className="space-x-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Gestion Quotidienne
            </Link>
            <Link to="/validation" className="text-blue-600 hover:text-blue-800">
              Validation
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}