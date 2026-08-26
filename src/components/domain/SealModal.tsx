import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Place, Dispute } from '../../types/domain';
import { formatBIF } from '../../lib/formatters';
import { AlertOctagon, Lock, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute?: Dispute;
  place?: Place;
  onConfirmSeal: (notes: string) => void;
}

export const SealModal: React.FC<SealModalProps> = ({
  isOpen,
  onClose,
  dispute,
  place,
  onConfirmSeal,
}) => {
  const { permissions } = useAuth();
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const placeCode = place?.code || dispute?.placeCode || 'MALL-N1-A06';
  const merchantName = place?.currentMerchantName || dispute?.merchantName || 'Elias Ndayishimiye';
  const totalDue = place?.totalDue || dispute?.totalDue || 2100000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    onConfirmSeal(adminNotes);
    setIsSuccess(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsSuccess(false);
        onClose();
      }}
      title="Procédure Critique de Scellé d'Emplacement"
      subtitle="Fermeture administrative et verrouillage pour impayés répétitions"
      maxWidth="xl"
    >
      {!permissions.canTriggerSeal ? (
        <div className="p-6 bg-rose-50 text-rose-800 rounded-3xl border border-rose-200 text-center">
          <AlertOctagon className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h4 className="font-extrabold text-sm">Action non autorisée pour votre rôle</h4>
          <p className="text-xs mt-1">
            Seuls les rôles **Administrateur** et **Direction Générale** ont la permission de déclencher la procédure administrative de scellé.
          </p>
        </div>
      ) : isSuccess ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">
            Emplacement Scellé avec Succès
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
            Le statut du local **{placeCode}** a été passé en **SCELLE**. Le compte du locataire **{merchantName}** est verrouillé.
          </p>

          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-2xl border border-gray-200 cursor-not-allowed"
            title="La génération dynamique du fichier PDF officiel sera assurée par l'API Backend"
          >
            <FileText className="w-4 h-4" />
            <span>Télécharger l’Ordre de Mission (Fourni par le Backend)</span>
          </button>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-2xl hover:bg-gray-800"
            >
              Fermer la modale
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning banner */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-start gap-3 text-rose-900">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-extrabold block text-sm">AVERTISSEMENT SCELLÉ LÉGAL</span>
              Vous êtes sur le point de déclencher la procédure administrative de fermeture et scellé de l’emplacement commercial.
            </div>
          </div>

          {/* Details table */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Emplacement concerné:</span>
              <span className="font-extrabold text-gray-900">{placeCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Commerçant locataire:</span>
              <span className="font-extrabold text-gray-900">{merchantName}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-rose-700 font-bold">Total arriérés & pénalités:</span>
              <span className="font-black text-rose-700 text-sm">{formatBIF(totalDue)}</span>
            </div>
          </div>

          {/* Consequence reminders */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <h5 className="font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Conséquences de l’action :
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-800">
              <li>Le statut visuel de l’emplacement devient **SCELLE** (Noir/Hachuré).</li>
              <li>L’accès au portail et à l'application mobile marchand sera totalement bloqué.</li>
              <li>Un ordre de mission officiel d’intervention des agents sera enregistré dans le journal d’audit.</li>
            </ul>
          </div>

          {/* Administrative notes */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1">
              Motif & Note administrative obligatoire :
            </label>
            <textarea
              required
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Saisissez la référence du rapport d'huissier ou le motif officiel de la décision..."
              className="w-full bg-white border border-gray-300 rounded-2xl p-3 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="confirm-seal-check"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded-md border-gray-300 focus:ring-rose-500"
            />
            <label htmlFor="confirm-seal-check" className="text-xs font-bold text-gray-800 cursor-pointer">
              Je confirme avoir vérifié le dossier et autorise le scellé immédiat de l'emplacement.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-2xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!confirmed || !adminNotes.trim()}
              className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Exécuter la Procédure de Scellé</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
