import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF, formatDateShort } from '../lib/formatters';
import { Dispute } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { ExternalLink } from 'lucide-react';

export const DisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    MockApiService.getDisputes().then((data) => {
      // Sort by amount due descending by default as per requirements
      setDisputes(data.sort((a, b) => b.totalDue - a.totalDue));
      setIsLoading(false);
    });
  }, []);

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.placeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRisk === 'ALL' || d.riskLevel === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const tableColumns: Column<Dispute>[] = [
    {
      header: 'Locataire',
      accessor: (r) => (
        <div>
          <div className="font-extrabold text-gray-900">{r.merchantName}</div>
          <div className="text-[10px] text-gray-400 font-medium">{r.merchantPhone}</div>
        </div>
      ),
    },
    {
      header: 'Local',
      accessor: (r) => <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl">{r.placeCode}</span>,
    },
    {
      header: 'Ancienneté (Mois)',
      accessor: (r) => <span className="font-bold text-gray-700">{r.unpaidMonthsCount} mois</span>,
    },
    {
      header: 'Total Dû (Loyer + Pén.)',
      accessor: (r) => <span className="font-black text-rose-600">{formatBIF(r.totalDue)}</span>,
    },
    {
      header: 'Dernière Relance',
      accessor: (r) => <span className="text-gray-500 font-semibold">{formatDateShort(r.lastReminderDate)}</span>,
    },
    {
      header: 'Niveau de Risque',
      accessor: (r) => <StatusBadge status={r.riskLevel} type="risk" />,
    },
    {
      header: 'Statut du Dossier',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Action',
      accessor: (r) => (
        <button
          onClick={() => navigate(`/disputes/${r.id}`)}
          className="px-3 py-1.5 bg-gray-100 hover:bg-rose-100 hover:text-rose-800 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
        >
          <span>Traiter</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Impayés & Contentieux (Recouvrement)"
        subtitle="Suivi des dossiers d'arriérés, relances et procédures de recouvrement forcé"
        breadcrumbs={[{ label: 'Contentieux' }]}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher locataire, local..."
        filterGroups={[
          {
            id: 'risk',
            label: 'Niveau de Risque',
            selectedValue: selectedRisk,
            options: [
              { value: 'ALL', label: 'Tous les niveaux' },
              { value: 'FAIBLE', label: 'Faible' },
              { value: 'MOYEN', label: 'Moyen' },
              { value: 'ELEVE', label: 'Élevé' },
              { value: 'CRITIQUE', label: 'Critique' },
            ],
            onChange: setSelectedRisk,
          },
        ]}
      />

      <DataTable
        columns={tableColumns}
        data={filteredDisputes}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
      />
    </div>
  );
};
