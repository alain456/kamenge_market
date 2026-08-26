import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { PaymentSlip } from '../../types/domain';
import { formatBIF, formatDate } from '../../lib/formatters';
import { StatusBadge } from '../ui/StatusBadge';
import { CheckCircle2, XCircle, FileText, AlertCircle, Eye, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SlipVerifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slip: PaymentSlip | null;
  onVerify: (
    id: string,
    decision: 'APPROUVE' | 'REJETE',
    comment?: string,
    rejectionReason?: string
  ) => void;
}

export const SlipVerifyDrawer: React.FC<SlipVerifyDrawerProps> = ({
  isOpen,
  onClose,
  slip,
  onVerify,
}) => {
  const { currentUser } = useAuth();
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'decision' | 'preview'>('decision');
  const [errorMsg, setErrorMsg] = useState('');

  if (!slip) return null;

  const isAmountMatching = slip.declaredAmount === slip.expectedAmount;

  const handleApprove = () => {
    onVerify(slip.id, 'APPROUVE', comment);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Un motif de rejet est obligatoire pour refuser un bordereau bancaire.');
      return;
    }
    setErrorMsg('');
    onVerify(slip.id, 'REJETE', comment, rejectionReason);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Bordereau ${slip.slipNumber}`}
      subtitle={`Locataire: ${slip.merchantName} (${slip.placeCode})`}
      width="lg"
    >
      <div className="space-y-5">
        {/* Top Status & Info */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase">Statut Actuel</span>
            <StatusBadge status={slip.status} />
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 block uppercase">Soumis le</span>
            <span className="text-xs font-bold text-gray-800">{formatDate(slip.submissionDate)}</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('decision')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'decision' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Vérification & Montants
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu de la Pièce Jointe</span>
          </button>
        </div>

        {activeTab === 'preview' ? (
          /* File preview tab */
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-gray-900">{slip.fileName}</div>
                  <div className="text-[10px] text-gray-400">{slip.fileSize} • Mode: {slip.method}</div>
                </div>
              </div>
            </div>

            {/* Document Image Preview */}
            <div className="border border-gray-200 rounded-3xl overflow-hidden shadow-sm bg-gray-900">
              <img
                src={slip.filePreviewUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'}
                alt="Bordereau Preview"
                className="w-full h-80 object-cover opacity-95 hover:opacity-100 transition-opacity"
              />
              <div className="p-3 bg-gray-800 text-gray-300 text-[11px] text-center font-mono">
                Aperçu sécurisé du justificatif fourni par le commerçant
              </div>
            </div>
          </div>
        ) : (
          /* Decision & Comparison Tab */
          <div className="space-y-4">
            {/* Amount comparison box */}
            <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                Comparaison Financière
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[11px]">Montant Déclaré</span>
                  <span className="text-sm font-extrabold text-gray-900">{formatBIF(slip.declaredAmount)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[11px]">Montant Attendu</span>
                  <span className="text-sm font-extrabold text-gray-900">{formatBIF(slip.expectedAmount)}</span>
                </div>
              </div>

              {/* Match indicator */}
              <div
                className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold ${
                  isAmountMatching
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isAmountMatching ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Conforme: Le montant déclaré correspond exactement au montant attendu.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Écart détecté: Différence de {formatBIF(Math.abs(slip.declaredAmount - slip.expectedAmount))}.</span>
                  </>
                )}
              </div>
            </div>

            {/* Previous verification history if verified */}
            {slip.verifiedBy && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  Vérifié par <span className="font-bold">{slip.verifiedBy}</span> le {slip.verificationDate}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-100 text-rose-800 rounded-2xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Comment inputs */}
            {slip.status === 'EN_ATTENTE' && (
              <>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Commentaire de Validation (Facultatif) :
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ex: Relevé bancaire IBB vérifié avec succès..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-mint-500/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1 text-rose-700">
                    Motif de Rejet (Obligatoire si rejeté) :
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Ex: Image floue / Montant incomplet / Numéro de référence inexistant..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={handleReject}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeter le Bordereau</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    className="px-5 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider & Approuver</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};
