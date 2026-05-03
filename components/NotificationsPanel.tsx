'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { InsightAlert } from '@/components/InsightAlerts';

interface NotificationsPanelProps {
  alerts: InsightAlert[];
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_STYLES = {
  danger: 'border-red-500/20 bg-red-500/[0.08] text-red-200',
  warning: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-200',
  info: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-200',
  success: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200',
};

const TYPE_LABELS = {
  danger: 'Urgent',
  warning: 'Warning',
  info: 'Info',
  success: 'Resolved',
};

export default function NotificationsPanel({
  alerts,
  isOpen,
  onClose,
}: NotificationsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-white/[0.08] bg-[#0d1117] shadow-2xl"
          >
            <div className="shrink-0 border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-purple-300">Alerts</span>`r`n                  <div>
                    <h2 className="text-base font-semibold text-slate-200">Notifications</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {alerts.length} active insight{alerts.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 transition-all hover:bg-white/[0.04] hover:text-slate-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="popLayout">
                {alerts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <span className="mb-3 text-3xl">OK</span>
                    <p className="text-sm text-slate-500">No active notifications</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Analyze a website to see privacy, carbon, and health insights here.
                    </p>
                  </motion.div>
                ) : (
                  alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ delay: index * 0.03 }}
                      className={`rounded-xl border px-4 py-3 ${TYPE_STYLES[alert.type]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-base">{alert.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                              {TYPE_LABELS[alert.type]}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-6">{alert.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

