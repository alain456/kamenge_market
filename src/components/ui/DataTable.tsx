import React from 'react';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100 space-y-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-10 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-gray-100">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-gray-800">{emptyMessage}</h4>
        <p className="text-xs text-gray-400 mt-1">Essayez de modifier vos filtres ou d'effectuer une nouvelle recherche.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold uppercase text-gray-500 tracking-wider">
              {columns.map((col, i) => (
                <th key={i} className={`py-3.5 px-4 font-extrabold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/70 text-xs font-semibold text-gray-700">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'hover:bg-emerald-50/50 cursor-pointer' : 'hover:bg-gray-50/50'
                }`}
              >
                {columns.map((col, i) => (
                  <td key={i} className={`py-3.5 px-4 align-middle ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as unknown as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
