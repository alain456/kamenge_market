import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../context/AuthContext';
import { Domain } from '../../types/rbac';

interface ProtectedRouteProps {
  domain?: Domain;
  permission?: string;
  requireAdmin?: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  domain,
  permission,
  requireAdmin,
  children,
}) => {
  const { isAuthenticated, canAccessDomain, hasPermission, isAdmin, sessionReady } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!sessionReady) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 font-medium">
        Vérification des accès...
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  if (domain && !canAccessDomain(domain)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
