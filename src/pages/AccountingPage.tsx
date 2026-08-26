import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatBIF, formatDateShort } from '../lib/formatters';
import { DisbursementRequest as Disbursement } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Calculator, Plus, CheckCircle, XCircle } from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { permissions, currentUser } = useAuth();
  const { showToast } = useToast();

  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // New Disbursement Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    motive: '',
    category: 'Fournisseurs',
    paymentMethod: 'Virement',
  });

  useEffect(() => {
    fetchDisbursements();
  }, []);

  const fetchDisbursements = () => {
    setIsLoading(true);
    MockApiService.getDisbursements().then((data) => {
      setDisbursements(data);
      setIsLoading(false);
    });
  };

  const filteredDisbursements = disbursements.filter((d) => {
    const matchesSearch =
      d.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await (MockApiService as any).createDisbursement({
        amount: formData.amount,
        purpose: formData.motive,
        costCenterName: formData.category,
        paymentMethod: formData.paymentMethod,
        applicantName: currentUser!.name,
      });
      setDisbursements([created, ...disbursements]);
      setIsModalOpen(false);
      setFormData({ amount: 0, motive: '', category: 'Fournisseurs', paymentMethod: 'Virement' });
      showToast(`Demande de décaissement ${created.requestNumber} soumise.`);
    } catch (err: any) {
      showToast('Erreur lors de la création du décaissement', 'error');
    }
  };

  const handleApprove = async (id: string, decision: 'APPROUVE' | 'REJETE') => {
    try {
      const updated = await MockApiService.updateDisbursementStatus(id, decision === 'APPROUVE' ? 'Validé' : 'Rejeté', { name: currentUser!.name } as any);
      setDisbursements((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      showToast(`Décaissement ${decision === 'APPROUVE' ? 'approuvé' : 'rejeté'} avec succès.`, decision === 'APPROUVE' ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const tableColumns: Column<Disbursement>[] = [
    {
      header: 'Référence',
      accessor: (r) => <span className="font-extrabold text-gray-900">{r.requestNumber}</span>,
    },
    {
      header: 'Date & Initiateur',
      accessor: (r) => (
        <div>
          <div className="font-semibold text-gray-800">{formatDateShort(r.createdAt)}</div>
          <div className="text-[10px] text-gray-400 font-medium">Par {r.applicantName}</div>
        </div>
      ),
    },
    {
      header: 'Motif & Catégorie',
      accessor: (r) => (
        <div>
          <div className="font-semibold text-gray-800 truncate max-w-[200px]">{r.purpose}</div>
          <div className="text-[10px] text-gray-400 font-bold bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-0.5">{r.costCenterName}</div>
        </div>
      ),
    },
    {
      header: 'Montant',
      accessor: (r) => <span className="font-black text-rose-600">- {formatBIF(r.amount)}</span>,
    },
    {
      header: 'Statut',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Validation (Double)',
      accessor: (r) => (
        <div className="text-[10px] font-medium text-gray-500 space-y-0.5">
           <div className="flex items-center gap-1">
              {r.confirmedBy ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              <span>Chef Comptable {r.confirmedBy && `(${r.confirmedBy})`}</span>
           </div>
           <div className="flex items-center gap-1">
              {r.approvedBy ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
              <span>DG {r.approvedBy && `(${r.approvedBy})`}</span>
           </div>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (r) => {
        if (r.status === 'Validé' && permissions.canApproveDisbursements) {
          return (
            <div className="flex items-center gap-2">
               <button onClick={() => handleApprove(r.id, 'APPROUVE')} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 p-1.5 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
               <button onClick={() => handleApprove(r.id, 'REJETE')} className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg"><XCircle className="w-4 h-4" /></button>
            </div>
          );
        }
        if (r.status === 'Confirmé' && permissions.canApproveDisbursements) {
          return (
            <div className="flex items-center gap-2">
               <button onClick={() => handleApprove(r.id, 'APPROUVE')} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 p-1.5 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
               <button onClick={() => handleApprove(r.id, 'REJETE')} className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg"><XCircle className="w-4 h-4" /></button>
            </div>
          );
        }
        return <span className="text-gray-400 text-xs italic">Aucune action</span>;
      },
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Comptabilité & Décaissements"
        subtitle="Suivi des dépenses et validation des décaissements (Workflow à double vérification)"
        breadcrumbs={[{ label: 'Comptabilité' }]}
        actions={
          permissions.canCreateAccountingEntries && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Décaissement</span>
            </button>
          )
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher référence ou motif..."
        filterGroups={[
          {
            id: 'status',
            label: 'Statut',
            selectedValue: selectedStatus,
            options: [
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'Validé', label: 'En attente Chef Comptable' },
              { value: 'Confirmé', label: 'En attente DG' },
              { value: 'APPROUVE', label: 'Approuvés (Payés)' },
              { value: 'REJETE', label: 'Rejetés' },
            ],
            onChange: setSelectedStatus,
          },
        ]}
      />

      {/* Info double validation */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 mb-5 flex items-start gap-3">
         <Calculator className="w-5 h-5 text-sky-600 shrink-0" />
         <div>
            <span className="font-extrabold block mb-0.5">Procédure de validation des dépenses</span>
            Toute sortie de fonds initiée par un Comptable nécessite une double validation séquentielle : d'abord par le <strong>Chef Comptable</strong>, puis l'approbation finale par la <strong>Direction Générale</strong>.
         </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={filteredDisbursements}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Demande de Décaissement"
        subtitle="Saisie d'une nouvelle dépense nécessitant approbation"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDisbursement} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">Montant à décaisser (BIF) *</label>
            <input
              type="number"
              required
              min={100}
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">Catégorie *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40"
            >
              <option value="Fournisseurs">Paiement Fournisseurs</option>
              <option value="Maintenance">Frais de Maintenance</option>
              <option value="Salaires">Salaires et Primes</option>
              <option value="Taxes">Taxes et Impôts</option>
              <option value="Divers">Divers</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">Motif Détaillé *</label>
            <textarea
              required
              rows={3}
              value={formData.motive}
              onChange={(e) => setFormData({ ...formData, motive: e.target.value })}
              placeholder="Ex: Facture d'entretien OBR n° 12345..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40"
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-2xl">Annuler</button>
             <button type="submit" className="px-5 py-2.5 text-xs font-black text-white bg-mint-500 hover:bg-mint-600 rounded-2xl shadow-md">Soumettre pour validation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
