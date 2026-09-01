import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { Zap, Droplets, Wifi, Wrench, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  title: string;
  location: string;
  type: 'electrical' | 'plumbing' | 'network' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  reportedDate: string;
  resolvedDate?: string;
}

const mockTickets: MaintenanceTicket[] = [
  { id: 't-1', title: 'Panne électrique Bloc A niveau 2', location: 'Z-BLOC-A / MALL-N2-A04', type: 'electrical', priority: 'critical', status: 'in_progress', reportedDate: '2026-08-30' },
  { id: 't-2', title: 'Fuite d\'eau dans les sanitaires', location: 'Z-PARKING / Toilettes', type: 'plumbing', priority: 'high', status: 'open', reportedDate: '2026-08-31' },
  { id: 't-3', title: 'Réseau WiFi lent au niveau 1', location: 'Z-BLOC-B / Couloir', type: 'network', priority: 'medium', status: 'open', reportedDate: '2026-09-01' },
  { id: 't-4', title: 'Porte automatique en panne', location: 'Entrée principale', type: 'general', priority: 'high', status: 'resolved', reportedDate: '2026-08-28', resolvedDate: '2026-08-29' },
  { id: 't-5', title: 'Climatiseur hors service', location: 'Bureau Administration', type: 'electrical', priority: 'medium', status: 'in_progress', reportedDate: '2026-08-29' },
];

const typeConfig: Record<string, { icon: React.FC<any>; color: string; label: string }> = {
  electrical: { icon: Zap, color: 'text-amber-500 bg-amber-50', label: 'Électricité' },
  plumbing: { icon: Droplets, color: 'text-sky-500 bg-sky-50', label: 'Plomberie' },
  network: { icon: Wifi, color: 'text-purple-500 bg-purple-50', label: 'Réseau' },
  general: { icon: Wrench, color: 'text-gray-500 bg-gray-100', label: 'Général' },
};
const priorityColors: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
};
const statusConfig: Record<string, { icon: React.FC<any>; color: string; label: string }> = {
  open: { icon: AlertTriangle, color: 'text-rose-500', label: 'Ouvert' },
  in_progress: { icon: Clock, color: 'text-amber-500', label: 'En cours' },
  resolved: { icon: CheckCircle, color: 'text-emerald-500', label: 'Résolu' },
};

export const InfraPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(mockTickets);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleResolve = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved', resolvedDate: new Date().toISOString().split('T')[0] } : t));
    showToast('Ticket marqué comme résolu');
  };

  const openTickets = tickets.filter(t => t.status !== 'resolved');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <CheckCircle className="w-4 h-4 text-mint-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Infrastructures & Maintenance</h1>
          <p className="text-xs font-medium text-gray-500">{openTickets.length} tickets ouverts — {resolvedTickets.length} résolus</p>
        </div>
        <PermissionGate permission="infrastructures.create">
          <button
            onClick={() => showToast('Formulaire de signalement (simulation)')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Signaler un incident
          </button>
        </PermissionGate>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(typeConfig).map(([type, conf]) => {
          const Icon = conf.icon;
          const count = tickets.filter(t => t.type === type).length;
          return (
            <div key={type} className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
              <div className={`w-10 h-10 ${conf.color} rounded-2xl flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{conf.label}</p>
                <p className="text-xl font-black text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tickets Grid */}
      <div className="space-y-3">
        {tickets.map(ticket => {
          const TypeIcon = typeConfig[ticket.type].icon;
          const StatusIcon = statusConfig[ticket.status].icon;
          return (
            <div key={ticket.id} className={`bg-white rounded-3xl p-5 shadow-xs border transition-colors ${ticket.status === 'resolved' ? 'border-emerald-100 opacity-70' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 ${typeConfig[ticket.type].color} rounded-2xl flex items-center justify-center shrink-0 mt-0.5`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-gray-900 truncate">{ticket.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{ticket.location}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Signalé le {ticket.reportedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${statusConfig[ticket.status].color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig[ticket.status].label}</span>
                  </div>
                  {ticket.status !== 'resolved' && (
                    <PermissionGate permission="infrastructures.validate">
                      <button
                        onClick={() => handleResolve(ticket.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Marquer résolu
                      </button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
