import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbsItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbsItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80">
      <div>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
            <Link to="/dashboard" className="hover:text-emerald-600 flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span>Accueil</span>
            </Link>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                {b.to ? (
                  <Link to={b.to} className="hover:text-emerald-600">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs font-medium text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Header Action Buttons */}
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
