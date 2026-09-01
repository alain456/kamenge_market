import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { formatBIF } from '../lib/formatters';
import { Merchant, Place } from '../types/domain';
import { MockApiService } from '../services/mock-api';
import { usePermissions } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { FileText, ChevronRight, CheckCircle2, AlertOctagon } from 'lucide-react';

export const NewContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [freePlaces, setFreePlaces] = useState<Place[]>([]);

  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [depositMonths, setDepositMonths] = useState(3);
  const [subleaseAgreed, setSubleaseAgreed] = useState(false);

  useEffect(() => {
    if (!hasPermission('commerce.create')) {
      showToast('Action non autorisée', 'error');
      navigate('/contracts');
      return;
    }
    MockApiService.getMerchants().then(m => setMerchants(m.filter(x => x.status === 'ACTIF')));
    MockApiService.getPlaces().then(p => setFreePlaces(p.filter(x => x.status === 'LIBRE')));
  }, [permissions, navigate, showToast]);

  const selectedPlace = freePlaces.find((p) => p.id === selectedPlaceId);
  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);
  const depositAmount = selectedPlace ? selectedPlace.monthlyRent * depositMonths : 0;

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace || !selectedMerchant || !subleaseAgreed) return;

    try {
      await MockApiService.createContract({
        merchantId: selectedMerchant.id,
        merchantName: selectedMerchant.fullName,
        placeId: selectedPlace.id,
        placeCode: selectedPlace.code,
        startDate,
        endDate,
        monthlyRent: selectedPlace.monthlyRent,
        depositMonths,
        depositAmount,
        periodicity: 'Mensuel',
        status: 'ACTIF',
        subleaseAllowed: false,
      });
      showToast(`Le contrat de location pour ${selectedPlace.code} a été créé.`);
      navigate('/contracts');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Nouveau Contrat de Location"
        subtitle="Attribution d'un emplacement libre et génération du bail"
        breadcrumbs={[{ label: 'Contrats', to: '/contracts' }, { label: 'Nouveau Bail' }]}
      />

      <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100 max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= s ? 'bg-mint-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full ${
                    step > s ? 'bg-mint-500' : 'bg-gray-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-extrabold text-gray-900">1. Sélection du Locataire</h3>
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-2">
                  Commerçant (Doit être inscrit et Actif)
                </label>
                <select
                  required
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                >
                  <option value="">-- Choisir un commerçant --</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (CNI: {m.identityCardNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedMerchantId}
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-2xl disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-extrabold text-gray-900">2. Sélection de l'Emplacement</h3>
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
                Seuls les emplacements ayant le statut <span className="font-bold uppercase">Libre</span> sont disponibles pour une nouvelle attribution.
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-2">
                  Emplacement Libre
                </label>
                <select
                  required
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
                >
                  <option value="">-- Choisir un local --</option>
                  {freePlaces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.type} ({p.surfaceM2}m²) - Loyer: {formatBIF(p.monthlyRent)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-2xl hover:bg-gray-200"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!selectedPlaceId}
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-2xl disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-extrabold text-gray-900">3. Paramètres du Bail & Validation</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">Date de début</label>
                  <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">Date de fin</label>
                  <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">Nombre de mois de caution</label>
                <select value={depositMonths} onChange={e => setDepositMonths(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mint-500/40">
                  <option value={1}>1 Mois</option>
                  <option value={2}>2 Mois</option>
                  <option value={3}>3 Mois (Standard)</option>
                  <option value={6}>6 Mois</option>
                </select>
              </div>

              {/* Deposit Auto-Calculation Box */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                 <div>
                    <span className="text-[11px] font-bold text-emerald-700 block uppercase">Calcul automatique de la caution</span>
                    <span className="text-xs text-emerald-900 font-medium">{depositMonths} mois × {formatBIF(selectedPlace?.monthlyRent || 0)}</span>
                 </div>
                 <div className="text-lg font-black text-emerald-900">
                    {formatBIF(depositAmount)}
                 </div>
              </div>

              {/* Anti-Sublease Clause */}
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2">
                 <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs uppercase">
                    <AlertOctagon className="w-4 h-4" />
                    Clause Anti-Sous-Location
                 </div>
                 <p className="text-[11px] text-rose-900 font-medium">
                   L'autorisation de sous-location est strictement interdite par défaut. Toute violation entraîne la résiliation immédiate du contrat.
                 </p>
                 <label className="flex items-start gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" required checked={subleaseAgreed} onChange={e => setSubleaseAgreed(e.target.checked)} className="mt-0.5 rounded text-rose-600 focus:ring-rose-500" />
                    <span className="text-xs font-bold text-rose-900">Le locataire a pris connaissance et accepte l'interdiction de sous-louer le local.</span>
                 </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-2xl hover:bg-gray-200"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={!startDate || !endDate || !subleaseAgreed}
                  className="px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white text-xs font-black rounded-2xl shadow-md transition-colors"
                >
                  Confirmer et Créer le Contrat
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
