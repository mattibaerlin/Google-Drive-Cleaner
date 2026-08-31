import React from 'react';
import { HardDrive, RefreshCw, LogOut, UserCheck, ShieldCheck, Sparkles, Trash2, FolderKanban, Flame } from 'lucide-react';
import { DriveUser, ActiveTab } from '../types';

interface HeaderProps {
  user?: DriveUser;
  activeTab: ActiveTab;
  trashCount: number;
  isLoading: boolean;
  onTabChange: (tab: ActiveTab) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onConnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  trashCount,
  isLoading,
  onTabChange,
  onRefresh,
  onLogout,
  onConnect,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Google Drive Bereinigung
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Deutsch
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Speicherplatz analysieren, Müll löschen & Papierkorb verwalten
              </p>
            </div>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Speicherdaten aktualisieren"
                  aria-label="Aktualisieren"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>

                {/* User badge */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
                  {user.photoLink ? (
                    <img
                      src={user.photoLink}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-white"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || <UserCheck className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[130px] truncate">
                      {user.displayName || 'Google-Konto'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight max-w-[130px] truncate">
                      {user.emailAddress}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Abmelden"
                  aria-label="Google-Konto trennen"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                Drive verbinden
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-100 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => onTabChange('advisor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'advisor'
                  ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Bereinigungs-Assistent
            </button>

            <button
              onClick={() => onTabChange('trash')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'trash'
                  ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Papierkorb
              {trashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-rose-600 text-white font-bold">
                  {trashCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('large_files')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'large_files'
                  ? 'bg-amber-50 text-amber-800 shadow-xs border border-amber-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-600" />
              Große Speicherfresser
            </button>

            <button
              onClick={() => onTabChange('files')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'files'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              Alle Dateien & Suche
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
