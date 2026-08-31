import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  Flame,
  FileText,
  FileSpreadsheet,
  FileImage,
  Video,
  FileArchive,
  Music,
  Folder,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { DriveFile, FileCategory } from '../types';
import { formatBytes, formatDate, formatRelativeDate, getFileCategory, getCategoryLabel } from '../utils/formatters';

interface FileManagerProps {
  files: DriveFile[];
  mode?: 'all' | 'large_only';
  isLoading: boolean;
  onMoveToTrash: (files: DriveFile[]) => void;
  onDeletePermanently: (files: DriveFile[]) => void;
  onRefresh: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  mode = 'all',
  isLoading,
  onMoveToTrash,
  onDeletePermanently,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('alle');
  const [minSizeMB, setMinSizeMB] = useState<number>(mode === 'large_only' ? 50 : 0);
  const [sortBy, setSortBy] = useState<'size' | 'modifiedTime' | 'name'>('size');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      if (file.trashed) return false;

      // Filter folders if large files mode
      if (mode === 'large_only' && file.mimeType === 'application/vnd.google-apps.folder') {
        return false;
      }

      // Min Size filter
      const sizeBytes = parseInt(file.size || file.quotaBytesUsed || '0', 10) || 0;
      if (minSizeMB > 0 && sizeBytes < minSizeMB * 1024 * 1024) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!file.name.toLowerCase().includes(q)) return false;
      }

      // Category
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
  }, [files, mode, minSizeMB, searchQuery, selectedCategory, sortBy, sortOrder]);

  const selectedFiles = useMemo(() => {
    return files.filter(f => selectedIds.includes(f.id));
  }, [files, selectedIds]);

  const selectedBytes = selectedFiles.reduce(
    (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
    0
  );

  const totalFilteredBytes = filteredFiles.reduce(
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
    'ordner'
  ];

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            {mode === 'large_only' ? (
              <span className="text-amber-600 flex items-center gap-1">
                <Flame className="w-4 h-4" /> Große Speicherfresser
              </span>
            ) : (
              <span className="text-blue-600 flex items-center gap-1">
                <FolderOpen className="w-4 h-4" /> Google Drive Dateimanager
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'large_only' ? 'Große Dateien & Medien bereinigen' : 'Alle Dateien durchsuchen & bereinigen'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gefiltert: <strong className="text-slate-800">{filteredFiles.length} Dateien</strong> ({formatBytes(totalFilteredBytes)})
          </p>
        </div>

        {/* Quick Size Filter presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Mindestgröße:</span>
          {[
            { label: 'Alle', value: 0 },
            { label: '> 10 MB', value: 10 },
            { label: '> 50 MB', value: 50 },
            { label: '> 100 MB', value: 100 },
            { label: '> 500 MB', value: 500 },
          ].map(preset => (
            <button
              key={preset.value}
              onClick={() => setMinSizeMB(preset.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                minSizeMB === preset.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Dateien nach Name durchsuchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 hidden sm:inline">Sortieren:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="size">Dateigröße</option>
              <option value="modifiedTime">Zuletzt geändert</option>
              <option value="name">Dateiname (A-Z)</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title={sortOrder === 'desc' ? 'Absteigend (größte zuerst)' : 'Aufsteigend'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
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
              onClick={() => onMoveToTrash(selectedFiles)}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              In den Papierkorb ({formatBytes(selectedBytes)})
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

      {/* File List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{selectedIds.length > 0 ? `${selectedIds.length} gewählt` : 'Alle auswählen'}</span>
          </button>

          <span>
            {filteredFiles.length} {filteredFiles.length === 1 ? 'Datei' : 'Dateien'}
          </span>
        </div>

        {filteredFiles.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredFiles.map(file => {
              const isSelected = selectedIds.includes(file.id);
              const fileSize = parseInt(file.size || file.quotaBytesUsed || '0', 10) || 0;
              const isVeryLarge = fileSize >= 100 * 1024 * 1024;

              return (
                <div
                  key={file.id}
                  className={`p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleSelectOne(file.id)}
                      className="shrink-0 p-1 text-slate-400 hover:text-blue-600 focus:outline-hidden"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
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
                        {isVeryLarge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Groß
                          </span>
                        )}
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
                        <span className={`font-semibold ${isVeryLarge ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                          {formatBytes(fileSize)}
                        </span>
                        <span>•</span>
                        <span>{getCategoryLabel(getFileCategory(file.mimeType, file.name))}</span>
                        {file.modifiedTime && (
                          <>
                            <span>•</span>
                            <span>Geändert: {formatRelativeDate(file.modifiedTime)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onMoveToTrash([file])}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="In den Papierkorb verschieben"
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
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Keine passenden Dateien gefunden</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Passen Sie Ihre Filter oder den Suchbegriff an.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
