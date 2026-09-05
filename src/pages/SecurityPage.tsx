import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionGate } from '../components/auth/PermissionGate';
import { ApiService } from '../services/api';
import { Dispute, AuditLog } from '../types/domain';
import { Shield, AlertOctagon, CheckCircle, Clock, Plus, Eye, Loader2 } from 'lucide-react';

interface SecurityIncident {
  id: string;
  title: string;
  location: string;
  type: 'theft' | 'fight' | 'fire' | 'access' | 'other';
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'under_investigation' | 'closed';
  reportedAt: string;
  reportedBy: string;
  source: 'dispute' | 'audit';
}

function disputesToIncidents(disputes: Dispute[]): SecurityIncident[] {
  return disputes
    .filter((d) => d.riskLevel === 'ELEVE' || d.riskLevel === 'CRITIQUE' || d.status === 'Procédure Scellé')
    .map((d) => ({
      id: `dispute-${d.id}`,
      title: d.status === 'Procédure Scellé'
        ? `Procédure de scellé — ${d.merchantName}`
        : `Contentieux — ${d.merchantName}`,
      location: d.placeCode,
      type: d.status === 'Procédure Scellé' ? 'access' : 'other',
      severity: d.riskLevel === 'CRITIQUE' ? 'high' : 'medium',
      status: d.status === 'Régularisé' ? 'closed' : d.status === 'Procédure Scellé' ? 'under_investigation' : 'open',
      reportedAt: d.lastReminderDate || '—',
      reportedBy: 'Système contentieux',
      source: 'dispute' as const,
    }));
}

function auditToIncidents(logs: AuditLog[]): SecurityIncident[] {
  return logs
    .filter((l) => l.level === 'CRITIQUE' || l.action.toLowerCase().includes('scellé') || l.action.toLowerCase().includes('sécurité'))
    .map((l) => ({
      id: `audit-${l.id}`,
      title: l.action,
      location: l.resource,
      type: 'other' as const,
      severity: l.level === 'CRITIQUE' ? 'high' : 'medium',
      status: 'under_investigation' as const,
      reportedAt: l.timestamp,
      reportedBy: l.userName,
      source: 'audit' as const,
    }));
}

const typeLabel: Record<string, string> = { theft: 'Vol', fight: 'Altercation', fire: 'Incendie', access: 'Accès interdit', other: 'Autre' };
const typeColor: Record<string, string> = {
  theft: 'bg-rose-100 text-rose-700', fight: 'bg-orange-100 text-orange-700',
  fire: 'bg-red-100 text-red-700', access: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600',
};
const severityColors: Record<string, string> = { high: 'text-rose-600', medium: 'text-amber-600', low: 'text-gray-500' };
const statusLabel: Record<string, string> = { open: 'Ouvert', under_investigation: 'En investigation', closed: 'Clôturé' };

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ApiService.getDisputes(), ApiService.getAuditLogs()])
      .then(([disputes, logs]) => {
        const combined = [...disputesToIncidents(disputes), ...auditToIncidents(logs)];
        setIncidents(combined);
      })
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Chargement des incidents de sécurité...</span>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Sécurité</h1>
          <p className="text-xs font-medium text-gray-500">
            {incidents.filter((i) => i.status !== 'closed').length} incidents actifs — contentieux & journal d'audit
          </p>
        </div>
        <PermissionGate permission="securite.create">
          <button
            onClick={() => navigate('/plaintes')}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Voir les contentieux
          </button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Incidents totaux', value: incidents.length, icon: AlertOctagon, color: 'bg-rose-500' },
          { label: 'En investigation', value: incidents.filter((i) => i.status === 'under_investigation').length, icon: Eye, color: 'bg-amber-500' },
          { label: 'Haute sévérité', value: incidents.filter((i) => i.severity === 'high').length, icon: Shield, color: 'bg-purple-500' },
          { label: 'Clôturés', value: incidents.filter((i) => i.status === 'closed').length, icon: CheckCircle, color: 'bg-emerald-500' },
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

      {incidents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 font-medium text-sm border border-gray-100">
          Aucun incident de sécurité enregistré.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className={`bg-white rounded-3xl p-5 shadow-xs border ${incident.status === 'closed' ? 'border-emerald-100 opacity-70' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[incident.type]}`}>{typeLabel[incident.type]}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{incident.source === 'audit' ? 'Audit' : 'Contentieux'}</span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900">{incident.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">{incident.location}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Par {incident.reportedBy} — {incident.reportedAt}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${severityColors[incident.severity]}`}>
                  <Clock className="w-4 h-4" />
                  <span>{statusLabel[incident.status]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
