import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlacesPage } from '../pages/PlacesPage';
import { MerchantsPage } from '../pages/MerchantsPage';
import { MerchantDetailPage } from '../pages/MerchantDetailPage';
import { ContractsPage } from '../pages/ContractsPage';
import { NewContractPage } from '../pages/NewContractPage';
import { DueDatesPage } from '../pages/DueDatesPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { PaymentSlipsPage } from '../pages/PaymentSlipsPage';
import { DisputesPage } from '../pages/DisputesPage';
import { DisputeDetailPage } from '../pages/DisputeDetailPage';
import { AccountingPage } from '../pages/AccountingPage';
import { ReportsPage } from '../pages/ReportsPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { SettingsPage } from '../pages/SettingsPage';
import { useAuth } from '../context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'places', element: <PlacesPage /> },
      { path: 'merchants', element: <MerchantsPage /> },
      { path: 'merchants/:id', element: <MerchantDetailPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'contracts/new', element: <NewContractPage /> },
      { path: 'due-dates', element: <DueDatesPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'payment-slips', element: <PaymentSlipsPage /> },
      { path: 'disputes', element: <DisputesPage /> },
      { path: 'disputes/:id', element: <DisputeDetailPage /> },
      { path: 'accounting', element: <AccountingPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'audit-log', element: <AuditLogPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
