import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { MoneyDisplay } from '../components/ui/MoneyDisplay';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF } from '../lib/formatters';
import { usePermissions } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  FileCheck,
  Store,
  ArrowRight,
  AlertTriangle,
  FileText,
  Calculator,
  CalendarCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { mockPlaces, mockPaymentSlips, mockDisputes } from '../data/mock-data';

// --- ADMIN DASHBOARD (Existing layout) ---
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const chartData = [
    { date: '04 Jan', encaisses: 200, attendus: 300 },
    { date: '08 Jan', encaisses: 400, attendus: 350 },
    { date: '12 Jan', encaisses: 380, attendus: 420 },
    { date: '16 Jan', encaisses: 680, attendus: 500 },
    { date: '20 Jan', encaisses: 520, attendus: 480 },
    { date: '26 Jan', encaisses: 710, attendus: 600 },
    { date: '28 Jan', encaisses: 650, attendus: 580 },
    { date: '30 Jan', encaisses: 300, attendus: 400 },
    { date: '31 Jan', encaisses: 450, attendus: 650 },
  ];

  const pieData = [
    { name: 'Boutiques', value: 35, color: '#8b5cf6' },
    { name: 'Kiosques', value: 25, color: '#06b6d4' },
    { name: 'Stands', value: 25, color: '#3b82f6' },
    { name: 'Maintenance', value: 15, color: '#2aa848' },
  ];

  const priorityUnpaid = [...mockDisputes].sort((a, b) => b.totalDue - a.totalDue);
  const pendingSlips = mockPaymentSlips.filter((s) => s.status === 'EN_ATTENTE');

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="35 Nouveaux Locataires"
            value="35"
            subtitle="Commerçants inscrits"
            change="+120"
            changeType="positive"
            icon={Users}
            iconBgColor="bg-amber-500"
            periodText="Ce mois"
            onClick={() => navigate('/commerce')}
          />
          <StatCard
            title="15 Contrats Résiliés"
            value="15"
            subtitle="Locaux libérés"
            change="-120"
            changeType="negative"
            icon={UserCheck}
            iconBgColor="bg-emerald-500"
            periodText="Ce mois"
            onClick={() => navigate('/commerce')}
          />
          <StatCard
            title="22 Bordereaux Validés"
            value="22"
            subtitle="Preuves bancaires vérifiées"
            change="+120"
            changeType="positive"
            icon={FileCheck}
            iconBgColor="bg-sky-500"
            periodText="Ce mois"
            onClick={() => navigate('/finances')}
          />
          <StatCard
            title="35 Emplacements Occupés"
            value="35"
            subtitle="Taux d’occupation 85%"
            change="+120"
            changeType="positive"
            icon={Store}
            iconBgColor="bg-purple-500"
            periodText="Ce mois"
            onClick={() => navigate('/espaces')}
          />
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold text-gray-900">Répartition des Emplacements</h3>
            <span className="text-gray-400 text-xs font-bold cursor-pointer">•••</span>
          </div>

          <div className="flex items-center justify-between gap-4 my-auto">
            <div className="w-44 h-44 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-extrabold text-gray-800">100%</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Évolution des Encaissements</h3>
              <p className="text-[11px] font-semibold text-gray-400">Jan 2026</p>
            </div>
            <span className="text-gray-400 text-xs font-bold cursor-pointer">•••</span>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEncaisses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2aa848" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2aa848" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-mint-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md">
                          {payload[0].value} Locataires Payés
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="encaisses"
                  stroke="#2aa848"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEncaisses)"
                />
                <Area
                  type="monotone"
                  dataKey="attendus"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">Total Encaissé (Mois)</span>
              <MoneyDisplay amount={32985000} size="xl" className="text-gray-900" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="Locataire" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="Locataire" />
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" alt="Locataire" />
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white">
                  +8
                </div>
              </div>

              <button onClick={() => navigate('/finances')} className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                <span>Voir Tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">Total Impayés & Arriérés</span>
              <MoneyDisplay amount={4494000} size="xl" className="text-rose-600" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                $
              </div>

              <button onClick={() => navigate('/plaintes')} className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                <span>Voir Tout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                Impayés Prioritaires (Trié par montant)
              </h3>
            </div>
            <button onClick={() => navigate('/plaintes')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Voir tous les contentieux
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {priorityUnpaid.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-gray-900">{item.merchantName}</div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    {item.placeCode} • {item.unpaidMonthsCount} mois d'impayés
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-600">{formatBIF(item.totalDue)}</div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                Bordereaux Bancaires en Attente
              </h3>
            </div>
            <button onClick={() => navigate('/finances')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Vérifier tout
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {pendingSlips.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-medium">
                Aucun bordereau en attente de vérification
              </div>
            ) : (
              pendingSlips.map((slip) => (
                <div key={slip.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-gray-900">{slip.slipNumber}</div>
                    <div className="text-[11px] text-gray-400 font-medium">
                      {slip.merchantName} ({slip.placeCode})
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-extrabold text-gray-900">{formatBIF(slip.declaredAmount)}</div>
                      <span className="text-[10px] text-gray-400 font-bold">{slip.method}</span>
                    </div>
                    <button onClick={() => navigate('/finances')} className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-full hover:bg-amber-100">
                      Vérifier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CASHIER DASHBOARD ---
const CashierDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Ma Caisse</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Encaissements du jour" value={formatBIF(850000)} icon={Calculator} iconBgColor="bg-emerald-500" periodText="Aujourd'hui" />
        <StatCard title="Opérations" value="45" icon={FileText} iconBgColor="bg-sky-500" periodText="Aujourd'hui" />
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 min-h-[300px] flex items-center justify-center text-gray-400">
        Historique de caisse et opérations à valider
      </div>
    </div>
  );
};

// --- GENERIC STUB DASHBOARD ---
const StubDashboard: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6">
    <h1 className="text-2xl font-black text-gray-900 mb-4">Tableau de bord : {title}</h1>
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 min-h-[400px] flex items-center justify-center text-gray-400">
      Aperçu spécifique pour le rôle {title} en cours de construction...
    </div>
  </div>
);


export const DashboardPage: React.FC = () => {
  const { currentRole } = usePermissions();

  switch (currentRole?.id) {
    case 'admin':
      return <AdminDashboard />;
    case 'caissier':
      return <CashierDashboard />;
    case 'secretaire':
      return <StubDashboard title="Secrétaire" />;
    case 'comptable':
      return <StubDashboard title="Comptable" />;
    case 'agent_perception':
      return <StubDashboard title="Agent de Perception" />;
    case 'agent_enregistrement':
      return <StubDashboard title="Agent d'enregistrement" />;
    default:
      return <AdminDashboard />;
  }
};
