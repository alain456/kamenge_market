import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { MoneyDisplay } from '../components/ui/MoneyDisplay';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBIF } from '../lib/formatters';
import { usePermissions } from '../context/AuthContext';
import { ApiService, DashboardStats, RevenueReport } from '../services/api';
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
import { RoleDashboard } from '../components/dashboard/RoleDashboard';

// --- ADMIN DASHBOARD ---
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      ApiService.getDashboardStats(),
      ApiService.getRevenueReport(new Date().getFullYear()),
    ])
      .then(([dashboardStats, revenueReport]) => {
        setStats(dashboardStats);
        setRevenue(revenueReport);
        setError(null);
      })
      .catch(() => setError('Impossible de charger les statistiques du tableau de bord.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 font-medium">
        Chargement du tableau de bord...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-rose-800">{error || 'Données indisponibles'}</p>
        </div>
      </div>
    );
  }

  const chartData = revenue?.monthlyRevenue.map((m) => ({
    date: m.month,
    encaisses: m.revenue,
    attendus: Math.round(m.revenue * 1.1),
  })) || [];

  const typeColors: Record<string, string> = {
    Boutique: '#8b5cf6',
    Kiosque: '#06b6d4',
    Stand: '#3b82f6',
    Maintenance: '#2aa848',
  };
  const pieData = revenue?.revenueByPlaceType.map((t) => ({
    name: t.type,
    value: t.revenue || 1,
    color: typeColors[t.type] || '#94a3b8',
  })) || [];

  const priorityUnpaid = stats.priorityUnpaid.map((item) => ({
    id: String(item.id),
    merchantName: item.fullName,
    placeCode: item.placeCode || '—',
    unpaidMonthsCount: item.unpaidMonthsCount || 0,
    totalDue: item.amountDue,
    status: item.status,
  }));

  const pendingSlips = stats.pendingSlips.map((slip) => ({
    id: String(slip.id),
    slipNumber: slip.slipNumber,
    merchantName: slip.merchantFullName,
    placeCode: slip.placeCode,
    declaredAmount: slip.declaredAmount,
    method: slip.method || 'Virement',
    status: 'EN_ATTENTE',
  }));

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title={`${stats.merchants?.active ?? 0} Commerçants Actifs`}
            value={String(stats.merchants?.active ?? 0)}
            subtitle={`${stats.merchants?.total ?? 0} commerçants enregistrés`}
            change={`${stats.openDisputesCount} litiges`}
            changeType="positive"
            icon={Users}
            iconBgColor="bg-amber-500"
            periodText="Temps réel"
            onClick={() => navigate('/commerce')}
          />
          <StatCard
            title={`${stats.places.libre} Locaux Libres`}
            value={String(stats.places.libre)}
            subtitle={`${stats.contracts?.terminated ?? 0} contrats résiliés`}
            change={`${stats.places.total} emplacements`}
            changeType="negative"
            icon={UserCheck}
            iconBgColor="bg-emerald-500"
            periodText="Temps réel"
            onClick={() => navigate('/espaces')}
          />
          <StatCard
            title={`${stats.pendingSlipsCount} Bordereaux en Attente`}
            value={String(stats.pendingSlipsCount)}
            subtitle={`${stats.approvedSlipsCount ?? 0} bordereaux validés`}
            change={`${stats.financials.monthlyRevenueBif > 0 ? 'Encaissements actifs' : 'Aucun encaissement'}`}
            changeType="positive"
            icon={FileCheck}
            iconBgColor="bg-sky-500"
            periodText="Ce mois"
            onClick={() => navigate('/finances')}
          />
          <StatCard
            title={`${stats.places.occupied} Emplacements Occupés`}
            value={String(stats.places.occupied)}
            subtitle={`Taux d'occupation ${stats.places.occupancyRatePercent}%`}
            change={`${stats.places.total} total`}
            changeType="positive"
            icon={Store}
            iconBgColor="bg-purple-500"
            periodText="Temps réel"
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
              <p className="text-[11px] font-semibold text-gray-400">{revenue?.year || new Date().getFullYear()}</p>
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
                          {formatBIF(Number(payload[0].value))}
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
              <MoneyDisplay amount={stats.financials.monthlyRevenueBif} size="xl" className="text-gray-900" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500">
                {stats.staff?.total ?? 0} agents • {stats.openDisputesCount} litiges ouverts
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
              <MoneyDisplay amount={stats.financials.totalArrearsBif} size="xl" className="text-rose-600" />
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

// --- ROLE DASHBOARDS (non-admin) ---

export const DashboardPage: React.FC = () => {
  const { effectiveRoleId } = usePermissions();

  if (effectiveRoleId === 'admin') {
    return <AdminDashboard />;
  }

  if (effectiveRoleId) {
    return <RoleDashboard />;
  }

  return (
    <div className="flex items-center justify-center py-24 text-gray-400 font-medium">
      Chargement du profil...
    </div>
  );
};
