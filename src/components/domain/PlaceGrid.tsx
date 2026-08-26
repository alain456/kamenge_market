import React from 'react';
import { Place } from '../../types/domain';
import { StatusBadge } from '../ui/StatusBadge';
import { formatBIF } from '../../lib/formatters';
import { Store, User, Square } from 'lucide-react';

interface PlaceGridProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
}

export const PlaceGrid: React.FC<PlaceGridProps> = ({ places, onSelectPlace }) => {
  const getCardBorder = (status: Place['status']) => {
    switch (status) {
      case 'LIBRE': return 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20';
      case 'OCCUPE': return 'border-sky-300 hover:border-sky-500 bg-sky-50/20';
      case 'PREUVE_EN_ATTENTE': return 'border-amber-300 hover:border-amber-500 bg-amber-50/20';
      case 'IMPAYE': return 'border-rose-300 hover:border-rose-500 bg-rose-50/20';
      case 'MAINTENANCE': return 'border-purple-300 hover:border-purple-500 bg-purple-50/20';
      case 'SCELLE': return 'border-gray-800 pattern-sealed text-white';
      default: return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {places.map((place) => {
        const isSealed = place.status === 'SCELLE';

        return (
          <div
            key={place.id}
            onClick={() => onSelectPlace(place)}
            className={`rounded-3xl p-4 border shadow-xs transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${getCardBorder(
              place.status
            )}`}
          >
            {/* Header: Code & Type */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSealed ? 'bg-rose-900 text-white' : 'bg-white text-gray-800 shadow-xs'
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-black tracking-tight ${isSealed ? 'text-white' : 'text-gray-900'}`}>
                    {place.code}
                  </h4>
                  <span className={`text-[10px] font-semibold ${isSealed ? 'text-gray-300' : 'text-gray-500'}`}>
                    {place.type} • {place.surfaceM2} m²
                  </span>
                </div>
              </div>
            </div>

            {/* Merchant info if occupied */}
            <div className="my-2.5">
              {place.currentMerchantName ? (
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <User className={`w-3.5 h-3.5 ${isSealed ? 'text-rose-400' : 'text-gray-400'}`} />
                  <span className={`truncate ${isSealed ? 'text-white' : 'text-gray-800'}`}>
                    {place.currentMerchantName}
                  </span>
                </div>
              ) : (
                <div className={`text-xs font-medium italic ${isSealed ? 'text-gray-400' : 'text-gray-400'}`}>
                  Aucun locataire
                </div>
              )}
            </div>

            {/* Rent & Status Badge */}
            <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between">
              <span className={`text-xs font-extrabold ${isSealed ? 'text-emerald-300' : 'text-gray-900'}`}>
                {formatBIF(place.monthlyRent)}
              </span>

              <StatusBadge status={place.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
