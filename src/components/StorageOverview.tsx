import React from 'react';
import { HardDrive, Trash2, PieChart, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { DriveStorageQuota } from '../types';
import { formatBytes } from '../utils/formatters';

interface StorageOverviewProps {
  quota?: DriveStorageQuota;
  trashSize: number;
  trashCount: number;
  onOpenTrash: () => void;
  onQuickEmptyTrash: () => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  quota,
  trashSize,
  trashCount,
  onOpenTrash,
  onQuickEmptyTrash,
}) => {
  const limit = quota?.limit ? parseInt(quota.limit, 10) : 15 * 1024 * 1024 * 1024; // Standard 15 GB
  const usage = quota?.usage ? parseInt(quota.usage, 10) : 0;
  const usageInDrive = quota?.usageInDrive ? parseInt(quota.usageInDrive, 10) : usage;
  const usageInTrash = quota?.usageInDriveTrash ? parseInt(quota.usageInDriveTrash, 10) : trashSize;

  const usagePercent = limit > 0 ? Math.min(Math.round((usage / limit) * 100), 100) : 0;
  const trashPercent = limit > 0 ? ((usageInTrash / limit) * 100) : 0;
  const driveFilesOnlyUsage = Math.max(0, usageInDrive - usageInTrash);
  const otherUsage = Math.max(0, usage - usageInDrive); // Fotos, Gmail etc.

  const isAlmostFull = usagePercent >= 85;
  const isCritical = usagePercent >= 95;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Main Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Google Drive Speicherplatz-Übersicht
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {formatBytes(usage)}
            </span>
            <span className="text-sm font-medium text-slate-500">
              von {formatBytes(limit)} belegt ({usagePercent}%)
            </span>
          </div>

          {/* Warning Banner if nearly full */}
          {isAlmostFull && (
            <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {isCritical
                  ? 'Achtung: Ihr Google Drive Speicher ist fast vollständig erschöpft!'
                  : 'Ihr Speicherplatz wird knapp. Bereinigen Sie den Papierkorb und große Dateien.'}
              </span>
            </div>
          )}

          {/* Visual Progress Bar */}
          <div className="mt-4">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {/* Drive files */}
              <div
                style={{ width: `${Math.min(100, (driveFilesOnlyUsage / limit) * 100)}%` }}
                className="bg-blue-600 h-full transition-all duration-500"
                title={`Drive Dateien: ${formatBytes(driveFilesOnlyUsage)}`}
              />
              {/* Trash */}
              <div
                style={{ width: `${Math.min(100, trashPercent)}%` }}
                className="bg-rose-500 h-full transition-all duration-500 animate-pulse"
                title={`Papierkorb: ${formatBytes(usageInTrash)}`}
              />
              {/* Other Google Usage (Gmail/Fotos) */}
              <div
                style={{ width: `${Math.min(100, (otherUsage / limit) * 100)}%` }}
                className="bg-indigo-300 h-full transition-all duration-500"
                title={`Gmail & Fotos: ${formatBytes(otherUsage)}`}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Drive-Dateien: <strong>{formatBytes(driveFilesOnlyUsage)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Papierkorb: <strong className="text-rose-600">{formatBytes(usageInTrash)}</strong></span>
              </div>
              {otherUsage > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-300" />
                  <span>Google Fotos / Gmail: <strong>{formatBytes(otherUsage)}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 ml-auto text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Freier Speicher: <strong>{formatBytes(Math.max(0, limit - usage))}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Trash Action Card */}
        <div className="shrink-0 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between max-w-sm w-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Papierkorb & Müll
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {trashCount} {trashCount === 1 ? 'Datei' : 'Dateien'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Dateien im Papierkorb belegen <strong className="text-slate-800">{formatBytes(usageInTrash)}</strong> Ihres Kontingents.
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onQuickEmptyTrash}
              disabled={trashCount === 0 && usageInTrash === 0}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Müll jetzt löschen
            </button>

            <button
              onClick={onOpenTrash}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              Ansehen
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
