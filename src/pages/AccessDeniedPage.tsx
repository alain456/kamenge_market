import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Accès Refusé</h1>
      <p className="text-sm font-medium text-gray-500 text-center max-w-md mb-8">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page ou effectuer cette action. 
        Veuillez contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au Tableau de bord</span>
      </button>
    </div>
  );
};
