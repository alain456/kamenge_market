import React from 'react';

export const PlaceStatusLegend: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100 mb-5">
      <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2.5">
        Légende des Statuts d’Emplacement (Code Couleurs Officiel)
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-xs font-bold text-emerald-900">Vert : Libre</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-sky-50 border border-sky-200">
          <div className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-xs" />
          <span className="text-xs font-bold text-sky-900">Bleu : Occupé (À jour)</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs" />
          <span className="text-xs font-bold text-amber-900">Jaune : Preuve soumise</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs" />
          <span className="text-xs font-bold text-rose-900">Rouge : Facture Impayée</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-900 text-white border border-gray-800">
          <div className="w-3.5 h-3.5 rounded-full pattern-sealed shadow-xs border border-gray-500" />
          <span className="text-xs font-bold text-white">Noir/Hachuré : Scellé</span>
        </div>
      </div>
    </div>
  );
};
