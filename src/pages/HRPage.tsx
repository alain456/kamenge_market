import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { Users, UserPlus, Phone, Mail, Briefcase, Calendar, Award, X, Check } from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  hireDate: string;
  status: 'active' | 'leave' | 'inactive';
  salary: number;
}

const mockEmployees: Employee[] = [
  { id: 'e-1', fullName: 'Alice Ndayizeye', position: 'Administratrice', department: 'Direction', phone: '+257 79 123 456', email: 'alice@kamenge-mall.bi', hireDate: '2020-01-15', status: 'active', salary: 850000 },
  { id: 'e-2', fullName: 'Bernard Nzeyimana', position: 'Agent de Sécurité', department: 'Sécurité', phone: '+257 76 555 444', email: 'bernard@kamenge-mall.bi', hireDate: '2021-06-01', status: 'active', salary: 350000 },
  { id: 'e-3', fullName: 'Clarisse Hakizimana', position: 'Agente de Nettoyage', department: 'Maintenance', phone: '+257 71 777 888', email: 'clarisse@kamenge-mall.bi', hireDate: '2022-03-10', status: 'leave', salary: 280000 },
  { id: 'e-4', fullName: 'Denis Butoyi', position: 'Technicien Électricien', department: 'Maintenance', phone: '+257 79 333 222', email: 'denis@kamenge-mall.bi', hireDate: '2021-11-20', status: 'active', salary: 420000 },
  { id: 'e-5', fullName: 'Emilienne Ntaconayigize', position: 'Secrétaire', department: 'Administration', phone: '+257 76 111 999', email: 'emilienne@kamenge-mall.bi', hireDate: '2023-02-01', status: 'active', salary: 380000 },
];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  leave: 'bg-amber-100 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = { active: 'Actif', leave: 'En congé', inactive: 'Inactif' };

export const HRPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockEmployees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const departments = [...new Set(mockEmployees.map(e => e.department))];
  const totalSalary = mockEmployees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.salary, 0);

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <Check className="w-4 h-4 text-mint-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Ressources Humaines</h1>
          <p className="text-xs font-medium text-gray-500">{mockEmployees.length} employés — Gestion du personnel du Marché Kamenge</p>
        </div>
        <PermissionGate permission="rh.create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs shadow-sm" onClick={() => showToast('Formulaire de recrutement (simulation)')}>
            <UserPlus className="w-4 h-4" />
            Nouveau employé
          </button>
        </PermissionGate>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total employés', value: mockEmployees.length, icon: Users, color: 'bg-sky-500' },
          { label: 'Actifs', value: mockEmployees.filter(e => e.status === 'active').length, icon: Award, color: 'bg-emerald-500' },
          { label: 'En congé', value: mockEmployees.filter(e => e.status === 'leave').length, icon: Calendar, color: 'bg-amber-500' },
          { label: 'Masse salariale/mois', value: `${(totalSalary / 1000).toFixed(0)}k BIF`, icon: Briefcase, color: 'bg-purple-500' },
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

      {/* Department badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {departments.map(dept => (
          <span key={dept} className="text-[11px] font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{dept}</span>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou département..."
          className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
        <Users className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Employé</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Poste / Département</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider hidden lg:table-cell">Date d'embauche</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Statut</th>
                <PermissionGate permission="rh.read">
                  <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Salaire</th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-mint-500 flex items-center justify-center text-white font-black text-sm">
                        {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="font-bold text-gray-900">{emp.fullName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{emp.position}</p>
                    <p className="text-gray-400 font-medium">{emp.department}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-gray-500 font-medium"><Phone className="w-3 h-3" />{emp.phone}</div>
                    <div className="flex items-center gap-1 text-gray-400 font-medium"><Mail className="w-3 h-3" />{emp.email}</div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500 font-medium">{emp.hireDate}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColors[emp.status]}`}>
                      {statusLabels[emp.status]}
                    </span>
                  </td>
                  <PermissionGate permission="rh.read">
                    <td className="px-6 py-4 font-bold text-gray-900">{emp.salary.toLocaleString('fr-BI')} BIF</td>
                  </PermissionGate>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
