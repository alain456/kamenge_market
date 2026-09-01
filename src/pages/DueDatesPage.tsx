import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatBIF, formatDateShort } from '../lib/formatters';
import { DueDateInvoice } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { usePermissions } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { CalendarClock, Zap, Info } from 'lucide-react';

export const DueDatesPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<DueDateInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genPeriod, setGenPeriod] = useState('Septembre 2026');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = () => {
    setIsLoading(true);
    MockApiService.getDueDates().then((data) => {
      setInvoices(data);
      setIsLoading(false);
    });
  };

  const filteredInvoices = invoices.filter((i) => {
    // Merchant can only see their own invoices
    if (false) {
      return false;
    }
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.placeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || i.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    try {
      const count = await MockApiService.generateMonthlyDueDates(genPeriod);
      showToast(`${count} factures générées pour la période ${genPeriod}.`);
      setIsGeneratorOpen(false);
      fetchInvoices();
    } catch (error) {
      showToast('Erreur lors de la génération des échéances', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const tableColumns: Column<DueDateInvoice>[] = [
    {
      header: 'Période & N° Facture',
      accessor: (r) => (
        <div>
          <div className="font-extrabold text-gray-900">{r.period}</div>
          <div className="text-[10px] font-medium text-gray-400">{r.invoiceNumber}</div>
        </div>
      ),
    },
    {
      header: 'Locataire & Local',
      accessor: (r) => (
        <div>
          <div className="font-semibold text-gray-800">{r.merchantName}</div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
            {r.placeCode}
          </div>
        </div>
      ),
    },
    {
      header: 'Date d\'Échéance',
      accessor: (r) => <span className="text-gray-600 font-semibold">{formatDateShort(r.dueDate)}</span>,
    },
    {
      header: 'Montant Total',
      accessor: (r) => <span className="font-bold text-gray-900">{formatBIF(r.amount + r.penaltyAmount)}</span>,
    },
    {
      header: 'Reste à Payer',
      accessor: (r) => (
        <span className={`font-black ${r.remainingAmount > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
          {formatBIF(r.remainingAmount)}
        </span>
      ),
    },
    {
      header: 'Pénalité (5%)',
      accessor: (r) => (
        <span className={`font-semibold text-xs ${r.penaltyAmount > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
          {r.penaltyAmount > 0 ? formatBIF(r.penaltyAmount) : '-'}
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
        title={""Échéances & Facturation"}
        subtitle={""Suivi des loyers attendus et calcul automatique des pénalités de retard"}
        breadcrumbs={[{ label: 'Échéances' }]}
        actions={
          hasPermission('finances.create') && (
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Générer les Échéances</span>
            </button>
          )
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher période, locataire, facture..."
        filterGroups={[
          {
            id: 'status',
            label: 'Statut',
            selectedValue: selectedStatus,
            options: [
              { value: 'ALL', label: 'Toutes les échéances' },
              { value: 'A_VENIR', label: 'À venir' },
              { value: 'PAYEE', label: 'Payées' },
              { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement Payées' },
              { value: 'IMPAYEE', label: 'Impayées' },
              { value: 'EN_RETARD', label: 'En retard (Pénalisées)' },
            ],
            onChange: setSelectedStatus,
          },
        ]}
      />

      {/* Penalty Rule Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs text-amber-900 mb-5">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-extrabold block mb-0.5">Règle de Pénalité Automatique</span>
          Toute facture impayée au-delà de sa date d'échéance se voit appliquer une pénalité fixe de <span className="font-black">5%</span> du montant du loyer de base. Ce montant est automatiquement ajouté au reste à payer.
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={filteredInvoices}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
      />

      {/* Generator Modal */}
      <Modal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="Générateur d'Échéances de Loyer"
        subtitle="Création automatique des factures pour tous les locaux occupés"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-xs font-medium text-gray-600">
            Cet outil génère les factures de loyer pour la période sélectionnée. Il ne ciblera que les emplacements dont le statut est <strong>Occupé</strong> et disposant d'un contrat actif.
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Période de Facturation
            </label>
            <select
              value={genPeriod}
              onChange={(e) => setGenPeriod(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
            >
              <option value="Septembre 2026">Septembre 2026</option>
              <option value="Octobre 2026">Octobre 2026</option>
              <option value="Novembre 2026">Novembre 2026</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setIsGeneratorOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-2xl"
            >
              Annuler
            </button>
            <button
              onClick={handleGenerateInvoices}
              disabled={isGenerating}
              className="px-5 py-2.5 text-xs font-black text-white bg-mint-500 hover:bg-mint-600 disabled:opacity-50 rounded-2xl flex items-center gap-2 transition-colors shadow-md"
            >
              {isGenerating ? 'Génération...' : 'Générer les factures'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
