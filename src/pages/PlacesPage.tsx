import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { PlaceStatusLegend } from '../components/domain/PlaceStatusLegend';
import { PlaceGrid } from '../components/domain/PlaceGrid';
import { DataTable, Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { SealModal } from '../components/domain/SealModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatBIF } from '../lib/formatters';
import { mockPlaces, mockZones } from '../data/mock-data';
import { Place, PlaceStatus, PlaceType } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { useToast } from '../components/ui/Toast';
import { LayoutGrid, Table, Search, Filter, Lock, Plus, UserPlus, LogOut, Wrench } from 'lucide-react';

export const PlacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [places, setPlaces] = useState<Place[]>(mockPlaces);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selected place for drawer
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Seal modal state
  const [sealModalOpen, setSealModalOpen] = useState(false);

  // Release confirmation dialog
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  // Filtering places logic
  const filteredPlaces = places.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.currentMerchantName && p.currentMerchantName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesZone = selectedZone === 'ALL' || p.zoneId === selectedZone;
    const matchesType = selectedType === 'ALL' || p.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesSearch && matchesZone && matchesType && matchesStatus;
  });

  const handleReleasePlace = async () => {
    if (!selectedPlace) return;
    try {
      const updated = await MockApiService.updatePlaceStatus(selectedPlace.id, 'LIBRE');
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlace(updated);
      showToast(`L'emplacement ${updated.code} est désormais LIBRE.`);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la libération', 'error');
    }
  };

  const handleSetMaintenance = async () => {
    if (!selectedPlace) return;
    try {
      const newSt: PlaceStatus = selectedPlace.status === 'MAINTENANCE' ? 'LIBRE' : 'MAINTENANCE';
      const updated = await MockApiService.updatePlaceStatus(selectedPlace.id, newSt, 'Passé en maintenance par l’administrateur');
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlace(updated);
      showToast(`Statut de ${updated.code} mis à jour.`);
    } catch (err: any) {
      showToast(err.message || 'Erreur de mise à jour', 'error');
    }
  };

  const handleConfirmSeal = async (notes: string) => {
    if (!selectedPlace) return;
    try {
      await MockApiService.triggerSealProcedure('', selectedPlace.id, notes);
      const updated = await MockApiService.updatePlaceStatus(selectedPlace.id, 'SCELLE', notes);
      setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlace(updated);
      showToast(`Procédure de scellé exécutée pour ${updated.code}.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Erreur de scellé', 'error');
    }
  };

  const tableColumns: Column<Place>[] = [
    { header: 'Code Local', accessor: (r) => <span className="font-extrabold text-gray-900">{r.code}</span> },
    { header: 'Zone', accessor: 'zoneName' },
    { header: 'Type', accessor: 'type' },
    { header: 'Surface', accessor: (r) => `${r.surfaceM2} m²` },
    { header: 'Loyer Mensuel', accessor: (r) => <span className="font-bold">{formatBIF(r.monthlyRent)}</span> },
    { header: 'Locataire Actuel', accessor: (r) => r.currentMerchantName || <span className="text-gray-400 italic">Aucun</span> },
    { header: 'Statut', accessor: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Vue des Emplacements du Mall"
        subtitle="Pilotage visuel et statut en temps réel des boutiques, kiosques et stands"
        breadcrumbs={[{ label: 'Emplacements' }]}
        actions={
          <PermissionGate permission="espaces.create">
            <button
              onClick={() => navigate('/commerce')}
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Attribuer un local</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Status Color Code Legend (Required 5 Statuses) */}
      <PlaceStatusLegend />

      {/* Filter and View Switcher */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher code (ex: MALL-N1-B05) ou locataire..."
            className="w-full bg-gray-50 rounded-2xl py-2 pl-9 pr-4 text-xs font-semibold border border-gray-200 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-gray-50 rounded-2xl py-2 px-3 text-xs font-bold text-gray-700 border border-gray-200"
          >
            <option value="ALL">Toutes les Zones</option>
            {mockZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-gray-50 rounded-2xl py-2 px-3 text-xs font-bold text-gray-700 border border-gray-200"
          >
            <option value="ALL">Tous les Types</option>
            <option value="Boutique">Boutiques</option>
            <option value="Kiosque">Kiosques</option>
            <option value="Stand">Stands</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-50 rounded-2xl py-2 px-3 text-xs font-bold text-gray-700 border border-gray-200"
          >
            <option value="ALL">Tous les Statuts</option>
            <option value="LIBRE">Libres</option>
            <option value="OCCUPE">Occupés (À jour)</option>
            <option value="PREUVE_EN_ATTENTE">Preuves soumises</option>
            <option value="IMPAYE">Impayés</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SCELLE">Scellés</option>
          </select>

          {/* View mode toggle pills */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-white text-mint-600 shadow-xs' : 'text-gray-400'
              }`}
              title="Vue Grille / Plan"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'table' ? 'bg-white text-mint-600 shadow-xs' : 'text-gray-400'
              }`}
              title="Vue Tableau"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Display: Grid or Table */}
      {viewMode === 'grid' ? (
        <PlaceGrid places={filteredPlaces} onSelectPlace={(p) => setSelectedPlace(p)} />
      ) : (
        <DataTable
          columns={tableColumns}
          data={filteredPlaces}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => setSelectedPlace(p)}
        />
      )}

      {/* Place Details Drawer */}
      <Drawer
        isOpen={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
        title={`Détails du local ${selectedPlace?.code}`}
        subtitle={`${selectedPlace?.type} • ${selectedPlace?.zoneName}`}
        width="lg"
      >
        {selectedPlace && (
          <div className="space-y-5">
            {/* Status pill & rent Header */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-gray-400 block uppercase">Statut</span>
                <StatusBadge status={selectedPlace.status} />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-400 block uppercase">Loyer Mensuel</span>
                <span className="text-base font-black text-gray-900">{formatBIF(selectedPlace.monthlyRent)}</span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-400 font-semibold block">Code Emplacement</span>
                <span className="font-bold text-gray-900">{selectedPlace.code}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block">Zone</span>
                <span className="font-bold text-gray-900">{selectedPlace.zoneName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block">Type de Local</span>
                <span className="font-bold text-gray-900">{selectedPlace.type}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block">Surface en m²</span>
                <span className="font-bold text-gray-900">{selectedPlace.surfaceM2} m²</span>
              </div>
            </div>

            {/* Merchant and contract details */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs">
              <h4 className="font-black uppercase tracking-wider text-emerald-900 text-[11px]">
                Informations Locataire & Contrat
              </h4>
              {selectedPlace.currentMerchantName ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-emerald-800 font-semibold">Commerçant:</span>
                    <span className="font-extrabold text-emerald-950">{selectedPlace.currentMerchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-800 font-semibold">Total Dû:</span>
                    <span className="font-black text-rose-600">{formatBIF(selectedPlace.totalDue || 0)}</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 font-medium italic">
                  Aucun commerçant n'est actuellement sous contrat pour cet emplacement.
                </div>
              )}
            </div>

            {selectedPlace.notes && (
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                <span className="font-bold block">Notes Administratives:</span>
                {selectedPlace.notes}
              </div>
            )}

            {/* Actions for Authorized Roles */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                Actions sur l'emplacement
              </h4>

              {selectedPlace.status === 'LIBRE' && hasPermission('espaces.create') && (
                <button
                  onClick={() => {
                    setSelectedPlace(null);
                    navigate('/commerce');
                  }}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Attribuer cet emplacement (Nouveau Bail)</span>
                </button>
              )}

              {selectedPlace.status !== 'LIBRE' && hasPermission('espaces.update') && (
                <button
                  onClick={() => setReleaseDialogOpen(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Libérer l'emplacement (Résilier & Libérer)</span>
                </button>
              )}

              {hasPermission('espaces.delete') && selectedPlace.status !== 'SCELLE' && (
                <button
                  onClick={() => setSealModalOpen(true)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Déclencher la Procédure de Scellé</span>
                </button>
              )}

              {hasPermission('espaces.update') && (
                <button
                  onClick={handleSetMaintenance}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>
                    {selectedPlace.status === 'MAINTENANCE' ? 'Quitter la maintenance' : 'Passer en Maintenance'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation release place dialog */}
      <ConfirmDialog
        isOpen={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
        onConfirm={handleReleasePlace}
        title="Confirmer la libération d'emplacement"
        message="Êtes-vous sûr de vouloir libérer cet emplacement ? Le contrat en cours sera clôturé et le statut deviendra LIBRE."
        confirmLabel="Oui, libérer l'emplacement"
        isDanger={true}
      />

      {/* Seal Modal */}
      <SealModal
        isOpen={sealModalOpen}
        onClose={() => setSealModalOpen(false)}
        place={selectedPlace || undefined}
        onConfirmSeal={handleConfirmSeal}
      />
    </div>
  );
};
