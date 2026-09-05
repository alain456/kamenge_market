import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../context/AuthContext';
import { ApiService, MyTasksResponse } from '../../services/api';
import { StatCard } from '../ui/StatCard';
import {
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Clock,
  Loader2,
  ListTodo,
} from 'lucide-react';

const priorityStyles: Record<string, string> = {
  high: 'border-rose-200 bg-rose-50/50',
  medium: 'border-amber-200 bg-amber-50/50',
  low: 'border-gray-200 bg-gray-50/50',
};

const priorityBadge: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

interface RoleDashboardProps {
  fallbackTitle?: string;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ fallbackTitle }) => {
  const navigate = useNavigate();
  const { currentUser, currentRole } = usePermissions();
  const [data, setData] = useState<MyTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getMyTasks()
      .then(setData)
      .catch(() => setError('Impossible de charger vos tâches.'))
      .finally(() => setLoading(false));
  }, []);

  const roleName = data?.roleName || currentRole?.name || fallbackTitle || 'Personnel';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Chargement de votre tableau de bord...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-rose-800">{error}</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const tasks = data?.tasks || [];

  const statCards = [
    { label: 'Bordereaux en attente', value: stats.pendingSlips ?? 0, color: 'bg-amber-500' },
    { label: 'Contentieux ouverts', value: stats.openDisputes ?? 0, color: 'bg-rose-500' },
    { label: 'Locaux libres', value: stats.librePlaces ?? 0, color: 'bg-emerald-500' },
    { label: 'Commerçants endettés', value: stats.merchantsWithDebt ?? 0, color: 'bg-purple-500' },
  ].filter((s) => s.value > 0 || tasks.length === 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          Bonjour, {currentUser?.fullName.split(' ')[0]}
        </h1>
        <p className="text-xs font-medium text-gray-500">
          {roleName}
          {data?.assignedArea ? ` • ${data.assignedArea}` : ''}
          {' '}— {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} à traiter
        </p>
      </div>

      {statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.slice(0, 4).map((s) => (
            <StatCard
              key={s.label}
              title={s.label}
              value={String(s.value)}
              icon={ListTodo}
              iconBgColor={s.color}
              periodText="Temps réel"
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-mint-600" />
            <h2 className="text-sm font-extrabold text-gray-900">Mes tâches du jour</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Priorité haute en premier
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Aucune tâche en attente</p>
            <p className="text-xs text-gray-400 mt-1">Tout est à jour pour votre rôle.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...tasks]
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
              })
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(task.link)}
                  className={`w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors border-l-4 ${priorityStyles[task.priority] || priorityStyles.medium}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${priorityBadge[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.meta && (
                        <span className="text-[10px] font-bold text-gray-500">{task.meta}</span>
                      )}
                    </div>
                    <p className="text-sm font-black text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 font-medium truncate">{task.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
          </div>
        )}
      </div>

      {tasks.some((t) => t.priority === 'high') && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">
            {tasks.filter((t) => t.priority === 'high').length} tâche(s) urgente(s) nécessitent votre attention.
          </span>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Dernière mise à jour à la connexion</span>
        </div>
      )}
    </div>
  );
};
