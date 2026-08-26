import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string; // e.g. "bg-amber-500" or "bg-emerald-500"
  periodText?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'positive',
  icon: Icon,
  iconBgColor = 'bg-amber-500',
  periodText = 'Ce mois',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Colorful icon badge circle */}
        <div className={`w-11 h-11 rounded-full ${iconBgColor} text-white flex items-center justify-center shrink-0 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Values and Titles */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">
            {value}
          </div>
          <div className="text-xs font-semibold text-gray-500 truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Bottom pill row matching exact image layout */}
      <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between">
        {change ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              changeType === 'positive'
                ? 'bg-emerald-100 text-emerald-700'
                : changeType === 'negative'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
          </span>
        ) : (
          <span className="text-[11px] text-gray-400 font-medium">Actuel</span>
        )}

        <span className="text-[11px] text-gray-400 font-semibold">{periodText}</span>
      </div>
    </div>
  );
};
