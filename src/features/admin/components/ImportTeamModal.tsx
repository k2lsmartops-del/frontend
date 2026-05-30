import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  RiCloseLine,
  RiDownloadLine,
  RiUploadCloud2Line,
  RiLoader4Line,
  RiCheckLine,
  RiErrorWarningLine,
  RiFileExcel2Line,
} from 'react-icons/ri';
import api from '@/common/services/api';

interface ParsedRow {
  role: string;
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  zone?: string;
  secteur?: string;
  supervisorPhone?: string;
}

interface ImportResultRow {
  row: number;
  status: 'created' | 'error';
  role?: string;
  fullName?: string;
  matricule?: string;
  message?: string;
}

interface ImportReport {
  total: number;
  created: number;
  failed: number;
  results: ImportResultRow[];
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const COLUMNS = [
  'role',
  'fullName',
  'phone',
  'email',
  'password',
  'zone',
  'secteur',
  'supervisorPhone',
];

export default function ImportTeamModal({ onClose, onSuccess }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Génère et télécharge un modèle Excel avec exemples et instructions. */
  const downloadTemplate = () => {
    const example: ParsedRow[] = [
      { role: 'COORDINATEUR', fullName: 'Jean Koffi', phone: '0700000001', email: 'jean.koffi@k2l.ci', password: 'Passw0rd1', zone: 'Zone Nord', secteur: '', supervisorPhone: '' },
      { role: 'SUPERVISEUR', fullName: 'Awa Traore', phone: '0700000002', email: '', password: 'Passw0rd2', zone: 'Zone Nord', secteur: 'Secteur Nord-1', supervisorPhone: '' },
      { role: 'COMMERCIAL', fullName: 'Yao Brou', phone: '0700000003', email: '', password: 'Passw0rd3', zone: '', secteur: '', supervisorPhone: '0700000002' },
    ];

    const ws = XLSX.utils.json_to_sheet(example, { header: COLUMNS });
    ws['!cols'] = COLUMNS.map((c) => ({ wch: c === 'fullName' || c === 'email' ? 22 : 16 }));

    // Feuille d'instructions
    const instructions = [
      ['COLONNE', 'OBLIGATOIRE POUR', 'DESCRIPTION'],
      ['role', 'TOUS', 'COORDINATEUR | SUPERVISEUR | COMMERCIAL'],
      ['fullName', 'TOUS', 'Nom complet'],
      ['phone', 'TOUS', 'Téléphone (sert d\'identifiant de connexion, unique)'],
      ['email', 'optionnel', 'Adresse email (unique si fournie)'],
      ['password', 'optionnel', 'Mot de passe (min. 8 caractères). Généré si vide'],
      ['zone', 'COORDINATEUR, SUPERVISEUR', 'Nom de la zone'],
      ['secteur', 'SUPERVISEUR', 'Nom du secteur'],
      ['supervisorPhone', 'COMMERCIAL', 'Téléphone du superviseur de rattachement'],
      [],
      ['ORDRE', '', 'Importez coordinateurs, puis superviseurs, puis commerciaux'],
      ['', '', '(le système trie automatiquement par rôle)'],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(instructions);
    wsInfo['!cols'] = [{ wch: 18 }, { wch: 26 }, { wch: 55 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipe');
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions');
    XLSX.writeFile(wb, 'modele_import_equipe.xlsx');
  };

  /** Parse le fichier Excel sélectionné. */
  const handleFile = (file: File) => {
    setParseError('');
    setReport(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        // Première feuille (ou "Equipe" si présente)
        const sheetName = wb.SheetNames.includes('Equipe')
          ? 'Equipe'
          : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
        });

        const parsed: ParsedRow[] = json
          .map((r) => ({
            role: String(r.role ?? '').trim(),
            fullName: String(r.fullName ?? '').trim(),
            phone: String(r.phone ?? '').trim(),
            email: String(r.email ?? '').trim(),
            password: String(r.password ?? '').trim(),
            zone: String(r.zone ?? '').trim(),
            secteur: String(r.secteur ?? '').trim(),
            supervisorPhone: String(r.supervisorPhone ?? '').trim(),
          }))
          .filter((r) => r.role || r.fullName || r.phone);

        if (parsed.length === 0) {
          setParseError('Aucune ligne valide trouvée dans le fichier.');
          return;
        }
        setRows(parsed);
      } catch {
        setParseError('Impossible de lire le fichier. Vérifiez le format Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setReport(null);
    try {
      const { data } = await api.post('/users/bulk-import', { rows });
      setReport(data);
      if (data.created > 0) onSuccess();
    } catch (err: unknown) {
      setParseError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erreur lors de l'import",
      );
    } finally {
      setImporting(false);
    }
  };

  const counts = rows.reduce(
    (acc, r) => {
      const role = r.role.toUpperCase();
      if (role === 'COORDINATEUR') acc.coord++;
      else if (role === 'SUPERVISEUR') acc.sup++;
      else if (role === 'COMMERCIAL') acc.com++;
      return acc;
    },
    { coord: 0, sup: 0, com: 0 },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-k2l-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <RiFileExcel2Line className="text-xl text-[#1D9E75]" />
            <h2 className="font-head text-base font-semibold">Importer une équipe (Excel)</h2>
          </div>
          <button onClick={onClose} className="text-k2l-gray-400 hover:text-k2l-gray-600">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Étape 1 : modèle */}
          <div className="mb-4 flex items-center justify-between rounded-lg bg-k2l-gray-100 px-4 py-3">
            <div className="text-[13px] text-k2l-gray-600">
              <span className="font-medium text-k2l-gray-900">Première fois ?</span> Téléchargez le modèle Excel pré-rempli.
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 rounded-lg border border-[#1D9E75] px-3 py-2 text-[13px] font-semibold text-[#1D9E75] hover:bg-[#1D9E75]/5"
            >
              <RiDownloadLine /> Modèle
            </button>
          </div>

          {/* Étape 2 : upload */}
          {!report && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-k2l-gray-200 px-4 py-8 text-center hover:border-[#1D9E75]"
            >
              <RiUploadCloud2Line className="mb-2 text-3xl text-k2l-gray-400" />
              <p className="text-sm font-medium text-k2l-gray-700">
                {fileName || 'Cliquez ou glissez votre fichier Excel ici'}
              </p>
              <p className="mt-1 text-[11px] text-k2l-gray-400">Formats acceptés : .xlsx, .xls, .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {parseError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-k2l-red/10 px-4 py-3 text-[13px] text-k2l-red">
              <RiErrorWarningLine /> {parseError}
            </div>
          )}

          {/* Aperçu */}
          {rows.length > 0 && !report && (
            <div>
              <div className="mb-2 flex items-center gap-3 text-[12px]">
                <span className="rounded-full bg-[#E6F1FB] px-2.5 py-1 font-medium text-[#1F5C99]">
                  {counts.coord} coordinateur(s)
                </span>
                <span className="rounded-full bg-[#E6F1FB] px-2.5 py-1 font-medium text-[#1F5C99]">
                  {counts.sup} superviseur(s)
                </span>
                <span className="rounded-full bg-k2l-gray-100 px-2.5 py-1 font-medium text-k2l-gray-600">
                  {counts.com} commercial(aux)
                </span>
                <span className="ml-auto font-semibold text-k2l-gray-900">{rows.length} ligne(s)</span>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border border-k2l-gray-200">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-k2l-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">#</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Rôle</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Nom</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Téléphone</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Rattachement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-k2l-gray-100">
                        <td className="px-2 py-1.5 text-k2l-gray-400">{i + 1}</td>
                        <td className="px-2 py-1.5">{r.role}</td>
                        <td className="px-2 py-1.5 font-medium">{r.fullName}</td>
                        <td className="px-2 py-1.5 text-k2l-gray-600">{r.phone}</td>
                        <td className="px-2 py-1.5 text-k2l-gray-500">
                          {r.role.toUpperCase() === 'COMMERCIAL'
                            ? `Sup: ${r.supervisorPhone || '—'}`
                            : [r.zone, r.secteur].filter(Boolean).join(' / ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rapport */}
          {report && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-[#E1F5EE] px-3 py-2 text-[13px] font-semibold text-[#0F6E56]">
                  <RiCheckLine /> {report.created} créé(s)
                </div>
                {report.failed > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-k2l-red/10 px-3 py-2 text-[13px] font-semibold text-k2l-red">
                    <RiErrorWarningLine /> {report.failed} échec(s)
                  </div>
                )}
                <span className="ml-auto text-[12px] text-k2l-gray-400">{report.total} ligne(s) traitée(s)</span>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg border border-k2l-gray-200">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-k2l-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Ligne</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Statut</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Nom</th>
                      <th className="px-2 py-2 text-left font-semibold text-k2l-gray-500">Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.results.map((r) => (
                      <tr key={r.row} className="border-t border-k2l-gray-100">
                        <td className="px-2 py-1.5 text-k2l-gray-400">{r.row}</td>
                        <td className="px-2 py-1.5">
                          {r.status === 'created' ? (
                            <span className="text-[#0F6E56]">✓ Créé</span>
                          ) : (
                            <span className="text-k2l-red">✕ Erreur</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 font-medium">{r.fullName || '—'}</td>
                        <td className="px-2 py-1.5 text-k2l-gray-500">
                          {r.status === 'created' ? r.matricule : r.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-k2l-gray-200 px-5 py-4">
          {report ? (
            <button
              onClick={onClose}
              className="rounded-lg bg-[#1D9E75] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1D9E75]/90"
            >
              Terminer
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-k2l-gray-200 px-4 py-2.5 text-[13px] font-medium text-k2l-gray-600 hover:bg-k2l-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
                className="flex items-center gap-1.5 rounded-lg bg-[#1D9E75] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1D9E75]/90 disabled:opacity-50"
              >
                {importing && <RiLoader4Line className="animate-spin" />}
                {importing ? 'Import en cours...' : `Importer ${rows.length || ''} ligne(s)`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
