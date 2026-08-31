import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  Flame,
  Copy,
  Clock,
  FileCode,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Eye,
  FileText,
  FileSpreadsheet,
  FileImage,
  Video,
  FileArchive,
  Music
} from 'lucide-react';
import { DriveFile } from '../types';
import { formatBytes, formatDate, formatRelativeDate, getFileCategory } from '../utils/formatters';

interface CleanupAdvisorProps {
  trashFiles: DriveFile[];
  allFiles: DriveFile[];
  isLoading: boolean;
  onEmptyTrash: () => void;
  onMoveFilesToTrash: (files: DriveFile[]) => void;
  onDeleteFilesPermanently: (files: DriveFile[]) => void;
  onNavigateToTab: (tab: 'trash' | 'files' | 'large_files') => void;
  onRefresh: () => void;
}

export const CleanupAdvisor: React.FC<CleanupAdvisorProps> = ({
  trashFiles,
  allFiles,
  isLoading,
  onEmptyTrash,
  onMoveFilesToTrash,
  onDeleteFilesPermanently,
  onNavigateToTab,
  onRefresh,
}) => {
  // Calculation of categories
  const trashTotalBytes = trashFiles.reduce((acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0), 0);

  // Large files (> 50MB)
  const largeFiles = allFiles
    .filter(f => !f.trashed && f.mimeType !== 'application/vnd.google-apps.folder')
    .filter(f => (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0) >= 50 * 1024 * 1024)
    .sort((a, b) => (parseInt(b.size || '0', 10) - parseInt(a.size || '0', 10)));
  const largeFilesBytes = largeFiles.reduce((acc, f) => acc + (parseInt(f.size || '0', 10) || 0), 0);

  // Duplicate candidates (Kopie von..., Copy of..., (1), (2), etc.)
  const duplicateCandidates = allFiles.filter(f => {
    if (f.trashed || f.mimeType === 'application/vnd.google-apps.folder') return false;
    const name = f.name.toLowerCase();
    return (
      name.startsWith('kopie von') ||
      name.startsWith('copy of') ||
      /\s\(\d+\)(\.[a-z0-9]+)?$/i.test(f.name) ||
      name.includes(' - kopie') ||
      name.includes(' - copy')
    );
  });
  const duplicatesBytes = duplicateCandidates.reduce((acc, f) => acc + (parseInt(f.size || '0', 10) || 0), 0);

  // Old untouched files (older than 2 years / 730 days)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const oldFiles = allFiles.filter(f => {
    if (f.trashed || f.mimeType === 'application/vnd.google-apps.folder') return false;
    if (!f.modifiedTime) return false;
    return new Date(f.modifiedTime) < twoYearsAgo;
  }).sort((a, b) => (parseInt(b.size || '0', 10) - parseInt(a.size || '0', 10)));
  const oldFilesBytes = oldFiles.reduce((acc, f) => acc + (parseInt(f.size || '0', 10) || 0), 0);

  // Temp & Cache files (.tmp, .bak, .log, .old, .cache)
  const tempFiles = allFiles.filter(f => {
    if (f.trashed || f.mimeType === 'application/vnd.google-apps.folder') return false;
    const name = f.name.toLowerCase();
    return (
      name.endsWith('.tmp') ||
      name.endsWith('.bak') ||
      name.endsWith('.log') ||
      name.endsWith('.old') ||
      name.endsWith('.cache') ||
      name.endsWith('.part') ||
      name.endsWith('.crdownload') ||
      name.startsWith('~$')
    );
  });
  const tempFilesBytes = tempFiles.reduce((acc, f) => acc + (parseInt(f.size || '0', 10) || 0), 0);

  // Total potential space saving
  const totalPotentialSavings = trashTotalBytes + largeFilesBytes + duplicatesBytes + tempFilesBytes;

  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);
  const [selectedTempFiles, setSelectedTempFiles] = useState<string[]>([]);

  const toggleSelectDuplicate = (id: string) => {
    setSelectedDuplicates(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectTemp = (id: string) => {
    setSelectedTempFiles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getIconForFile = (mimeType: string, name: string) => {
    const cat = getFileCategory(mimeType, name);
    switch (cat) {
      case 'bilder': return <FileImage className="w-4 h-4 text-purple-500" />;
      case 'videos': return <Video className="w-4 h-4 text-rose-500" />;
      case 'archive': return <FileArchive className="w-4 h-4 text-amber-600" />;
      case 'tabellen': return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'audio': return <Music className="w-4 h-4 text-indigo-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Intelligente Drive-Analyse
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Bereinigungs-Assistent & Müll-Finder
          </h2>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Finden Sie blockierten Speicherplatz auf einen Blick. Löschen Sie Müll im Papierkorb, Duplikate und ungenutzte Großdateien dauerhaft.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-blue-200">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs border border-white/10">
              Mögliches Einsparpotenzial: <strong className="text-white text-sm ml-1">{formatBytes(totalPotentialSavings)}</strong>
            </div>
            {trashFiles.length > 0 && (
              <div className="bg-rose-500/30 text-rose-200 px-3 py-1.5 rounded-lg border border-rose-400/30">
                Im Papierkorb: <strong className="text-white text-sm ml-1">{formatBytes(trashTotalBytes)}</strong> ({trashFiles.length} Dateien)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Card: Papierkorb leeren (Highest Priority) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1. Papierkorb leeren</h3>
                  <p className="text-xs text-slate-500">Müll sofort unwiderruflich entfernen</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {trashFiles.length} Elemente
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Dateien im Papierkorb belegen weiterhin vollen Speicherplatz in Ihrem Google-Konto. Ein Leeren gibt sofort <strong className="text-slate-900">{formatBytes(trashTotalBytes)}</strong> frei.
            </p>

            {trashFiles.length > 0 ? (
              <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 max-h-32 overflow-y-auto">
                {trashFiles.slice(0, 3).map(file => (
                  <div key={file.id} className="flex items-center justify-between text-xs text-slate-700">
                    <span className="truncate max-w-[200px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className="font-semibold text-slate-500 shrink-0 ml-2">
                      {formatBytes(file.size || file.quotaBytesUsed)}
                    </span>
                  </div>
                ))}
                {trashFiles.length > 3 && (
                  <p className="text-[11px] text-slate-400 italic text-center pt-1">
                    ...und {trashFiles.length - 3} weitere Dateien
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Ihr Papierkorb ist bereits sauber und leer!
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={onEmptyTrash}
              disabled={trashFiles.length === 0}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Müll jetzt löschen ({formatBytes(trashTotalBytes)})
            </button>

            <button
              onClick={() => onNavigateToTab('trash')}
              className="px-3 py-2.5 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Papierkorb öffnen"
            >
              Details
            </button>
          </div>
        </div>

        {/* 2. Card: Große Speicherfresser (> 50 MB) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. Große Dateien</h3>
                  <p className="text-xs text-slate-500">Dateien über 50 MB (Videos, ISOs, Archive)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {largeFiles.length} Dateien
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Große Dateien machen oft mehr als 80% des belegten Speichers aus. Gesamt: <strong className="text-slate-900">{formatBytes(largeFilesBytes)}</strong>.
            </p>

            {largeFiles.length > 0 ? (
              <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 max-h-32 overflow-y-auto">
                {largeFiles.slice(0, 3).map(file => (
                  <div key={file.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getIconForFile(file.mimeType, file.name)}
                      <span className="truncate max-w-[180px] text-slate-800" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <span className="font-bold text-amber-700 shrink-0 ml-2">
                      {formatBytes(file.size || file.quotaBytesUsed)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-slate-50 rounded-xl p-3 text-center text-xs text-slate-500">
                Keine Dateien über 50 MB gefunden.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('large_files')}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" />
              Große Dateien verwalten ({largeFiles.length})
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Card: Mögliche Duplikate & Kopien */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">3. Duplikate & Kopien</h3>
                  <p className="text-xs text-slate-500">Kopien wie "Kopie von...", "Copy of...", "(1)"</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {duplicateCandidates.length} Kopien
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Aus Versehen erstellte Dateikopien können bereinigt werden. Blockierter Speicher: <strong className="text-slate-900">{formatBytes(duplicatesBytes)}</strong>.
            </p>

            {duplicateCandidates.length > 0 ? (
              <div className="mt-4 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 max-h-36 overflow-y-auto">
                {duplicateCandidates.slice(0, 4).map(file => (
                  <div key={file.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white transition-colors">
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDuplicates.includes(file.id)}
                        onChange={() => toggleSelectDuplicate(file.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="truncate max-w-[180px] text-slate-700" title={file.name}>
                        {file.name}
                      </span>
                    </label>
                    <span className="text-slate-500 font-medium text-[11px] shrink-0 ml-2">
                      {formatBytes(file.size || file.quotaBytesUsed)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-slate-50 rounded-xl p-3 text-center text-xs text-slate-500">
                Keine offensichtlichen Kopien oder Duplikate gefunden.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
            {duplicateCandidates.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const filesToTrash = duplicateCandidates.filter(f =>
                      selectedDuplicates.length > 0 ? selectedDuplicates.includes(f.id) : true
                    );
                    onMoveFilesToTrash(filesToTrash);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedDuplicates.length > 0
                    ? `${selectedDuplicates.length} Kopien in Papierkorb`
                    : 'Alle Kopien in Papierkorb'}
                </button>

                <button
                  onClick={() => {
                    if (selectedDuplicates.length === duplicateCandidates.length) {
                      setSelectedDuplicates([]);
                    } else {
                      setSelectedDuplicates(duplicateCandidates.map(d => d.id));
                    }
                  }}
                  className="px-3 py-2.5 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  {selectedDuplicates.length === duplicateCandidates.length ? 'Keine' : 'Alle'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4. Card: Temporäre & Cache-Dateien */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">4. Temporäre Dateien & Logs</h3>
                  <p className="text-xs text-slate-500">.tmp, .bak, .log, .cache, alte Downloads</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                {tempFiles.length} Dateien
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Temporäre Sicherungs- oder Protokolldateien werden im Alltag selten gebraucht. Belegt: <strong className="text-slate-900">{formatBytes(tempFilesBytes)}</strong>.
            </p>

            {tempFiles.length > 0 ? (
              <div className="mt-4 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 max-h-36 overflow-y-auto">
                {tempFiles.slice(0, 4).map(file => (
                  <div key={file.id} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white transition-colors">
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTempFiles.includes(file.id)}
                        onChange={() => toggleSelectTemp(file.id)}
                        className="rounded text-slate-600 focus:ring-slate-500 w-3.5 h-3.5"
                      />
                      <span className="truncate max-w-[180px] text-slate-700" title={file.name}>
                        {file.name}
                      </span>
                    </label>
                    <span className="text-slate-500 font-medium text-[11px] shrink-0 ml-2">
                      {formatBytes(file.size || file.quotaBytesUsed)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-slate-50 rounded-xl p-3 text-center text-xs text-slate-500">
                Keine temporären Dateien gefunden.
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
            {tempFiles.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const filesToTrash = tempFiles.filter(f =>
                      selectedTempFiles.length > 0 ? selectedTempFiles.includes(f.id) : true
                    );
                    onMoveFilesToTrash(filesToTrash);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedTempFiles.length > 0
                    ? `${selectedTempFiles.length} Temp-Dateien löschen`
                    : 'Alle Temp-Dateien in Papierkorb'}
                </button>

                <button
                  onClick={() => {
                    if (selectedTempFiles.length === tempFiles.length) {
                      setSelectedTempFiles([]);
                    } else {
                      setSelectedTempFiles(tempFiles.map(d => d.id));
                    }
                  }}
                  className="px-3 py-2.5 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  {selectedTempFiles.length === tempFiles.length ? 'Keine' : 'Alle'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
