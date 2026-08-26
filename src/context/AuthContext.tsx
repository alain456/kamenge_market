import React, { createContext, useContext, useState } from 'react';
import { User, Role } from '../types/domain';
import { mockUsers } from '../data/mock-data';
import { PermissionConfig, getRolePermissions } from '../lib/permissions';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role;
  permissions: PermissionConfig;
  isAuthenticated: boolean;
  switchRole: (role: Role) => void;
  login: (email: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]); // Default Admin Jonson
  const [currentRole, setCurrentRole] = useState<Role>('ADMIN');

  const switchRole = (newRole: Role) => {
    setCurrentRole(newRole);
    // Find matching mock user for that role or update current user role
    const matchingUser = mockUsers.find((u) => u.role === newRole);
    if (matchingUser) {
      setCurrentUser(matchingUser);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, role: newRole });
    }
  };

  const login = (email: string) => {
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      return true;
    }
    // Default fallback login as admin if demo email
    setCurrentUser(mockUsers[0]);
    setCurrentRole('ADMIN');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const permissions = getRolePermissions(currentRole);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        permissions,
        isAuthenticated: !!currentUser,
        switchRole,
        login,
        logout,
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
