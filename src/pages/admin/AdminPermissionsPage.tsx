import React, { useState } from 'react';
import { usePermissions } from '../../context/AuthContext';
import { Domain, PermissionAction } from '../../types/rbac';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

const ALL_DOMAINS: Domain[] = ['commerce', 'espaces', 'finances', 'rh', 'infrastructures', 'securite', 'documents', 'plaintes'];
const ALL_ACTIONS: PermissionAction[] = ['read', 'create', 'update', 'delete', 'validate'];

export const AdminPermissionsPage: React.FC = () => {
  const { roles, updateRolePermissions } = usePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [toast, setToast] = useState<string | null>(null);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const handleToggle = (domain: Domain, action: PermissionAction) => {
    if (!selectedRole) return;
    const permId = `${domain}.${action}`;
    const hasPerm = selectedRole.permissions.includes(permId);
    
    let newPermissions;
    if (hasPerm) {
      newPermissions = selectedRole.permissions.filter(p => p !== permId);
    } else {
      newPermissions = [...selectedRole.permissions, permId];
    }
    
    updateRolePermissions(selectedRole.id, newPermissions);
    
    setToast(`Permission ${hasPerm ? 'retirée' : 'accordée'} avec succès`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-mint-500" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Matrice des Permissions</h1>
          <p className="text-xs font-medium text-gray-500">Configurez les accès granulaires pour chaque rôle du système.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-700">Sélectionner un rôle :</label>
          <select 
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-mint-500 focus:border-mint-500 block w-full p-2.5 shadow-sm"
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedRole ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 min-h-[400px] flex items-center justify-center text-gray-400">
          Veuillez sélectionner un rôle.
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
          <div className="mb-6 p-4 bg-emerald-50 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900 mb-1">Rôle : {selectedRole.name}</h3>
              <p className="text-xs text-emerald-700 font-medium">{selectedRole.description}</p>
              {selectedRole.id === 'admin' && (
                <p className="text-[10px] text-rose-600 font-bold mt-2 uppercase tracking-wider">
                  Attention: Modifier les droits de l'administrateur peut bloquer l'accès au système.
                </p>
              )}
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-500 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 rounded-tl-2xl w-1/4">Domaine</th>
                {ALL_ACTIONS.map(action => (
                  <th key={action} scope="col" className="px-6 py-4 text-center">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ALL_DOMAINS.map((domain, index) => (
                <tr key={domain} className="bg-white hover:bg-gray-50/50 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap capitalize">
                    {domain}
                  </th>
                  {ALL_ACTIONS.map(action => {
                    const permId = `${domain}.${action}`;
                    const hasPerm = selectedRole.permissions.includes(permId);
                    return (
                      <td key={action} className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={hasPerm}
                            onChange={() => handleToggle(domain, action)}
                          />
                          <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${hasPerm ? 'bg-mint-500' : 'bg-gray-200'}`}></div>
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
  );
};
