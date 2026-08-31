import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  progressText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  warningText,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  isDestructive = false,
  isLoading = false,
  progressText,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isLoading && onClose()}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                }`}
              >
                {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {warningText && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-900 leading-relaxed">{warningText}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            {isLoading && progressText && (
              <span className="text-xs text-slate-500 mr-auto flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                {progressText}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
