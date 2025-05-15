// pages/Transactions.tsx
import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { TransactionsPage } from '../components/TransactionsPage';

export function TransactionsAdmin() {
  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6">Suivi des Transactions</h1>
      <TransactionsPage />
    </AdminLayout>
  );
}