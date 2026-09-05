import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/domain';
import { Role, Domain, PermissionAction, PermissionScope } from '../types/rbac';
import { mockRoles } from '../data/rbac-mock';
import { API_AUTH_URL } from '../lib/config';
import { keysToCamelCase } from '../lib/case-converter';
import { ApiService, mapApiUser, mapApiRole } from '../services/api';

interface PermissionCheckOptions {
  scope?: PermissionScope;
}

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role | null;
  roles: Role[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permissionId: string, options?: PermissionCheckOptions) => boolean;
  canAccessDomain: (domain: Domain) => boolean;
  updateRolePermissions: (roleId: string, newPermissions: string[]) => Promise<void>;
  resetPermissions: () => void;
  getAllowedActions: (domain: Domain) => PermissionAction[];
  refreshRoles: () => Promise<Role[]>;
  refreshSession: () => Promise<void>;
  effectiveRoleId: string | null;
  isAdmin: boolean;
  sessionReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildRoleFromMe(meData: Record<string, unknown>, user: User): Role {
  const permissions = Array.isArray(meData.permissions)
    ? meData.permissions.map(String)
    : [];
  return {
    id: user.roleId,
    name: String(meData.roleName ?? meData.role_name ?? user.roleId),
    description: String(meData.roleDescription ?? ''),
    isSystemRole: true,
    permissions,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [sessionReady, setSessionReady] = useState(() => !localStorage.getItem('access_token'));

  const saveRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
    localStorage.setItem('mk_roles', JSON.stringify(newRoles));
  };

  const applySession = useCallback((meData: Record<string, unknown>) => {
    const user = mapApiUser(meData);
    const role = buildRoleFromMe(meData, user);
    const permissions = role.permissions;

    setCurrentUser(user);
    setCurrentRole(role);
    setUserPermissions(permissions);
    localStorage.setItem('mk_user_data', JSON.stringify(user));
    localStorage.setItem('mk_user_permissions', JSON.stringify(permissions));
    localStorage.setItem('mk_current_role', JSON.stringify(role));

    setRoles((prev) => {
      const others = prev.filter((r) => r.id !== role.id);
      return [...others, role];
    });
  }, []);

  const refreshRoles = useCallback(async (): Promise<Role[]> => {
    try {
      const apiRoles = await ApiService.getRoles();
      saveRoles(apiRoles);
      return apiRoles;
    } catch {
      const savedRoles = localStorage.getItem('mk_roles');
      if (savedRoles) {
        const parsed = JSON.parse(savedRoles) as Role[];
        setRoles(parsed);
        return parsed;
      }
      saveRoles(mockRoles);
      return mockRoles;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentRole(null);
    setUserPermissions([]);
    setSessionReady(true);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('mk_user_data');
    localStorage.removeItem('mk_user_permissions');
    localStorage.removeItem('mk_current_role');
  }, []);

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const meResponse = await fetch(`${API_AUTH_URL}me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meResponse.ok) {
      logout();
      return;
    }
    const meData = await meResponse.json();
    applySession(keysToCamelCase(meData) as Record<string, unknown>);
  }, [applySession, logout]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedRole = localStorage.getItem('mk_current_role');
    const savedUser = localStorage.getItem('mk_user_data');
    const savedPerms = localStorage.getItem('mk_user_permissions');

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedRole) setCurrentRole(JSON.parse(savedRole));
    if (savedPerms) setUserPermissions(JSON.parse(savedPerms));

    if (token) {
      refreshSession()
        .catch(() => undefined)
        .finally(() => setSessionReady(true));
      refreshRoles().catch(() => undefined);
      return;
    }

    const savedRoles = localStorage.getItem('mk_roles');
    setRoles(savedRoles ? JSON.parse(savedRoles) : mockRoles);
    setSessionReady(true);
  }, [refreshSession, refreshRoles]);

  useEffect(() => {
    const onFocus = () => {
      if (localStorage.getItem('access_token')) {
        refreshSession().catch(() => undefined);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_AUTH_URL}login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.detail || 'Identifiants incorrects.';
        return { ok: false, error: msg };
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      if (data.user) {
        applySession(keysToCamelCase(data.user) as Record<string, unknown>);
      } else {
        await refreshSession();
      }

      setSessionReady(true);
      refreshRoles().catch(() => undefined);
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: 'Erreur de connexion au serveur.' };
    }
  };

  const hasPermission = (permissionId: string, _options?: PermissionCheckOptions) => {
    if (currentRole?.permissions.includes(permissionId)) return true;
    return userPermissions.includes(permissionId);
  };

  const canAccessDomain = (domain: Domain) => {
    if (currentRole?.permissions.includes(`${domain}.read`)) return true;
    return userPermissions.includes(`${domain}.read`);
  };

  const updateRolePermissions = async (roleId: string, newPermissions: string[]) => {
    const updated = await ApiService.updateRole(roleId, { permissions: newPermissions });
    const updatedRoles = roles.map((r) =>
      r.id === roleId ? mapApiRole(updated as unknown as Record<string, unknown>) : r
    );
    saveRoles(updatedRoles);

    if (currentUser?.roleId === roleId) {
      const newRole = { ...currentRole!, permissions: newPermissions };
      setCurrentRole(newRole);
      setUserPermissions(newPermissions);
      localStorage.setItem('mk_user_permissions', JSON.stringify(newPermissions));
      localStorage.setItem('mk_current_role', JSON.stringify(newRole));
    }
  };

  const resetPermissions = () => {
    saveRoles(mockRoles);
  };

  const getAllowedActions = (domain: Domain): PermissionAction[] => {
    const perms = currentRole?.permissions.length ? currentRole.permissions : userPermissions;
    return ['read', 'create', 'update', 'delete', 'validate'].filter((action) =>
      perms.includes(`${domain}.${action}`)
    ) as PermissionAction[];
  };

  const effectiveRoleId = currentRole?.id || currentUser?.roleId || null;
  const isAdmin = effectiveRoleId === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        roles,
        isAuthenticated: !!currentUser,
        login,
        logout,
        hasPermission,
        canAccessDomain,
        updateRolePermissions,
        resetPermissions,
        getAllowedActions,
        refreshRoles,
        refreshSession,
        effectiveRoleId,
        isAdmin,
        sessionReady,
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

export const usePermissions = useAuth;
