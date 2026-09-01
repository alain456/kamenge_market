import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../context/AuthContext';
import { Domain } from '../../types/rbac';

interface ProtectedRouteProps {
  domain?: Domain;
  permission?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  domain,
  permission,
  children,
}) => {
  const { isAuthenticated, canAccessDomain, hasPermission } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (domain && !canAccessDomain(domain)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
