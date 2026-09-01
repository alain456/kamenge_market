import React from 'react';
import { usePermissions } from '../../context/AuthContext';
import { PermissionScope } from '../../types/rbac';

interface PermissionGateProps {
  permission: string;
  scope?: PermissionScope;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideOnDeny?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  scope,
  children,
  fallback = null,
  hideOnDeny = true,
}) => {
  const { hasPermission } = usePermissions();
  const isAllowed = hasPermission(permission, { scope });

  if (isAllowed) {
    return <>{children}</>;
  }

  if (hideOnDeny) {
    return <>{fallback}</>;
  }

  // If we don't hide it completely, we could return a disabled/greyed out version or an alert.
  // In most cases, falling back to a message or null is preferred.
  return (
    <div className="group relative inline-block">
      <div className="opacity-50 pointer-events-none grayscale">
        {children}
      </div>
      <div className="absolute inset-0 z-10 hidden group-hover:flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center text-xs font-bold text-rose-600 border border-rose-100 shadow-sm cursor-not-allowed">
        Vous n’avez pas les droits nécessaires pour effectuer cette action.
      </div>
    </div>
  );
};
