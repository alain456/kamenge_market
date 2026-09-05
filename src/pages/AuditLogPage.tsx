import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { AuditLog } from '../types/domain';
import { ApiService } from '../services/api';
import { History, Search } from 'lucide-react';
import { formatDateShort } from '../lib/formatters';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    ApiService.getAuditLogs().then(data => {
      setLogs(data);
      setIsLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableColumns: Column<AuditLog>[] = [
    {
      header: 'Date & Heure',
      accessor: (r) => <span className="font-semibold text-gray-500">{formatDateShort(r.timestamp)}</span>,
    },
    {
      header: 'Utilisateur (Rôle)',
      accessor: (r) => (
        <div>
           <div className="font-extrabold text-gray-900">{r.userName}</div>
           <div className="text-[10px] text-gray-400 font-bold">{r.userRole}</div>
        </div>
      ),
    },
    {
      header: 'Action Réalisée',
      accessor: (r) => (
        <div>
           <div className="font-bold text-gray-800">{r.action}</div>
           <div className="text-[11px] text-gray-500 font-medium italic mt-0.5">{r.details}</div>
        </div>
      ),
    },
    {
      header: 'Entité Cible',
      accessor: (r) => <span className="font-bold text-mint-700 bg-mint-50 px-2.5 py-1 rounded-lg text-[10px] uppercase">{r.resource}</span>,
    },
    {
      header: 'Niveau',
      accessor: (r) => (
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
          (r as any).level === 'CRITIQUE' ? 'bg-rose-100 text-rose-700' :
          (r as any).level === 'ALERTE' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {(r as any).level || 'INFO'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Journal d'Audit Système"
        subtitle="Traçabilité complète des actions effectuées sur le back-office"
        breadcrumbs={[{ label: 'Audit Log' }]}
      />

      <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100 mb-5">
         <div className="relative w-full max-w-md">
            <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Rechercher une action, entité, utilisateur..."
               className="w-full bg-gray-50 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold border border-gray-200 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
         </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
      />
    </div>
  );
};
