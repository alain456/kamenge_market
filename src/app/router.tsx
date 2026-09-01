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
      
      { path: 'ressources-humaines', element: <ProtectedRoute domain="rh"><HRPage /></ProtectedRoute> },
      
      { path: 'infrastructures', element: <ProtectedRoute domain="infrastructures"><InfraPage /></ProtectedRoute> },
      
      { path: 'securite', element: <ProtectedRoute domain="securite"><SecurityPage /></ProtectedRoute> },
      
      { path: 'documents', element: <ProtectedRoute domain="documents"><DocumentsPage /></ProtectedRoute> },
      
      { path: 'plaintes', element: <ProtectedRoute domain="plaintes"><DisputesPage /></ProtectedRoute> },
      
      // Admin section
      { path: 'administration/utilisateurs', element: <ProtectedRoute permission="rh.validate"><AdminUsersPage /></ProtectedRoute> },
      { path: 'administration/roles', element: <ProtectedRoute permission="rh.validate"><AdminRolesPage /></ProtectedRoute> },
      { path: 'administration/permissions', element: <ProtectedRoute permission="rh.validate"><AdminPermissionsPage /></ProtectedRoute> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
