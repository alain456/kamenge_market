import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../context/AuthContext';
import { Role } from '../../types/rbac';
import { ApiService } from '../../services/api';
import {
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
} from 'lucide-react';

const ALL_DOMAINS = ['commerce', 'espaces', 'finances', 'rh', 'infrastructures', 'securite', 'documents', 'plaintes'];
const ALL_ACTIONS = ['read', 'create', 'update', 'delete', 'validate'];

export const AdminRolesPage: React.FC = () => {
  const { updateRolePermissions, refreshRoles } = usePermissions();
  const [localRoles, setLocalRoles] = useState<Role[]>([]);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getRoles();
      setLocalRoles(data);
      await refreshRoles();
    } catch {
      setError('Impossible de charger les rôles. Vérifiez que vous êtes connecté en tant qu\'administrateur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const slug = newRoleSlug.trim() || slugify(newRoleName);
    setSaving(true);
    try {
      const created = await ApiService.createRole({
        id: slug,
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: [],
      });
      setLocalRoles((prev) => [...prev, created]);
      await refreshRoles();
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRoleSlug('');
      setShowCreateModal(false);
      showToast(`Rôle "${created.name}" créé avec succès`);
    } catch {
      showToast('Erreur lors de la création du rôle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    try {
      await ApiService.deleteRole(roleId);
      setLocalRoles((prev) => prev.filter((r) => r.id !== roleId));
      await refreshRoles();
      showToast('Rôle supprimé');
    } catch {
      showToast('Impossible de supprimer ce rôle (système ou utilisateurs assignés)');
    }
  };

  const handleTogglePermission = async (role: Role, domain: string, action: string) => {
    const permId = `${domain}.${action}`;
    const hasPerm = role.permissions.includes(permId);
    const newPerms = hasPerm
      ? role.permissions.filter((p) => p !== permId)
      : [...role.permissions, permId];

    setLocalRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: newPerms } : r))
    );

    try {
      await updateRolePermissions(role.id, newPerms);
      showToast(`Permission ${hasPerm ? 'retirée' : 'accordée'}`);
    } catch {
      await loadRoles();
      showToast('Erreur lors de la mise à jour');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-rose-800 mb-4">{error}</p>
          <button
            onClick={loadRoles}
            className="px-5 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-2xl"
          >
            Réessayer
          </button>
        </div>
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Gestion des Rôles</h1>
          <p className="text-xs font-medium text-gray-500">
            {localRoles.length} rôles — Administrateur du marché, Secrétaire, Comptable, Caissier, Agents...
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau rôle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Chargement des rôles...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {localRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${role.isSystemRole ? 'bg-mint-50' : 'bg-purple-50'}`}>
                    {role.isSystemRole
                      ? <ShieldCheck className="w-5 h-5 text-mint-600" />
                      : <Shield className="w-5 h-5 text-purple-600" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900">{role.name}</h3>
                      {role.isSystemRole && (
                        <span className="text-[10px] font-bold text-mint-700 bg-mint-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Système
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-400">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {role.permissions.length} permissions
                  </span>
                  {!role.isSystemRole && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {expandedRoleId === role.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {expandedRoleId === role.id && (
                <div className="border-t border-gray-100 p-5 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 rounded-xl">
                        <th className="px-4 py-3 font-black text-gray-700 uppercase tracking-wider rounded-l-xl w-1/4">Domaine</th>
                        {ALL_ACTIONS.map((action) => (
                          <th key={action} className="px-4 py-3 font-black text-gray-700 uppercase tracking-wider text-center">{action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ALL_DOMAINS.map((domain) => (
                        <tr key={domain} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900 capitalize">{domain}</td>
                          {ALL_ACTIONS.map((action) => {
                            const permId = `${domain}.${action}`;
                            const hasPerm = role.permissions.includes(permId);
                            return (
                              <td key={action} className="px-4 py-3 text-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={hasPerm}
                                    onChange={() => handleTogglePermission(role, domain, action)}
                                  />
                                  <div className={`w-8 h-4 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full ${hasPerm ? 'bg-mint-500' : 'bg-gray-200'}`} />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-black text-gray-900">Nouveau rôle</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nom du rôle</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (!newRoleSlug) setNewRoleSlug(slugify(e.target.value));
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="Ex: Superviseur de Zone"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Identifiant (slug)</label>
                <input
                  type="text"
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                  placeholder="superviseur_zone"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40 resize-none"
                  placeholder="Description courte du rôle..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 text-gray-700 font-bold text-xs border border-gray-200 rounded-2xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRole}
                disabled={saving}
                className="px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Créer le rôle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
