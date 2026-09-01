import { Role, Permission, Domain, PermissionAction, PermissionScope } from '../types/rbac';
import { User } from '../types/domain';

// Helper to generate a permission ID
export const getPermissionId = (domain: Domain, action: PermissionAction) => `${domain}.${action}`;

// Create all possible permissions
const allDomains: Domain[] = ['commerce', 'espaces', 'finances', 'rh', 'infrastructures', 'securite', 'documents', 'plaintes'];
const allActions: PermissionAction[] = ['read', 'create', 'update', 'delete', 'validate'];

export const mockPermissions: Permission[] = [];
allDomains.forEach(domain => {
  allActions.forEach(action => {
    mockPermissions.push({
      id: getPermissionId(domain, action),
      domain,
      action,
      label: `${action.charAt(0).toUpperCase() + action.slice(1)} ${domain}`,
      scope: 'all'
    });
  });
});

export const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrateur du marché',
    description: 'Accès complet à tous les modules',
    isSystemRole: true,
    permissions: [
      ...['read', 'create', 'update', 'delete', 'validate'].flatMap(a => [
        `commerce.${a}`, `espaces.${a}`, `rh.${a}`
      ]),
      'finances.read', 'finances.validate',
      'infrastructures.read', 'infrastructures.validate',
      'securite.read', 'securite.validate',
      'documents.read', 'documents.update',
      'plaintes.read', 'plaintes.validate'
    ]
  },
  {
    id: 'secretaire',
    name: 'Secrétaire',
    description: 'Gestion administrative',
    isSystemRole: true,
    permissions: [
      'commerce.read', 'commerce.create', 'commerce.update',
      'espaces.read',
      'rh.read',
      'documents.read', 'documents.create', 'documents.update',
      'plaintes.read', 'plaintes.create', 'plaintes.update'
    ]
  },
  {
    id: 'comptable',
    name: 'Comptable',
    description: 'Gestion financière globale',
    isSystemRole: true,
    permissions: [
      'commerce.read',
      'espaces.read',
      'finances.read', 'finances.create', 'finances.update', 'finances.validate',
      'rh.read',
      'documents.read',
      'plaintes.read'
    ]
  },
  {
    id: 'caissier',
    name: 'Caissier',
    description: 'Gestion de sa propre caisse',
    isSystemRole: true,
    permissions: [
      'commerce.read',
      'espaces.read',
      'finances.read', 'finances.create',
      'documents.read'
    ]
  },
  {
    id: 'agent_perception',
    name: 'Agent de perception',
    description: 'Perception des taxes',
    isSystemRole: true,
    permissions: [
      'commerce.read',
      'espaces.read',
      'finances.create'
    ]
  },
  {
    id: 'agent_enregistrement',
    name: 'Agent d\'enregistrement',
    description: 'Enregistrement des entités',
    isSystemRole: true,
    permissions: [
      'commerce.read', 'commerce.create', 'commerce.update',
      'espaces.read', 'espaces.create', 'espaces.update',
      'documents.read', 'documents.create'
    ]
  }
];

export const mockUsersRbac: User[] = [
  {
    id: 'u-1',
    fullName: 'Alice Ndayizeye',
    email: 'alice.admin@kamenge-mall.bi',
    phone: '+257 79 123 456',
    roleId: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    lastLogin: '2026-09-01 08:00',
    createdAt: '2025-01-01'
  },
  {
    id: 'u-2',
    fullName: 'Jean Hakizimana',
    email: 'jean.sec@kamenge-mall.bi',
    phone: '+257 71 987 654',
    roleId: 'secretaire',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '2025-02-15'
  },
  {
    id: 'u-3',
    fullName: 'Diane Irakoze',
    email: 'diane.comp@kamenge-mall.bi',
    phone: '+257 79 555 444',
    roleId: 'comptable',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '2025-03-10'
  },
  {
    id: 'u-4',
    fullName: 'Eric Nshimirimana',
    email: 'eric.caisse@kamenge-mall.bi',
    phone: '+257 71 222 333',
    roleId: 'caissier',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '2025-04-20',
    assignedArea: 'Caisse Principale'
  },
  {
    id: 'u-5',
    fullName: 'Claude Niyonzima',
    email: 'claude.perc@kamenge-mall.bi',
    phone: '+257 76 888 999',
    roleId: 'agent_perception',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '2025-05-05',
    assignedArea: 'Zone A'
  },
  {
    id: 'u-6',
    fullName: 'Sandrine Uwimana',
    email: 'sandrine.enr@kamenge-mall.bi',
    phone: '+257 75 111 222',
    roleId: 'agent_enregistrement',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '2025-06-12'
  }
];
