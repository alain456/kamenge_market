import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { PermissionGate } from '../components/auth/PermissionGate';
import { FileText, Download, Upload, Eye, Trash2, Search, Filter, File, FilePlus } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: 'contrat' | 'facture' | 'rapport' | 'administratif' | 'autre';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  isConfidential: boolean;
}

const mockDocuments: Document[] = [
  { id: 'd-1', name: 'Contrat_Bail_MALL-N1-A01_2026.pdf', category: 'contrat', size: '245 Ko', uploadedBy: 'Jean Hakizimana', uploadedAt: '2026-08-15', isConfidential: false },
  { id: 'd-2', name: 'Rapport_Financier_Août_2026.xlsx', category: 'rapport', size: '1.2 Mo', uploadedBy: 'Diane Irakoze', uploadedAt: '2026-09-01', isConfidential: true },
  { id: 'd-3', name: 'Facture_Prestataire_Nettoyage.pdf', category: 'facture', size: '88 Ko', uploadedBy: 'Alice Ndayizeye', uploadedAt: '2026-08-28', isConfidential: false },
  { id: 'd-4', name: 'PV_Reunion_Direction_Aout.docx', category: 'administratif', size: '120 Ko', uploadedBy: 'Alice Ndayizeye', uploadedAt: '2026-08-30', isConfidential: true },
  { id: 'd-5', name: 'Liste_Commerçants_Actifs.xlsx', category: 'administratif', size: '320 Ko', uploadedBy: 'Jean Hakizimana', uploadedAt: '2026-08-20', isConfidential: false },
  { id: 'd-6', name: 'Règlement_Intérieur_Marché.pdf', category: 'administratif', size: '560 Ko', uploadedBy: 'Alice Ndayizeye', uploadedAt: '2026-07-01', isConfidential: false },
];

const catColors: Record<string, string> = {
  contrat: 'bg-mint-100 text-mint-700',
  facture: 'bg-amber-100 text-amber-700',
  rapport: 'bg-purple-100 text-purple-700',
  administratif: 'bg-sky-100 text-sky-700',
  autre: 'bg-gray-100 text-gray-600',
};

export const DocumentsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast('Document supprimé');
  };

  const filtered = documents.filter(d =>
    (selectedCat === 'ALL' || d.category === selectedCat) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['ALL', 'contrat', 'facture', 'rapport', 'administratif'];

  return (
    <div className="p-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50">
          <FileText className="w-4 h-4 text-mint-400" /><span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Gestion des Documents</h1>
          <p className="text-xs font-medium text-gray-500">{documents.length} documents archivés</p>
        </div>
        <PermissionGate permission="documents.create">
          <button onClick={() => showToast('Téléversement de document (simulation)')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs shadow-sm">
            <Upload className="w-4 h-4" />
            Téléverser un document
          </button>
        </PermissionGate>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${selectedCat === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat === 'ALL' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un document..."
          className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/60 transition-colors">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{doc.name}</p>
                  {doc.isConfidential && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">Confidentiel</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColors[doc.category]}`}>
                    {doc.category}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{doc.size} • {doc.uploadedAt} • par {doc.uploadedBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => showToast(`Ouverture de "${doc.name}" (simulation)`)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" title="Voir">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => showToast(`Téléchargement de "${doc.name}" (simulation)`)}
                  className="p-2 text-gray-400 hover:text-mint-600 hover:bg-mint-50 rounded-xl transition-colors" title="Télécharger">
                  <Download className="w-4 h-4" />
                </button>
                <PermissionGate permission="documents.delete">
                  <button onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium text-sm flex flex-col items-center gap-2">
              <FilePlus className="w-8 h-8 text-gray-200" />
              Aucun document trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
