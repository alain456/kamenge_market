import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF } from '../lib/formatters';
import { MockApiService } from '../services/mock-api';
import { Dispute, ReminderHistoryItem } from '../types/domain';
import { mockReminders, mockPlaces } from '../data/mock-data';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { SealModal } from '../components/domain/SealModal';
import { AlertOctagon, Mail, Phone, Calendar, Lock, Send, Clock, Edit3 } from 'lucide-react';

export const DisputeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { showToast } = useToast();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [reminders, setReminders] = useState<ReminderHistoryItem[]>([]);
  
  // Seal modal state
  const [sealModalOpen, setSealModalOpen] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    if (id) {
      MockApiService.getDisputes().then((data) => {
        const found = data.find(d => d.id === id);
        if (found) {
          setDispute(found);
          setReminders(mockReminders.filter(r => r.disputeId === found.id));
        } else {
          navigate('/disputes');
        }
      });
    }
  }, [id, navigate]);

  if (!dispute) return null;

  const handleSendReminder = () => {
    showToast('Relance envoyée avec succès (Simulé).', 'success');
  };

  const handleAddNote = () => {
    if (!internalNote.trim()) return;
    showToast('Note interne ajoutée au dossier.', 'success');
    setInternalNote('');
  };

  const handleConfirmSeal = async (notes: string) => {
    try {
      await MockApiService.triggerSealProcedure(dispute.id, dispute.placeId, notes);
      setDispute({ ...dispute, status: 'Procédure Scellé' });
      showToast(`Procédure de scellé exécutée pour le dossier de ${dispute.merchantName}.`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title={`Dossier Contentieux: ${dispute.merchantName}`}
        subtitle={`Suivi de recouvrement pour l'emplacement ${dispute.placeCode}`}
        breadcrumbs={[{ label: 'Contentieux', to: '/disputes' }, { label: 'Détail Dossier' }]}
        actions={
          permissions.canTriggerSeal && dispute.status !== 'Procédure Scellé' && (
             <button
              onClick={() => setSealModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Déclencher le Scellé</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Summary & Actions */}
        <div className="lg:col-span-1 space-y-5">
          {/* Financial Summary */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Résumé Financier</h3>
            
            <div className="space-y-4">
               <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 block uppercase mb-1">Total Exigible (Impayés + Pénalités)</span>
                  <span className="text-2xl font-black text-rose-600">
                    {formatBIF(dispute.totalDue)}
                  </span>
               </div>

               <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                     <span className="text-gray-400 font-semibold block mb-1">Loyers de base</span>
                     <span className="font-extrabold text-gray-900">{formatBIF(dispute.baseRentTotal)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                     <span className="text-gray-400 font-semibold block mb-1">Pénalités (5%)</span>
                     <span className="font-extrabold text-gray-900">{formatBIF(dispute.penaltiesTotal)}</span>
                  </div>
               </div>

               <div className="flex justify-between items-center py-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-semibold">Ancienneté de la dette:</span>
                  <span className="font-bold text-gray-900">{dispute.unpaidMonthsCount} mois consécutifs</span>
               </div>
               
               <div className="flex justify-between items-center py-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-semibold">Niveau de risque:</span>
                  <StatusBadge status={dispute.riskLevel} type="risk" />
               </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-3">
               <button onClick={handleSendReminder} className="w-full px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2">
                 <Send className="w-4 h-4" />
                 <span>Envoyer Relance Manuelle (SMS/Email)</span>
               </button>
               <button onClick={() => window.open(`tel:${dispute.merchantPhone}`)} className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2">
                 <Phone className="w-4 h-4" />
                 <span>Appeler le {dispute.merchantPhone}</span>
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-5">
           {/* Timeline */}
           <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
             <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-mint-500" />
                <h3 className="text-sm font-extrabold text-gray-900">Historique des Relances & Événements</h3>
             </div>

             <div className="space-y-6 pl-2">
                {reminders.map((r, index) => (
                  <div key={r.id} className="relative pl-6">
                    {/* Vertical line connecting timeline items */}
                    {index !== reminders.length - 1 && (
                      <div className="absolute left-1.5 top-5 bottom-[-1.5rem] w-0.5 bg-gray-100" />
                    )}
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${r.type === 'Mise en demeure' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                    
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <span className={`text-xs font-extrabold ${r.type === 'Mise en demeure' ? 'text-rose-700' : 'text-gray-900'}`}>{r.type}</span>
                             <div className="text-[10px] text-gray-400 font-medium mt-0.5">Via {r.channel} à {r.destination}</div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{r.sentAt}</span>
                       </div>
                       <div className="text-xs text-gray-600 font-medium bg-white p-2 rounded-xl border border-gray-100 mt-2 italic">
                          "{r.content}"
                       </div>
                       <div className="mt-2 flex justify-end">
                         <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                           Statut: {r.status}
                         </span>
                       </div>
                    </div>
                  </div>
                ))}
                {reminders.length === 0 && (
                   <p className="text-xs text-gray-500 italic">Aucune relance enregistrée pour ce dossier.</p>
                )}
             </div>
           </div>

           {/* Internal Note Input */}
           <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
             <div className="flex items-center gap-2 mb-4">
                <Edit3 className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-extrabold text-gray-900">Ajouter une note interne (Log d'appel / visite)</h3>
             </div>
             
             <textarea 
               value={internalNote}
               onChange={(e) => setInternalNote(e.target.value)}
               rows={3}
               placeholder="Ex: Le locataire est passé ce matin, promet de régler la moitié demain..."
               className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-semibold focus:ring-2 focus:ring-mint-500/30 focus:outline-none mb-3"
             />
             <div className="flex justify-end">
                <button 
                  onClick={handleAddNote}
                  disabled={!internalNote.trim()}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors disabled:opacity-50"
                >
                  Enregistrer la note
                </button>
             </div>
           </div>
        </div>
      </div>

      <SealModal
        isOpen={sealModalOpen}
        onClose={() => setSealModalOpen(false)}
        dispute={dispute}
        onConfirmSeal={handleConfirmSeal}
      />
    </div>
  );
};
