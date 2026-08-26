import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { User } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus } from 'lucide-react';
import { getRoleLabel } from '../lib/permissions';

export const UsersPage: React.FC = () => {
  const { permissions } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    MockApiService.getUsers().then(data => {
      setUsers(data);
      setIsLoading(false);
    });
  }, []);

  const tableColumns: Column<User>[] = [
    {
      header: 'Utilisateur',
      accessor: (r) => (
        <div className="flex items-center gap-3">
           <img src={r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="" className="w-8 h-8 rounded-full object-cover" />
           <div>
              <div className="font-extrabold text-gray-900">{r.name}</div>
              <div className="text-[10px] text-gray-500">{r.email}</div>
           </div>
        </div>
      ),
    },
    {
      header: 'Rôle',
      accessor: (r) => <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl text-[11px]">{getRoleLabel(r.role)}</span>,
    },
    {
      header: 'Statut',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Dernière Connexion',
      accessor: (r) => <span className="text-gray-500 font-medium text-[11px]">{r.lastLogin}</span>,
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Utilisateurs & Accès"
        subtitle="Gestion des comptes du personnel administratif et de leurs rôles"
        breadcrumbs={[{ label: 'Utilisateurs' }]}
        actions={
          permissions.canManageUsers && (
            <button
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inviter un utilisateur</span>
            </button>
          )
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 mb-5">
         <Shield className="w-5 h-5 text-amber-600 shrink-0" />
         <div>
            <span className="font-extrabold block mb-0.5">Mode Démo RBAC Activé</span>
            Pour faciliter le test des permissions (Role-Based Access Control), utilisez le sélecteur de rôle "Basculer le rôle" en haut à droite dans la barre de navigation. Vous n'avez pas besoin de créer de nouveaux comptes pour tester les différentes vues.
         </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
      />
    </div>
  );
};
