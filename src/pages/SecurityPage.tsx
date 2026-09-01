import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { Shield, AlertOctagon, Camera, CheckCircle, Clock, Plus, Eye } from 'lucide-react';

interface SecurityIncident {
  id: string;
  title: string;
  location: string;
  type: 'theft' | 'fight' | 'fire' | 'access' | 'other';
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'under_investigation' | 'closed';
  reportedAt: string;
  reportedBy: string;
}

const mockIncidents: SecurityIncident[] = [
  { id: 's-1', title: 'Tentative de vol au Bloc B', location: 'MALL-N1-B08', type: 'theft', severity: 'high', status: 'under_investigation', reportedAt: '2026-08-31 14:30', reportedBy: 'Agent Bernard' },
  { id: 's-2', title: 'Altercation entre commerçants', location: 'Zone Parking', type: 'fight', severity: 'medium', status: 'closed', reportedAt: '2026-08-29 11:00', reportedBy: 'Agent Amina' },
  { id: 's-3', title: 'Accès non autorisé — salle technique', location: 'Z-ADM / Salle Serveurs', type: 'access', severity: 'high', status: 'open', reportedAt: '2026-09-01 08:15', reportedBy: 'Système CCTV' },
  { id: 's-4', title: 'Odeur de fumée suspecte', location: 'Z-BLOC-A / Couloir N2', type: 'fire', severity: 'high', status: 'closed', reportedAt: '2026-08-27 16:45', reportedBy: 'Agent Pierre' },
];

const typeLabel: Record<string, string> = { theft: 'Vol', fight: 'Altercation', fire: 'Incendie', access: 'Accès interdit', other: 'Autre' };
const typeColor: Record<string, string> = {
  theft: 'bg-rose-100 text-rose-700', fight: 'bg-orange-100 text-orange-700',
  fire: 'bg-red-100 text-red-700', access: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600'
};
const severityColors: Record<string, string> = { high: 'text-rose-600', medium: 'text-amber-600', low: 'text-gray-500' };
const statusLabel: Record<string, string> = { open: 'Ouvert', under_investigation: 'En investigation', closed: 'Clôturé' };

export const SecurityPage: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>(mockIncidents);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleClose = (id: string) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'closed' } : i));
    showToast('Incident clôturé');
  };

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <CheckCircle className="w-4 h-4 text-mint-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Sécurité</h1>
          <p className="text-xs font-medium text-gray-500">{incidents.filter(i => i.status !== 'closed').length} incidents actifs</p>
        </div>
        <PermissionGate permission="securite.create">
          <button onClick={() => showToast('Formulaire de rapport (simulation)')}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            Signaler un incident
          </button>
        </PermissionGate>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Incidents totaux', value: incidents.length, icon: AlertOctagon, color: 'bg-rose-500' },
          { label: 'En investigation', value: incidents.filter(i => i.status === 'under_investigation').length, icon: Eye, color: 'bg-amber-500' },
          { label: 'Haute sévérité', value: incidents.filter(i => i.severity === 'high').length, icon: Shield, color: 'bg-purple-500' },
          { label: 'Clôturés', value: incidents.filter(i => i.status === 'closed').length, icon: CheckCircle, color: 'bg-emerald-500' },
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

      {/* Incidents List */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <Camera className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-black text-gray-900">Journal des Incidents de Sécurité</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {incidents.map(incident => (
            <div key={incident.id} className={`p-5 flex items-start justify-between gap-4 transition-colors ${incident.status === 'closed' ? 'opacity-60' : 'hover:bg-gray-50/50'}`}>
              <div className="flex items-start gap-3 min-w-0">
                <AlertOctagon className={`w-5 h-5 mt-0.5 shrink-0 ${severityColors[incident.severity]}`} />
                <div>
                  <h4 className="text-sm font-black text-gray-900">{incident.title}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{incident.location}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${typeColor[incident.type]}`}>{typeLabel[incident.type]}</span>
                    <span className="text-[10px] text-gray-400">{incident.reportedAt} — par {incident.reportedBy}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  incident.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                  incident.status === 'under_investigation' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>{statusLabel[incident.status]}</span>
                {incident.status !== 'closed' && (
                  <PermissionGate permission="securite.validate">
                    <button onClick={() => handleClose(incident.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                      Clôturer
                    </button>
                  </PermissionGate>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
