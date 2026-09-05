import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { FilterBar } from '../components/ui/FilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatBIF, formatDate } from '../lib/formatters';
import { Merchant } from '../types/domain';
import { ApiService } from '../services/api';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { useToast } from '../components/ui/Toast';
import { UserPlus, Mail, Phone, Shield, ExternalLink } from 'lucide-react';

export const MerchantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    ApiService.getMerchants()
      .then(setMerchants)
      .catch(() => showToast('Impossible de charger les commerçants', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  // Modal create merchant state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    identityCardNumber: '',
  });

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.assignedPlaceCode && m.assignedPlaceCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ApiService.createMerchant({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        identityCardNumber: formData.identityCardNumber,
        status: 'ACTIF',
        amountDue: 0,
      });
      setMerchants([created, ...merchants]);
      setIsModalOpen(false);
      setFormData({ fullName: '', phone: '', email: '', identityCardNumber: '' });
      showToast(`Commerçant ${created.fullName} enregistré avec succès.`);
    } catch (err: any) {
      showToast('Erreur lors de la création du commerçant', 'error');
    }
  };

  const tableColumns: Column<Merchant>[] = [
    {
      header: 'Commerçant / Raison Sociale',
      accessor: (r) => (
        <div>
          <div className="font-extrabold text-gray-900">{r.fullName}</div>
          <div className="text-[10px] text-gray-400 font-medium">{r.identityCardNumber}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (r) => (
        <div className="text-[11px] font-semibold text-gray-600">
          <div>{r.phone}</div>
          <div className="text-gray-400">{r.email}</div>
        </div>
      ),
    },
    {
      header: 'Local Attribué',
      accessor: (r) =>
        r.assignedPlaceCode ? (
          <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl">
            {r.assignedPlaceCode}
          </span>
        ) : (
          <span className="text-gray-400 italic">Aucun</span>
        ),
    },
    {
      header: 'Statut',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Montant Dû (Arriérés)',
      accessor: (r) => (
        <span className={`font-black ${r.amountDue > 0 ? 'text-rose-600' : 'text-gray-700'}`}>
          {formatBIF(r.amountDue)}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/commerce/${r.id}`);
          }}
          className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
        >
          <span>Détails</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Gestion des Commerçants Locataires"
        subtitle="Répertoire des commerçants du Mall, suivi des coordonnées et état financier"
        breadcrumbs={[{ label: 'Commerçants' }]}
        actions={
          <PermissionGate permission="commerce.create">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nouveau Commerçant</span>
            </button>
          </PermissionGate>
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher nom, téléphone, CNI, local..."
        filterGroups={[
          {
            id: 'status',
            label: 'Statut',
            selectedValue: selectedStatus,
            options: [
              { value: 'ALL', label: 'Tous les Statuts' },
              { value: 'ACTIF', label: 'Actifs' },
              { value: 'EN_LITIGE', label: 'En Litige / Impayé' },
              { value: 'INACTIF', label: 'Inactifs' },
            ],
            onChange: setSelectedStatus,
          },
        ]}
      />

      <DataTable
        columns={tableColumns}
        data={filteredMerchants}
        keyExtractor={(m) => m.id}
        onRowClick={(m) => navigate(`/commerce/${m.id}`)}
        isLoading={isLoading}
      />

      {/* Modal Create Merchant */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer un Nouveau Commerçant"
        subtitle="Renseignez les informations d'identité et de contact"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMerchant} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Nom Complet ou Raison Sociale *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ex: Jean-Baptiste Nshimirimana"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                Numéro de Téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+257 79 000 000"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">
                Adresse Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="commercant@gmail.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Numéro Carte d'Identité / NIF / Registre *
            </label>
            <input
              type="text"
              required
              value={formData.identityCardNumber}
              onChange={(e) => setFormData({ ...formData, identityCardNumber: e.target.value })}
              placeholder="Ex: 110/2024/BUJ"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-2xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-black text-white bg-mint-500 hover:bg-mint-600 rounded-2xl shadow-md transition-colors"
            >
              Enregistrer le commerçant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
