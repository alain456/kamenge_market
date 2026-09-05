import React, { useState, useEffect } from 'react';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { ApiService } from '../services/api';
import { Place } from '../types/domain';
import { Zap, Droplets, Wifi, Wrench, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  title: string;
  location: string;
  type: 'electrical' | 'plumbing' | 'network' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  reportedDate: string;
  placeStatus: string;
}

function placesToTickets(places: Place[]): MaintenanceTicket[] {
  return places
    .filter((p) => ['MAINTENANCE', 'IMPAYE', 'SCELLE', 'PREUVE_EN_ATTENTE'].includes(p.status))
    .map((p) => ({
      id: p.id,
      title: p.status === 'MAINTENANCE'
        ? `Maintenance — ${p.code}`
        : p.status === 'SCELLE'
          ? `Scellé — ${p.code}`
          : p.status === 'IMPAYE'
            ? `Impayé — ${p.code}`
            : `Preuve en attente — ${p.code}`,
      location: `${p.zoneName} / ${p.code}`,
      type: p.status === 'MAINTENANCE' ? 'electrical' : 'general',
      priority: p.status === 'SCELLE' ? 'critical' : p.status === 'IMPAYE' ? 'high' : 'medium',
      status: p.status === 'MAINTENANCE' ? 'in_progress' : 'open',
      reportedDate: p.lastDueDate || '—',
      placeStatus: p.status,
    }));
}

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
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    ApiService.getPlaces()
      .then((places) => setTickets(placesToTickets(places)))
      .catch(() => showToast('Erreur de chargement des emplacements'))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (ticket: MaintenanceTicket) => {
    try {
      await ApiService.updatePlaceStatus(ticket.id, 'LIBRE', 'Maintenance terminée');
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      showToast('Emplacement remis en service');
    } catch {
      showToast('Impossible de mettre à jour le statut');
    }
  };

  const openTickets = tickets.filter((t) => t.status !== 'resolved');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Chargement des incidents...</span>
      </div>
    );
  }

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
          <p className="text-xs font-medium text-gray-500">{openTickets.length} emplacements nécessitant une intervention</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Maintenance', filter: 'MAINTENANCE', icon: Wrench, color: 'bg-amber-500' },
          { label: 'Impayés', filter: 'IMPAYE', icon: AlertTriangle, color: 'bg-rose-500' },
          { label: 'Scellés', filter: 'SCELLE', icon: Zap, color: 'bg-purple-500' },
          { label: 'Preuves en attente', filter: 'PREUVE_EN_ATTENTE', icon: Clock, color: 'bg-sky-500' },
        ].map(({ label, filter, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <p className="text-xl font-black text-gray-900">{tickets.filter((t) => t.placeStatus === filter).length}</p>
            </div>
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 font-medium text-sm border border-gray-100">
          Aucun incident d'infrastructure signalé pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const TypeIcon = typeConfig[ticket.type].icon;
            const StatusIcon = statusConfig[ticket.status].icon;
            return (
              <div key={ticket.id} className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
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
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ticket.placeStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${statusConfig[ticket.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusConfig[ticket.status].label}</span>
                    </div>
                    {ticket.placeStatus === 'MAINTENANCE' && (
                      <PermissionGate permission="infrastructures.validate">
                        <button
                          onClick={() => handleResolve(ticket)}
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
      )}
    </div>
  );
};
