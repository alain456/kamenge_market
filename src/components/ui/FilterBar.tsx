import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filterGroups = [],
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 bg-white rounded-3xl p-4 shadow-xs border border-gray-100/80">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-gray-50 rounded-2xl py-2 pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder-gray-400 border border-gray-200/60 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Filter Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {filterGroups.map((fg) => (
          <div key={fg.id} className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
            <select
              value={fg.selectedValue}
              onChange={(e) => fg.onChange(e.target.value)}
              className="bg-gray-50 rounded-2xl py-2 pl-8 pr-7 text-xs font-bold text-gray-700 border border-gray-200/60 focus:outline-none focus:ring-2 focus:ring-mint-500/30 appearance-none cursor-pointer"
            >
              {fg.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
