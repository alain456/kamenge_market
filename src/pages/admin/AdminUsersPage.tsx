import React, { useState } from 'react';
import { usePermissions } from '../../context/AuthContext';
import { mockUsersRbac } from '../../data/rbac-mock';
import { User } from '../../types/domain';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  X,
  Check,
} from 'lucide-react';

type EditableUser = User & { __editing?: boolean };

export const AdminUsersPage: React.FC = () => {
  const { roles } = usePermissions();
  const [users, setUsers] = useState<EditableUser[]>(mockUsersRbac);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.roleId.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser({ fullName: '', email: '', phone: '', roleId: roles[0]?.id || '', status: 'active', createdAt: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser({ ...user });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingUser || !editingUser.fullName || !editingUser.email) return;
    if (editingUser.id) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u));
      showToast('Utilisateur mis à jour');
    } else {
      const newUser: User = {
        ...editingUser as User,
        id: `u-${Date.now()}`,
      };
      setUsers(prev => [...prev, newUser]);
      showToast('Utilisateur créé avec succès');
    }
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Utilisateur supprimé');
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || roleId;

  const roleColors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700',
    secretaire: 'bg-sky-100 text-sky-700',
    comptable: 'bg-amber-100 text-amber-700',
    caissier: 'bg-emerald-100 text-emerald-700',
    agent_perception: 'bg-purple-100 text-purple-700',
    agent_enregistrement: 'bg-mint-100 text-mint-700',
  };

  return (
    <div className="p-6 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <Check className="w-4 h-4 text-mint-400" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Gestion des Utilisateurs</h1>
          <p className="text-xs font-medium text-gray-500">{users.length} comptes enregistrés dans le système</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou rôle..."
          className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider hidden md:table-cell">Zone assignée</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 font-black text-gray-700 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=2d7986&color=fff`}
                        alt={user.fullName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{user.fullName}</p>
                        <p className="text-gray-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${roleColors[user.roleId] || 'bg-gray-100 text-gray-600'}`}>
                      {getRoleName(user.roleId)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500 font-medium">
                    {user.assignedArea || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {user.status === 'active'
                        ? <><ToggleRight className="w-3.5 h-3.5" /> Actif</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> Inactif</>
                      }
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium text-sm">
              Aucun utilisateur trouvé.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-mint-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-black text-gray-900">
                  {editingUser.id ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  value={editingUser.fullName || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="email@kamenge-mall.bi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="+257 79 000 000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rôle</label>
                <select
                  value={editingUser.roleId || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Zone assignée (optionnel)</label>
                <input
                  type="text"
                  value={editingUser.assignedArea || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, assignedArea: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="Zone A, Caisse Principale..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingUser(null); }}
                className="px-5 py-2.5 text-gray-700 font-bold text-xs border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl transition-colors"
              >
                {editingUser.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
