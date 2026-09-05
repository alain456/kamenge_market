import React, { useState, useEffect } from 'react';
import { PermissionGate } from '../components/auth/PermissionGate';
import { ApiService } from '../services/api';
import { FileText, Download, Upload, Eye, Trash2, Search, File, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: 'contrat' | 'facture' | 'rapport' | 'administratif' | 'autre';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  isConfidential: boolean;
}

const catColors: Record<string, string> = {
  contrat: 'bg-mint-100 text-mint-700',
  facture: 'bg-amber-100 text-amber-700',
  rapport: 'bg-purple-100 text-purple-700',
  administratif: 'bg-sky-100 text-sky-700',
  autre: 'bg-gray-100 text-gray-600',
};

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ApiService.getContracts(),
      ApiService.getPaymentSlips(),
      ApiService.getDisbursements(),
    ])
      .then(([contracts, slips, disbursements]) => {
        const docs: Document[] = [
          ...contracts.map((c) => ({
            id: `contract-${c.id}`,
            name: `Contrat ${c.code}`,
            category: 'contrat' as const,
            size: '—',
            uploadedBy: c.merchantName || 'Système',
            uploadedAt: c.startDate,
            isConfidential: false,
          })),
          ...slips.map((s) => ({
            id: `slip-${s.id}`,
            name: `Bordereau ${s.slipNumber}`,
            category: 'facture' as const,
            size: s.fileSize || '—',
            uploadedBy: s.merchantName || 'Commerçant',
            uploadedAt: s.submissionDate,
            isConfidential: false,
          })),
          ...disbursements.map((d) => ({
            id: `disb-${d.id}`,
            name: `Décaissement ${d.requestNumber}`,
            category: 'administratif' as const,
            size: '—',
            uploadedBy: d.applicantName || 'Agent',
            uploadedAt: d.createdAt,
            isConfidential: true,
          })),
        ];
        setDocuments(docs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)));
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter((d) =>
    (selectedCat === 'ALL' || d.category === selectedCat) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['ALL', 'contrat', 'facture', 'rapport', 'administratif'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Chargement des documents...</span>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Gestion des Documents</h1>
          <p className="text-xs font-medium text-gray-500">{documents.length} documents issus des contrats, bordereaux et décaissements</p>
        </div>
        <PermissionGate permission="documents.create">
          <button
            disabled
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-300 text-white font-bold rounded-2xl text-xs shadow-sm cursor-not-allowed"
            title="Téléversement à venir"
          >
            <Upload className="w-4 h-4" />
            Téléverser un document
          </button>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${selectedCat === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat === 'ALL' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un document..."
          className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40" />
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 font-medium text-sm border border-gray-100">
          Aucun document trouvé.
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <File className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{doc.uploadedBy} • {doc.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${catColors[doc.category]}`}>{doc.category}</span>
                  {doc.isConfidential && <span className="text-[10px] font-bold text-rose-600">Confidentiel</span>}
                  <button className="p-1.5 text-gray-400 hover:text-gray-700" title="Voir"><Eye className="w-4 h-4" /></button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-700" title="Télécharger"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
