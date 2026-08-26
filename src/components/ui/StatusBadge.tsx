import React from 'react';
import { PlaceStatus, InvoiceStatus, SlipStatus, ContractStatus, DisputeRisk } from '../../types/domain';
import { CheckCircle2, Clock, AlertTriangle, Lock, Wrench, FileCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: PlaceStatus | InvoiceStatus | SlipStatus | ContractStatus | DisputeRisk | string;
  type?: 'place' | 'invoice' | 'slip' | 'contract' | 'risk' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  switch (status) {
    // Place Statuses
    case 'LIBRE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Libre
        </span>
      );
    case 'OCCUPE':
    case 'ACTIF':
    case 'CONFIRME':
    case 'APPROUVE':
    case 'PAYEE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          {status === 'OCCUPE' ? 'Occupé (À jour)' : status === 'PAYEE' ? 'Payée' : status}
        </span>
      );
    case 'PREUVE_EN_ATTENTE':
    case 'EN_ATTENTE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {status === 'PREUVE_EN_ATTENTE' ? 'Preuve soumise' : 'En attente'}
        </span>
      );
    case 'IMPAYE':
    case 'IMPAYEE':
    case 'EN_RETARD':
    case 'EN_LITIGE':
    case 'REJETE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {status === 'IMPAYE' || status === 'IMPAYEE' ? 'Impayé' : status === 'EN_RETARD' ? 'En retard' : status}
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          <Wrench className="w-3.5 h-3.5 text-purple-600" />
          Maintenance
        </span>
      );
    case 'SCELLE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white border border-gray-700 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          Scellé (Fermé)
        </span>
      );
    case 'CRITIQUE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
          <XCircle className="w-3.5 h-3.5" />
          Risque Critique
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          {status}
        </span>
      );
  }
};
