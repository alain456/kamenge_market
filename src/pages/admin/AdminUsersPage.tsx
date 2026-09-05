import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../context/AuthContext';
import { User } from '../../types/domain';
import { ApiService } from '../../services/api';
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
  Loader2,
  Filter,
} from 'lucide-react';

type EditableUser = Partial<User> & { password?: string };

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { detail?: string } } }).response?.data;
    if (typeof data?.detail === 'string') return data.detail;
  }
  return fallback;
}

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { roles, refreshRoles, currentUser, refreshSession, isAdmin, sessionReady } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getUsers();
      setUsers(data);
    } catch (err) {
      showToast(extractApiError(err, 'Erreur lors du chargement des utilisateurs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    if (!isAdmin) {
      navigate('/access-denied', { replace: true });
      return;
    }

    setAccessChecked(true);
    loadUsers();
    refreshRoles().catch(() => undefined);
  }, [sessionReady, isAdmin, navigate, loadUsers, refreshRoles]);

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      getRoleName(u.roleId).toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  const defaultRoleId = roles.find((r) => r.id !== 'admin')?.id || 'secretaire';

  const openCreate = () => {
    setEditingUser({
      fullName: '',
      email: '',
      phone: '',
      roleId: defaultRoleId,
      status: 'active',
      password: 'kamenge2026',
      assignedArea: '',
    });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser({ ...user, password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingUser || !editingUser.fullName || !editingUser.email || !editingUser.roleId) return;
    setSaving(true);
    const savedUserId = editingUser.id;
    try {
      if (editingUser.id) {
        const payload: Parameters<typeof ApiService.updateUser>[1] = {
          fullName: editingUser.fullName,
          phone: editingUser.phone,
          roleId: editingUser.roleId,
          assignedArea: editingUser.assignedArea,
          status: editingUser.status === 'active' ? 'ACTIF' : 'INACTIF',
        };
        if (editingUser.password && editingUser.password.length >= 6) {
          payload.password = editingUser.password;
        } else if (editingUser.password && editingUser.password.length > 0) {
          showToast('Le mot de passe doit contenir au moins 6 caractères');
          setSaving(false);
          return;
        }
        await ApiService.updateUser(editingUser.id, payload);
        showToast('Utilisateur mis à jour');
      } else {
        if (!editingUser.password || editingUser.password.length < 6) {
          showToast('Le mot de passe doit contenir au moins 6 caractères');
          setSaving(false);
          return;
        }
        await ApiService.createUser({
          fullName: editingUser.fullName,
          email: editingUser.email,
          phone: editingUser.phone,
          roleId: editingUser.roleId,
          assignedArea: editingUser.assignedArea,
          password: editingUser.password,
          status: editingUser.status === 'inactive' ? 'INACTIF' : 'ACTIF',
        });
        showToast('Utilisateur créé avec succès');
      }
      setShowModal(false);
      setEditingUser(null);
      await loadUsers();

      if (savedUserId && savedUserId === currentUser?.id) {
        await refreshSession();
      }
    } catch (err) {
      showToast(extractApiError(err, 'Erreur lors de l\'enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await ApiService.deleteUser(id);
      showToast('Utilisateur supprimé');
      await loadUsers();
    } catch (err) {
      showToast(extractApiError(err, 'Impossible de supprimer cet utilisateur. Désactivez-le plutôt.'));
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'INACTIF' : 'ACTIF';
      await ApiService.updateUser(user.id, { status: newStatus });
      await loadUsers();
    } catch (err) {
      showToast(extractApiError(err, 'Erreur lors du changement de statut'));
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700',
    secretaire: 'bg-sky-100 text-sky-700',
    comptable: 'bg-amber-100 text-amber-700',
    caissier: 'bg-emerald-100 text-emerald-700',
    agent_perception: 'bg-purple-100 text-purple-700',
    agent_enregistrement: 'bg-mint-100 text-mint-700',
  };

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Vérification des accès...</span>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <Check className="w-4 h-4 text-mint-400" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Gestion des Utilisateurs</h1>
          <p className="text-xs font-medium text-gray-500">
            {users.length} comptes du personnel — rôles dynamiques configurables
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou rôle..."
            className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        </div>
        <div className="relative sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full appearance-none bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
          >
            <option value="">Tous les rôles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        ) : (
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
                {filtered.map((user) => (
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
                        onClick={() => handleToggleStatus(user)}
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
        )}
      </div>

      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingUser.id}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40 disabled:opacity-60"
                  placeholder="email@kamenge-mall.bi"
                />
              </div>
              {!editingUser.id ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mot de passe initial</label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Nouveau mot de passe (optionnel)</label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="+257 79 000 000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rôle du personnel</label>
                <select
                  value={editingUser.roleId || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, roleId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Zone assignée (optionnel)</label>
                <input
                  type="text"
                  value={editingUser.assignedArea || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, assignedArea: e.target.value }))}
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
                disabled={saving}
                className="px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingUser.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
