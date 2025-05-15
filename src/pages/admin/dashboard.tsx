// pages/admin/dashboard.tsx
import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { TransactionsDashboard } from '../../components/TransactionsDashboard';

export default function DashboardPage() {
  return (
    <AdminLayout>
      <TransactionsDashboard />
    </AdminLayout>
  );
}