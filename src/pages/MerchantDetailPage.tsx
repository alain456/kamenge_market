import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF } from '../lib/formatters';
import { ApiService } from '../services/api';
import { Merchant, Contract, Payment, PaymentSlip, ReminderHistoryItem } from '../types/domain';
import { User, Mail, Phone, MapPin, Calendar, FileText, CreditCard, Bell, Activity } from 'lucide-react';

export const MerchantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [mContracts, setMContracts] = useState<Contract[]>([]);
  const [mPayments, setMPayments] = useState<Payment[]>([]);
  const [mSlips, setMSlips] = useState<PaymentSlip[]>([]);
  const [mReminders, setMReminders] = useState<ReminderHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'contracts' | 'payments' | 'slips' | 'notifications' | 'activity'>('info');

  useEffect(() => {
    if (id) {
      ApiService.getMerchantById(id).then((data) => {
        if (data) setMerchant(data);
        else navigate('/commerce');
      }).catch(() => navigate('/commerce'));
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      ApiService.getMerchantContracts(id).then(setMContracts).catch(() => setMContracts([]));
      ApiService.getPayments().then((all) => setMPayments(all.filter((p) => p.merchantId === id))).catch(() => setMPayments([]));
      ApiService.getPaymentSlips().then((all) => setMSlips(all.filter((s) => s.merchantId === id))).catch(() => setMSlips([]));
      ApiService.getDisputes().then((all) => {
        const reminders = all
          .filter((d) => d.merchantId === id)
          .flatMap((d) => d.reminders || []);
        setMReminders(reminders);
      }).catch(() => setMReminders([]));
    }
  }, [id]);

  if (!merchant) return null;

  const tabs = [
    { id: 'info', label: 'Infos Personnelles', icon: User },
    { id: 'contracts', label: 'Contrats & Locaux', icon: FileText },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'slips', label: 'Bordereaux', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Journal', icon: Activity },
  ] as const;

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title={merchant.fullName}
        subtitle={`Dossier locataire • CNI: ${merchant.identityCardNumber}`}
        breadcrumbs={[{ label: 'Commerçants', to: '/commerce' }, { label: merchant.fullName }]}
      />

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0">
          {merchant.fullName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-extrabold text-gray-900">{merchant.fullName}</h2>
            <StatusBadge status={merchant.status} />
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{merchant.phone}</div>
            <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{merchant.email}</div>
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{merchant.assignedPlaceCode || 'Aucun local'}</div>
            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Inscrit le {merchant.registeredAt}</div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center min-w-[150px]">
          <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Total Arriérés</span>
          <span className={`text-lg font-black ${merchant.amountDue > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
            {formatBIF(merchant.amountDue)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-mint-500 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 min-h-[300px]">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Informations Détaillées</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="text-gray-400 font-semibold">Nom / Raison Sociale</div>
                <div className="font-extrabold text-gray-900">{merchant.fullName}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="text-gray-400 font-semibold">Téléphone</div>
                <div className="font-extrabold text-gray-900">{merchant.phone}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="text-gray-400 font-semibold">Email</div>
                <div className="font-extrabold text-gray-900">{merchant.email}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="text-gray-400 font-semibold">N° CNI / NIF</div>
                <div className="font-extrabold text-gray-900">{merchant.identityCardNumber}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Contrats et Emplacements</h3>
            {mContracts.length === 0 ? <p className="text-xs text-gray-500">Aucun contrat trouvé.</p> : (
              <div className="divide-y divide-gray-100 text-xs">
                {mContracts.map(c => (
                  <div key={c.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-gray-900">{c.code}</div>
                      <div className="text-gray-500">Local: {c.placeCode} • Loyer: {formatBIF(c.monthlyRent)}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
             <h3 className="text-sm font-extrabold text-gray-900 mb-4">Historique des Paiements</h3>
            {mPayments.length === 0 ? <p className="text-xs text-gray-500">Aucun paiement trouvé.</p> : (
              <div className="divide-y divide-gray-100 text-xs">
                {mPayments.map(p => (
                  <div key={p.id} className="py-3 flex justify-between items-center">
                     <div>
                      <div className="font-extrabold text-gray-900">{p.date} • {formatBIF(p.amount)}</div>
                      <div className="text-gray-500">Ref: {p.reference} ({p.method})</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'slips' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4">Bordereaux Soumis</h3>
            {mSlips.length === 0 ? <p className="text-xs text-gray-500">Aucun bordereau trouvé.</p> : (
              <div className="divide-y divide-gray-100 text-xs">
                {mSlips.map(s => (
                  <div key={s.id} className="py-3 flex justify-between items-center">
                     <div>
                      <div className="font-extrabold text-gray-900">{s.slipNumber}</div>
                      <div className="text-gray-500">Déclaré: {formatBIF(s.declaredAmount)} • {s.submissionDate}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="space-y-4">
             <h3 className="text-sm font-extrabold text-gray-900 mb-4">Historique des Notifications & Relances</h3>
             <div className="divide-y divide-gray-100 text-xs">
                {mReminders.map(r => (
                  <div key={r.id} className="py-3 space-y-1">
                     <div className="flex justify-between items-center">
                        <span className="font-extrabold text-gray-900">{r.type}</span>
                        <span className="text-gray-400">{r.sentAt}</span>
                     </div>
                     <div className="text-gray-500">Canal: {r.channel} • Dest: {r.destination}</div>
                     <div className="bg-gray-50 p-2 rounded-lg text-gray-700 italic border border-gray-100">"{r.content}"</div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="text-xs text-gray-500 italic">Journal d'activité complet simulé (voir Journal d'Audit global).</div>
        )}
      </div>
    </div>
  );
};
