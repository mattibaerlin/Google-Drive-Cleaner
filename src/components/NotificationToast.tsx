import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationToastProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {notifications.map((notif) => {
          const isSuccess = notif.type === 'success';
          const isError = notif.type === 'error';
          const isWarning = notif.type === 'warning';

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                  : isError
                  ? 'bg-rose-50/95 border-rose-200 text-rose-950'
                  : isWarning
                  ? 'bg-amber-50/95 border-amber-200 text-amber-950'
                  : 'bg-slate-50/95 border-slate-200 text-slate-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="flex-1 text-sm">
                <p className="font-semibold">{notif.title}</p>
                {notif.message && <p className="mt-0.5 text-xs opacity-90 leading-relaxed">{notif.message}</p>}
              </div>

              <button
                onClick={() => onDismiss(notif.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
                title="Schließen"
                aria-label="Benachrichtigung schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
