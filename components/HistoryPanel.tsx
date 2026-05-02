'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryEntry } from '@/hooks/useAnalysisHistory';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onLoadUrl: (url: string) => void;
  onRemoveEntry: (id: string) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export default function HistoryPanel({
  history,
  onLoadUrl,
  onRemoveEntry,
  onClearHistory,
  isOpen,
  onClose,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter((entry) => entry.url.toLowerCase().includes(q));
  }, [history, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0d1117] border-l border-white/[0.08] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-white/[0.06] px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📜</span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-200">Analysis History</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{history.length} sites analyzed</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by URL..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500/30 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredHistory.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <span className="text-3xl mb-3">📝</span>
                    <p className="text-sm text-slate-500">
                      {searchQuery ? 'No matching sites found' : 'No analysis history yet'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery ? 'Try a different search term' : 'Analyze a website to see it here'}
                    </p>
                  </motion.div>
                ) : (
                  filteredHistory.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: index * 0.03 }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/10 hover:bg-white/[0.04] transition-all group cursor-pointer"
                      onClick={() => {
                        onLoadUrl(entry.url);
                        onClose();
                      }}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                              {(() => {
                                try { return new URL(entry.url).hostname; } catch { return entry.url; }
                              })()}
                            </p>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5 font-mono">
                              {entry.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-600">{timeAgo(entry.timestamp)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveEntry(entry.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Metrics row */}
                        <div className="mt-3 flex items-center gap-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getScoreBg(entry.privacyScore)} ${getScoreColor(entry.privacyScore)}`}>
                            {entry.privacyScore}/100
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {entry.trackerCount} tracker{entry.trackerCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {entry.dataTransferKB} KB
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {entry.carbonGrams.toFixed(2)}g CO₂
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="border-t border-white/[0.06] px-6 py-4 shrink-0">
                <motion.button
                  onClick={onClearHistory}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-2.5 text-sm font-medium text-red-400/80 transition-all hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-400"
                >
                  Clear all history
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
