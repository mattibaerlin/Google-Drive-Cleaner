import React, { useState } from 'react';
import { HardDrive, ShieldCheck, Sparkles, Trash2, Flame, KeyRound, ArrowRight, Loader2, Info, HelpCircle } from 'lucide-react';

interface AuthCardProps {
  onLogin: () => Promise<void>;
  onTokenSubmit: (token: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onLogin,
  onTokenSubmit,
  isLoading,
  errorMessage,
}) => {
  const [manualToken, setManualToken] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onTokenSubmit(manualToken.trim());
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 text-center relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100/70 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-100/70 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25 mb-6">
          <HardDrive className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Google Drive Bereinigung
        </h2>
        <p className="text-sm text-slate-600 mt-2.5 max-w-md mx-auto leading-relaxed">
          Verbinden Sie Ihr Google-Konto, um belegten Speicherplatz zu analysieren, den Papierkorb unwiderruflich zu leeren und große Speicherfresser zu entfernen.
        </p>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-600 mt-1">
                Hinweis: Bitte erlauben Sie Popups im Browser, wenn das Anmeldefenster blockiert wird.
              </p>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 rounded-xl font-semibold shadow-md border border-slate-300 flex items-center justify-center gap-3 transition-all disabled:opacity-60 text-sm sm:text-base cursor-pointer hover:border-slate-400 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="font-bold text-slate-800">Mit Google anmelden & verbinden</span>
          </button>

          <p className="text-[11px] text-slate-500">
            Sichere OAuth 2.0 Autorisierung • Zugriff nur auf Google Drive
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showManual ? 'Manuelle Token-Eingabe ausblenden' : 'Alternativ: Zugriffstoken manuell eingeben'}
            </button>
          </div>
        </div>

        {/* Manual token input option */}
        {showManual && (
          <form onSubmit={handleManualSubmit} className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3 animate-in fade-in duration-200">
            <div>
              <label htmlFor="token-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Google OAuth Access Token (Bearer Token):
              </label>
              <input
                id="token-input"
                type="password"
                placeholder="ya29.a0A..."
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Geben Sie ein vorhandenes Google Drive Access Token ein, falls Popups in Ihrer Browserumgebung deaktiviert sind.
              </p>
            </div>
            <button
              type="submit"
              disabled={!manualToken.trim()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Token anwenden & verbinden
            </button>
          </form>
        )}

        {/* Feature List */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left border-t border-slate-100 pt-6">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600 w-fit mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Müll & Papierkorb</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Gelöschte Daten 1-Klick leeren</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 w-fit mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Speicherfresser</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Große Videos, ISOs & Archive</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 w-fit mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">100% Sicher</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Sicherheitsbestätigung vor Löschen</p>
          </div>
        </div>
      </div>
    </div>
  );
};
