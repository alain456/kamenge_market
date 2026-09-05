import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { ApiService } from '../services/api';
import { User } from '../types/domain';
import { Role } from '../types/rbac';
import { Users, UserPlus, Phone, Mail, Briefcase, Calendar, Award, Check, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = { active: 'Actif', inactive: 'Inactif' };

export const HRPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([ApiService.getUsers(), ApiService.getRoles()])
      .then(([users, rolesData]) => {
        setEmployees(users);
        setRoles(rolesData);
      })
      .catch(() => showToast('Erreur de chargement du personnel'))
      .finally(() => setLoading(false));
  }, []);

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;

  const filtered = employees.filter((e) =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    getRoleName(e.roleId).toLowerCase().includes(search.toLowerCase())
  );

  const departments = [...new Set(employees.map((e) => getRoleName(e.roleId)))];
  const activeCount = employees.filter((e) => e.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Chargement du personnel...</span>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <Check className="w-4 h-4 text-mint-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Ressources Humaines</h1>
          <p className="text-xs font-medium text-gray-500">{employees.length} agents du personnel — données en temps réel</p>
        </div>
        <PermissionGate permission="rh.create">
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs shadow-sm"
            onClick={() => navigate('/administration/utilisateurs')}
          >
            <UserPlus className="w-4 h-4" />
            Gérer les utilisateurs
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total agents', value: employees.length, icon: Users, color: 'bg-sky-500' },
          { label: 'Actifs', value: activeCount, icon: Award, color: 'bg-emerald-500' },
          { label: 'Inactifs', value: employees.length - activeCount, icon: Calendar, color: 'bg-amber-500' },
          { label: 'Rôles distincts', value: departments.length, icon: Briefcase, color: 'bg-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <p className="text-xl font-black text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {departments.map((dept) => (
          <span key={dept} className="text-[11px] font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{dept}</span>
        ))}
      </div>

      <div className="relative mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou rôle..."
          className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
        <Users className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider hidden lg:table-cell">Zone</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-mint-500 flex items-center justify-center text-white font-black text-sm">
                        {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="font-bold text-gray-900">{emp.fullName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{getRoleName(emp.roleId)}</p>
                    <p className="text-gray-400 font-medium">{emp.email}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-gray-500 font-medium"><Phone className="w-3 h-3" />{emp.phone || '—'}</div>
                    <div className="flex items-center gap-1 text-gray-400 font-medium"><Mail className="w-3 h-3" />{emp.email}</div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500 font-medium">{emp.assignedArea || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColors[emp.status]}`}>
                      {statusLabels[emp.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium text-sm">Aucun agent trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
};
