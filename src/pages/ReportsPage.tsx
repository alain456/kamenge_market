import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('YTD'); // Year to Date

  const revData = [
    { month: 'Jan', rev: 42000000 },
    { month: 'Fév', rev: 38000000 },
    { month: 'Mar', rev: 45000000 },
    { month: 'Avr', rev: 41000000 },
    { month: 'Mai', rev: 48000000 },
    { month: 'Jun', rev: 52000000 },
    { month: 'Jul', rev: 50000000 },
    { month: 'Aou', rev: 55000000 },
  ];

  const categoryData = [
    { name: 'Boutiques', value: 65, color: '#8b5cf6' },
    { name: 'Kiosques', value: 20, color: '#06b6d4' },
    { name: 'Stands', value: 15, color: '#3b82f6' },
  ];

  const handleExport = () => {
    alert("Simulation de l'export PDF du rapport financier global.");
  };

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title="Rapports & Statistiques"
        subtitle="Analyses financières et performances globales du Mall Kamenge"
        breadcrumbs={[{ label: 'Rapports' }]}
        actions={
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Rapport Complet</span>
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100 flex items-center gap-3">
         <Filter className="w-4 h-4 text-gray-400" />
         <span className="text-xs font-extrabold text-gray-700">Période d'analyse :</span>
         <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-2xl p-2 text-xs font-semibold focus:outline-none">
            <option value="MTD">Ce Mois</option>
            <option value="QTD">Ce Trimestre</option>
            <option value="YTD">Cette Année (YTD)</option>
            <option value="ALL">Tout l'historique</option>
         </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
         {/* Evolution CA */}
         <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
               <TrendingUp className="w-5 h-5 text-emerald-500" />
               <h3 className="text-sm font-extrabold text-gray-900">Évolution des Revenus (BIF)</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2aa848" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2aa848" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#047857', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="rev" stroke="#2aa848" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Repartition par type */}
         <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
               <BarChart3 className="w-5 h-5 text-purple-500" />
               <h3 className="text-sm font-extrabold text-gray-900">Contribution au CA par Type de Local</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#4b5563' }} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};
