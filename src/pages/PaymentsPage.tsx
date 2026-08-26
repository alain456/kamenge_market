import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF } from '../lib/formatters';
import { Payment } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { CreditCard } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    MockApiService.getPayments().then((data) => {
      setPayments(data);
      setIsLoading(false);
    });
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = selectedMethod === 'ALL' || p.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const tableColumns: Column<Payment>[] = [
    {
      header: 'Date & Agent',
      accessor: (r) => (
        <div>
          <div className="font-extrabold text-gray-900">{r.date}</div>
          <div className="text-[10px] text-gray-400 font-medium">Saisi par {r.agentName}</div>
        </div>
      ),
    },
    {
      header: 'Locataire',
      accessor: (r) => <span className="font-semibold text-gray-700">{r.merchantName}</span>,
    },
    {
      header: 'Facture Réf.',
      accessor: (r) => <span className="font-bold text-gray-500">{r.invoiceNumber}</span>,
    },
    {
      header: 'Montant',
      accessor: (r) => <span className="font-black text-emerald-600">{formatBIF(r.amount)}</span>,
    },
    {
      header: 'Moyen de Paiement',
      accessor: (r) => (
        <div>
          <div className="font-bold text-gray-800">{r.method}</div>
          <div className="text-[10px] text-gray-400 font-medium">Réf: {r.reference}</div>
        </div>
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
        title="Journal des Encaissements"
        subtitle="Historique de tous les paiements confirmés sur les différents canaux"
        breadcrumbs={[{ label: 'Paiements' }]}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher commerçant, facture, référence..."
        filterGroups={[
          {
            id: 'method',
            label: 'Moyen de Paiement',
            selectedValue: selectedMethod,
            options: [
              { value: 'ALL', label: 'Tous les moyens' },
              { value: 'Virement', label: 'Virement Bancaire' },
              { value: 'Mobile Money', label: 'Mobile Money' },
              { value: 'Espèces', label: 'Espèces (Caisse)' },
            ],
            onChange: setSelectedMethod,
          },
        ]}
      />

      <DataTable
        columns={tableColumns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
      />
    </div>
  );
};
