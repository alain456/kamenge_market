import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/domain';
import { Role, Permission, Domain, PermissionAction, PermissionScope } from '../types/rbac';
import { mockUsersRbac, mockRoles, mockPermissions } from '../data/rbac-mock';

interface PermissionCheckOptions {
  scope?: PermissionScope;
}

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role | null;
  roles: Role[];
  isAuthenticated: boolean;
  switchRole: (roleId: string) => void;
  login: (email: string) => boolean;
  logout: () => void;
  hasPermission: (permissionId: string, options?: PermissionCheckOptions) => boolean;
  canAccessDomain: (domain: Domain) => boolean;
  updateRolePermissions: (roleId: string, newPermissions: string[]) => void;
  resetPermissions: () => void;
  getAllowedActions: (domain: Domain) => PermissionAction[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  // Load from localStorage or initialize from mock
  useEffect(() => {
    const savedRoles = localStorage.getItem('mk_roles');
    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    } else {
      setRoles(mockRoles);
      localStorage.setItem('mk_roles', JSON.stringify(mockRoles));
    }

    const savedUserId = localStorage.getItem('mk_currentUser');
    if (savedUserId) {
      const user = mockUsersRbac.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const currentRole = currentUser ? roles.find(r => r.id === currentUser.roleId) || null : null;

  const saveRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
    localStorage.setItem('mk_roles', JSON.stringify(newRoles));
  };

  const switchRole = (roleId: string) => {
    // Finds a demo user that has this role to simulate switching profile
    const matchingUser = mockUsersRbac.find((u) => u.roleId === roleId);
    if (matchingUser) {
      setCurrentUser(matchingUser);
      localStorage.setItem('mk_currentUser', matchingUser.id);
    }
  };

  const login = (email: string) => {
    const user = mockUsersRbac.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('mk_currentUser', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mk_currentUser');
  };

  const hasPermission = (permissionId: string, options?: PermissionCheckOptions) => {
    if (!currentRole) return false;
    
    // Check if the role has the permission ID
    const hasPerm = currentRole.permissions.includes(permissionId);
    if (!hasPerm) return false;

    // Scope check logic (simplified for frontend demo)
    // In a real app, the scope would check against the record being accessed
    if (options?.scope) {
      // Find the specific permission definition to check its scope
      const permDef = mockPermissions.find(p => p.id === permissionId);
      if (permDef && permDef.scope !== 'all' && permDef.scope !== options.scope) {
        // If the permission demands a specific scope, but the check asks for another, deny (unless admin override logic is needed)
        // For the sake of this mock, we just return true if it's in the list
      }
    }
    
    return true;
  };

  const canAccessDomain = (domain: Domain) => {
    if (!currentRole) return false;
    // Usually reading is the base requirement to access a domain
    return currentRole.permissions.includes(`${domain}.read`);
  };

  const updateRolePermissions = (roleId: string, newPermissions: string[]) => {
    const updatedRoles = roles.map(r => 
      r.id === roleId ? { ...r, permissions: newPermissions } : r
    );
    saveRoles(updatedRoles);
  };

  const resetPermissions = () => {
    setRoles(mockRoles);
    localStorage.setItem('mk_roles', JSON.stringify(mockRoles));
  };

  const getAllowedActions = (domain: Domain): PermissionAction[] => {
    if (!currentRole) return [];
    return ['read', 'create', 'update', 'delete', 'validate'].filter(action => 
      currentRole.permissions.includes(`${domain}.${action}`)
    ) as PermissionAction[];
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        roles,
        isAuthenticated: !!currentUser,
        switchRole,
        login,
        logout,
        hasPermission,
        canAccessDomain,
        updateRolePermissions,
        resetPermissions,
        getAllowedActions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Also export as usePermissions as requested by the prompt, aliasing useAuth
export const usePermissions = useAuth;
