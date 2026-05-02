'use client';

import { motion } from 'framer-motion';
import { AggregatedDomain } from '@/lib/types';

interface FlowVisualizationProps {
  url: string;
  domains: AggregatedDomain[];
  blockedDomains: Set<string>;
}

export default function FlowVisualization({ url, domains, blockedDomains }: FlowVisualizationProps) {
  const trackerDomains = domains.filter((d) => d.isTracker || blockedDomains.has(d.domain)).slice(0, 4);
  const safeDomains = domains.filter((d) => !d.isTracker && !blockedDomains.has(d.domain)).slice(0, 4);

  let hostname = 'Website';
  try {
    hostname = new URL(url).hostname;
  } catch {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Network Flow
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-200">
          Data flow visualization
        </h2>
      </div>

      <div className="px-5 py-6">
        <div className="flex flex-col items-center gap-2">
          {/* Source */}
          <motion.div
            className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="text-sm font-medium text-blue-300 truncate max-w-[200px]">{hostname}</span>
          </motion.div>

          {/* Arrow down */}
          <FlowArrow color="text-purple-500/60" delay={0.2} />

          {/* Privyze Sandbox */}
          <motion.div
            className="relative flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-3 glow-purple-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400 dot-pulse" />
            <span className="text-sm font-semibold text-purple-300">Privyze Sandbox</span>
          </motion.div>

          {/* Arrow down */}
          <FlowArrow color="text-purple-500/60" delay={0.4} />

          {/* External Domains split */}
          <div className="w-full grid grid-cols-2 gap-3 mt-1">
            {/* Safe side */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 text-center mb-2">
                ✓ Safe
              </p>
              {safeDomains.map((domain, i) => (
                <motion.div
                  key={domain.domain}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-400 truncate">{domain.domain}</span>
                </motion.div>
              ))}
              {safeDomains.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-3">No safe domains yet</p>
              )}
            </div>

            {/* Tracker side */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500 text-center mb-2">
                ✕ Trackers
              </p>
              {trackerDomains.map((domain, i) => (
                <motion.div
                  key={domain.domain}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    blockedDomains.has(domain.domain)
                      ? 'border-red-500/20 bg-red-500/5 line-through opacity-60'
                      : 'border-red-500/15 bg-red-500/5'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-400 truncate">{domain.domain}</span>
                </motion.div>
              ))}
              {trackerDomains.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-3">No trackers detected</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FlowArrow({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay }}
      className={`flex flex-col items-center gap-0 ${color}`}
    >
      <div className="w-px h-5 bg-current opacity-40" />
      <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor" opacity="0.6">
        <path d="M6 8L0 0h12z" />
      </svg>
    </motion.div>
  );
}
