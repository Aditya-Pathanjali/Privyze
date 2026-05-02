'use client';

import { motion } from 'framer-motion';

interface SandboxViewProps {
  url: string;
  title: string;
  mode: 'live' | 'mock' | null;
  isLoading: boolean;
  error: string;
  previewImage: string;
}

export default function SandboxView({
  url,
  title,
  mode,
  isLoading,
  error,
  previewImage,
}: SandboxViewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel-elevated overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sandbox Environment
              </p>
            </div>
            <h2 className="mt-1 text-base font-semibold text-slate-200 truncate">
              {title || 'Loading sandbox session…'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 break-all">{url}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400">Active</span>
            </span>

            {/* Mode badge */}
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                mode === 'live'
                  ? 'border border-purple-500/20 bg-purple-500/10 text-purple-300'
                  : 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
              }`}
            >
              {mode === 'live' ? '● Live BrowserPod' : '◌ Simulation'}
            </span>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e13] scanline-overlay">
          {isLoading ? (
            <div className="flex h-[20rem] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
                <p className="mt-4 text-sm text-slate-500">
                  Initializing BrowserPod session…
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-purple-500/50"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : previewImage ? (
            <img
              src={previewImage}
              alt="Sandbox preview"
              className="h-[20rem] w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-[20rem] items-center justify-center text-sm text-slate-600">
              Preview unavailable for this session.
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Execution',
              value: mode === 'live' ? 'Contained browser session' : 'Mocked BrowserPod replay',
              icon: '⚡',
            },
            {
              label: 'Isolation',
              value: 'No direct page execution in user UI',
              icon: '🔒',
            },
            {
              label: 'Collection',
              value: 'Requests captured from sandbox runtime',
              icon: '📡',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{item.icon}</span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
              </div>
              <p className="mt-1.5 text-xs font-medium text-slate-400">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
          >
            {error}
          </motion.div>
        ) : null}
      </div>
    </motion.section>
  );
}
