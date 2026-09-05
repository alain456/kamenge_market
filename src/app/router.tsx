import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlacesPage } from '../pages/PlacesPage';
import { MerchantsPage } from '../pages/MerchantsPage';
import { MerchantDetailPage } from '../pages/MerchantDetailPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { DisputesPage } from '../pages/DisputesPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

import { ContractsPage } from '../pages/ContractsPage';
import { DueDatesPage } from '../pages/DueDatesPage';
import { PaymentSlipsPage } from '../pages/PaymentSlipsPage';
import { AccountingPage } from '../pages/AccountingPage';
import { UsersPage } from '../pages/UsersPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NewContractPage } from '../pages/NewContractPage';
import { AuditLogPage } from '../pages/AuditLogPage';

// Stubs
import { HRPage } from '../pages/HRPage';
import { InfraPage } from '../pages/InfraPage';
import { SecurityPage } from '../pages/SecurityPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminRolesPage } from '../pages/admin/AdminRolesPage';
import { AdminPermissionsPage } from '../pages/admin/AdminPermissionsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />,
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
      
      { path: 'commerce', element: <ProtectedRoute domain="commerce"><MerchantsPage /></ProtectedRoute> },
      { path: 'commerce/:id', element: <ProtectedRoute domain="commerce"><MerchantDetailPage /></ProtectedRoute> },
      
      { path: 'espaces', element: <ProtectedRoute domain="espaces"><PlacesPage /></ProtectedRoute> },
      
      { path: 'finances', element: <ProtectedRoute domain="finances"><PaymentsPage /></ProtectedRoute> },
      { path: 'finances/echeances', element: <ProtectedRoute domain="finances"><DueDatesPage /></ProtectedRoute> },
      { path: 'finances/bordereaux', element: <ProtectedRoute domain="finances"><PaymentSlipsPage /></ProtectedRoute> },
      { path: 'finances/comptabilite', element: <ProtectedRoute domain="finances"><AccountingPage /></ProtectedRoute> },
      { path: 'finances/rapports', element: <ProtectedRoute domain="finances"><ReportsPage /></ProtectedRoute> },

      { path: 'contrats', element: <ProtectedRoute domain="commerce"><ContractsPage /></ProtectedRoute> },
      { path: 'contrats/nouveau', element: <ProtectedRoute domain="commerce"><NewContractPage /></ProtectedRoute> },
      
      { path: 'ressources-humaines', element: <ProtectedRoute domain="rh"><HRPage /></ProtectedRoute> },
      
      { path: 'infrastructures', element: <ProtectedRoute domain="infrastructures"><InfraPage /></ProtectedRoute> },
      
      { path: 'securite', element: <ProtectedRoute domain="securite"><SecurityPage /></ProtectedRoute> },
      
      { path: 'documents', element: <ProtectedRoute domain="documents"><DocumentsPage /></ProtectedRoute> },
      
      { path: 'plaintes', element: <ProtectedRoute domain="plaintes"><DisputesPage /></ProtectedRoute> },
      
      // Admin section — réservée au rôle admin (aligné avec l'API backend)
      { path: 'administration/utilisateurs', element: <ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute> },
      { path: 'administration/utilisateurs-api', element: <ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute> },
      { path: 'administration/audit', element: <ProtectedRoute requireAdmin><AuditLogPage /></ProtectedRoute> },
      { path: 'administration/parametres', element: <ProtectedRoute requireAdmin><SettingsPage /></ProtectedRoute> },
      { path: 'administration/roles', element: <ProtectedRoute requireAdmin><AdminRolesPage /></ProtectedRoute> },
      { path: 'administration/permissions', element: <ProtectedRoute requireAdmin><AdminPermissionsPage /></ProtectedRoute> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
