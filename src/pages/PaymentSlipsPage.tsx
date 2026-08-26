import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF, formatDateShort } from '../lib/formatters';
import { PaymentSlip } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { SlipVerifyDrawer } from '../components/domain/SlipVerifyDrawer';
import { FileSearch } from 'lucide-react';

export const PaymentSlipsPage: React.FC = () => {
  const { permissions, currentUser } = useAuth();
  const { showToast } = useToast();

  const [slips, setSlips] = useState<PaymentSlip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state
  const [selectedSlip, setSelectedSlip] = useState<PaymentSlip | null>(null);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = () => {
    setIsLoading(true);
    MockApiService.getPaymentSlips().then((data) => {
      setSlips(data);
      setIsLoading(false);
    });
  };

  const filteredSlips = slips.filter((s) => {
    // Merchant can only see their own slips
    if (permissions.isMerchant && s.merchantId !== currentUser?.id) {
      return false;
    }
    const matchesSearch =
      s.slipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.placeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleVerifySlip = async (id: string, decision: 'APPROUVE' | 'REJETE', comment?: string, rejectionReason?: string) => {
    try {
      const updated = await MockApiService.verifyPaymentSlip(id, decision, currentUser!.name, comment, rejectionReason);
      setSlips((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`Bordereau ${updated.slipNumber} ${decision === 'APPROUVE' ? 'approuvé' : 'rejeté'} avec succès.`, decision === 'APPROUVE' ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const tableColumns: Column<PaymentSlip>[] = [
    {
      header: 'N° Bordereau',
      accessor: (r) => <span className="font-extrabold text-gray-900">{r.slipNumber}</span>,
    },
    {
      header: 'Date Soumission',
      accessor: (r) => <span className="text-gray-500 font-semibold">{formatDateShort(r.submissionDate)}</span>,
    },
    {
      header: 'Locataire',
      accessor: (r) => (
        <div>
          <div className="font-semibold text-gray-800">{r.merchantName}</div>
          <div className="text-[10px] text-gray-400 font-medium">{r.placeCode}</div>
        </div>
      ),
    },
    {
      header: 'Déclaré vs Attendu',
      accessor: (r) => (
        <div>
          <div className="font-black text-emerald-600">{formatBIF(r.declaredAmount)}</div>
          <div className="text-[10px] text-gray-400 font-bold line-through">{formatBIF(r.expectedAmount)}</div>
        </div>
      ),
    },
    {
      header: 'Fichier',
      accessor: (r) => (
        <span className="text-xs font-semibold text-mint-600 truncate max-w-[150px] inline-block">
          {r.fileName}
        </span>
      ),
    },
    {
      header: 'Statut',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Action',
      accessor: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSlip(r);
          }}
          className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
        >
          {r.status === 'EN_ATTENTE' && !permissions.isMerchant ? (
            <>
              <span>Vérifier</span>
              <FileSearch className="w-3 h-3" />
            </>
          ) : (
            <span>Détails</span>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title={permissions.isMerchant ? "Mes Bordereaux" : "Vérification des Bordereaux Bancaires"}
        subtitle={permissions.isMerchant ? "Historique de vos preuves de paiement soumises" : "Contrôle des justificatifs de paiement soumis par les locataires"}
        breadcrumbs={[{ label: permissions.isMerchant ? "Mes Bordereaux" : 'Bordereaux' }]}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher bordereau, locataire, local..."
        filterGroups={[
          {
            id: 'status',
            label: 'Statut',
            selectedValue: selectedStatus,
            options: [
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'EN_ATTENTE', label: 'En attente de vérification' },
              { value: 'APPROUVE', label: 'Approuvés' },
              { value: 'REJETE', label: 'Rejetés' },
            ],
            onChange: setSelectedStatus,
          },
        ]}
      />

      <DataTable
        columns={tableColumns}
        data={filteredSlips}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        onRowClick={(s) => setSelectedSlip(s)}
      />

      <SlipVerifyDrawer
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        slip={selectedSlip}
        onVerify={handleVerifySlip}
      />
    </div>
  );
};
