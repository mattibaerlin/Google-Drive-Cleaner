import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  ExternalLink,
  Filter,
  FileText,
  FileSpreadsheet,
  FileImage,
  Video,
  FileArchive,
  Music,
  Folder,
  ArrowUpDown,
  RefreshCw,
  Info
} from 'lucide-react';
import { DriveFile, FileCategory } from '../types';
import { formatBytes, formatDate, formatRelativeDate, getFileCategory, getCategoryLabel } from '../utils/formatters';

interface TrashManagerProps {
  trashFiles: DriveFile[];
  isLoading: boolean;
  onEmptyTrash: () => void;
  onRestoreFiles: (files: DriveFile[]) => void;
  onDeletePermanently: (files: DriveFile[]) => void;
  onRefresh: () => void;
}

export const TrashManager: React.FC<TrashManagerProps> = ({
  trashFiles,
  isLoading,
  onEmptyTrash,
  onRestoreFiles,
  onDeletePermanently,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('alle');
  const [sortBy, setSortBy] = useState<'size' | 'modifiedTime' | 'name'>('size');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter and Sort Trash Files
  const filteredFiles = useMemo(() => {
    return trashFiles.filter(file => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = file.name.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // Category filter
      if (selectedCategory !== 'alle') {
        const cat = getFileCategory(file.mimeType, file.name);
        if (cat !== selectedCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'size') {
        const sizeA = parseInt(a.size || a.quotaBytesUsed || '0', 10) || 0;
        const sizeB = parseInt(b.size || b.quotaBytesUsed || '0', 10) || 0;
        comparison = sizeA - sizeB;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'de');
      } else if (sortBy === 'modifiedTime') {
        const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
        const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
        comparison = timeA - timeB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [trashFiles, searchQuery, selectedCategory, sortBy, sortOrder]);

  const totalTrashBytes = trashFiles.reduce(
    (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
    0
  );

  const selectedFiles = useMemo(() => {
    return trashFiles.filter(f => selectedIds.includes(f.id));
  }, [trashFiles, selectedIds]);

  const selectedBytes = selectedFiles.reduce(
    (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
    0
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map(f => f.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getFileIcon = (mimeType: string, name: string) => {
    const cat = getFileCategory(mimeType, name);
    switch (cat) {
      case 'ordner': return <Folder className="w-5 h-5 text-amber-500" />;
      case 'bilder': return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'videos': return <Video className="w-5 h-5 text-rose-500" />;
      case 'archive': return <FileArchive className="w-5 h-5 text-amber-600" />;
      case 'tabellen': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'audio': return <Music className="w-5 h-5 text-indigo-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const categories: FileCategory[] = [
    'alle',
    'dokumente',
    'tabellen',
    'pdf',
    'bilder',
    'videos',
    'archive',
    'audio',
    'code',
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Main Empty Trash Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Trash2 className="w-4 h-4" />
            Papierkorb-Verwaltung
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {trashFiles.length} {trashFiles.length === 1 ? 'Datei' : 'Dateien'} im Papierkorb
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Blockierter Speicherplatz: <strong className="text-slate-800">{formatBytes(totalTrashBytes)}</strong>. Nach 30 Tagen löscht Google Drive Elemente automatisch, oder Sie leeren ihn jetzt sofort.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onEmptyTrash}
            disabled={trashFiles.length === 0 || isLoading}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Gesamten Papierkorb leeren ({formatBytes(totalTrashBytes)})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Papierkorb durchsuchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Löschen
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 hidden sm:inline">Sortieren nach:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="size">Größe</option>
              <option value="modifiedTime">Löschdatum / Änderung</option>
              <option value="name">Name</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title={sortOrder === 'desc' ? 'Absteigend (größte/neueste zuerst)' : 'Aufsteigend'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Floating / Sticky Selected Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {selectedIds.length} {selectedIds.length === 1 ? 'Datei ausgewählt' : 'Dateien ausgewählt'}
              </p>
              <p className="text-xs text-slate-300">
                Gesamtgröße: <strong>{formatBytes(selectedBytes)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onRestoreFiles(selectedFiles)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Wiederherstellen
            </button>

            <button
              onClick={() => onDeletePermanently(selectedFiles)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Endgültig löschen
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white"
            >
              Abwählen
            </button>
          </div>
        </div>
      )}

      {/* Files List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-rose-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedIds.length > 0 ? `${selectedIds.length} gewählt` : 'Alle auswählen'}</span>
            </button>
          </div>

          <span className="hidden sm:inline">
            {filteredFiles.length} von {trashFiles.length} {trashFiles.length === 1 ? 'Datei' : 'Dateien'}
          </span>
        </div>

        {/* Content */}
        {filteredFiles.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredFiles.map(file => {
              const isSelected = selectedIds.includes(file.id);
              const fileSize = parseInt(file.size || file.quotaBytesUsed || '0', 10) || 0;

              return (
                <div
                  key={file.id}
                  className={`p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-rose-50/40' : ''
                  }`}
                >
                  {/* Left: Checkbox + Icon + Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleSelectOne(file.id)}
                      className="shrink-0 p-1 text-slate-400 hover:text-rose-600 focus:outline-hidden"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                      {getFileIcon(file.mimeType, file.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 shrink-0"
                            title="In Google Drive öffnen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{formatBytes(fileSize)}</span>
                        <span>•</span>
                        <span>{getCategoryLabel(getFileCategory(file.mimeType, file.name))}</span>
                        {file.modifiedTime && (
                          <>
                            <span>•</span>
                            <span>{formatRelativeDate(file.modifiedTime)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Individual Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRestoreFiles([file])}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Aus dem Papierkorb wiederherstellen"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeletePermanently([file])}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Unwiderruflich löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Keine Dateien im Papierkorb</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Keine Elemente entsprechen Ihrer Suchanfrage im Papierkorb.'
                : 'Ihr Google Drive Papierkorb ist sauber und belegt keinen zusätzlichen Speicherplatz.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
