import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Settings, Save, ShieldAlert } from 'lucide-react';
import { usePermissions } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('Paramètres mis à jour (Simulé).', 'success');
  };

  if (!hasPermission('rh.validate')) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-extrabold text-gray-900">Accès Refusé</h2>
        <p className="text-xs text-gray-500 mt-2">Vous n'avez pas les autorisations nécessaires pour accéder aux paramètres globaux du système.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Paramètres Généraux"
        subtitle="Configuration globale du système et règles métiers"
        breadcrumbs={[{ label: 'Paramètres' }]}
        actions={
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
           <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Règles de Facturation & Pénalités</h3>
           
           <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">Taux de pénalité de retard (%)</label>
              <input type="number" defaultValue={5} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none" />
              <p className="text-[10px] text-gray-500 mt-1">Appliqué automatiquement le jour suivant l'échéance.</p>
           </div>
           
           <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">Jour limite de paiement</label>
              <input type="number" defaultValue={5} max={31} min={1} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none" />
              <p className="text-[10px] text-gray-500 mt-1">Ex: le 5 de chaque mois.</p>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
           <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Notifications Automatiques</h3>
           
           <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-mint-600 focus:ring-mint-500" />
              <div>
                 <span className="text-xs font-bold text-gray-900 block">Envoi automatique des factures par SMS</span>
                 <span className="text-[10px] text-gray-500">Lors de la génération mensuelle.</span>
              </div>
           </label>

           <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-mint-600 focus:ring-mint-500" />
              <div>
                 <span className="text-xs font-bold text-gray-900 block">Relance J-2 avant échéance</span>
                 <span className="text-[10px] text-gray-500">Message préventif de rappel.</span>
              </div>
           </label>
        </div>
      </div>
    </div>
  );
};
