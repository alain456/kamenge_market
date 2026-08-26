import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF, formatDateShort } from '../lib/formatters';
import { Contract } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { permissions, currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    MockApiService.getContracts().then((data) => {
      setContracts(data);
      setIsLoading(false);
    });
  }, []);

  const filteredContracts = contracts.filter((c) => {
    // Merchant can only see their own contract
    if (permissions.isMerchant && c.merchantId !== currentUser?.id) {
      return false;
    }
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.placeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const tableColumns: Column<Contract>[] = [
    {
      header: 'Contrat',
      accessor: (r) => <span className="font-extrabold text-gray-900">{r.code}</span>,
    },
    {
      header: 'Locataire',
      accessor: (r) => <span className="font-semibold text-gray-700">{r.merchantName}</span>,
    },
    {
      header: 'Local',
      accessor: (r) => <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg">{r.placeCode}</span>,
    },
    {
      header: 'Loyer Mensuel',
      accessor: (r) => <span className="font-bold">{formatBIF(r.monthlyRent)}</span>,
    },
    {
      header: 'Caution',
      accessor: (r) => (
        <span className="text-gray-500">
          {r.depositMonths} mois ({formatBIF(r.depositAmount)})
        </span>
      ),
    },
    {
      header: 'Période',
      accessor: (r) => (
        <span className="text-gray-500">
          {formatDateShort(r.startDate)} - {formatDateShort(r.endDate)}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title={permissions.isMerchant ? "Mon Contrat" : "Gestion des Contrats de Location"}
        subtitle={permissions.isMerchant ? "Détails de votre bail commercial et engagements" : "Registre des baux commerciaux et suivi des engagements"}
        breadcrumbs={[{ label: permissions.isMerchant ? 'Mon Contrat' : 'Contrats' }]}
        actions={
          permissions.canCreateContract && (
            <button
              onClick={() => navigate('/contracts/new')}
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Contrat</span>
            </button>
          )
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher contrat, locataire, local..."
        filterGroups={[
          {
            id: 'status',
            label: 'Statut',
            selectedValue: selectedStatus,
            options: [
              { value: 'ALL', label: 'Tous les Statuts' },
              { value: 'ACTIF', label: 'Actifs' },
              { value: 'RESILIE', label: 'Résiliés' },
              { value: 'EN_LITIGE', label: 'En Litige' },
            ],
            onChange: setSelectedStatus,
          },
        ]}
      />

      <DataTable
        columns={tableColumns}
        data={filteredContracts}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
      />
    </div>
  );
};
