'use client';

import { motion } from 'framer-motion';
import { CarbonService } from '@/lib/services/carbon';

interface ComparisonPanelProps {
  totalObservedSize: number;
  currentSize: number;
  blockedSize: number;
  trackerCountBefore: number;
  trackerCountAfter: number;
  blockedCount: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MetricComparison({
  label,
  icon,
  beforeValue,
  afterValue,
  beforeDisplay,
  afterDisplay,
  unit,
  delay = 0,
}: {
  label: string;
  icon: string;
  beforeValue: number;
  afterValue: number;
  beforeDisplay: string;
  afterDisplay: string;
  unit?: string;
  delay?: number;
}) {
  const reduction = beforeValue > 0
    ? Math.round(((beforeValue - afterValue) / beforeValue) * 100)
    : 0;
  const hasReduction = reduction > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
        {/* Before */}
        <div className="px-4 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 mb-2">Before</p>
          <p className="text-lg font-bold text-slate-200 font-mono">{beforeDisplay}</p>
          {unit && <p className="text-[10px] text-slate-600 mt-0.5">{unit}</p>}
        </div>

        {/* After */}
        <div className="px-4 py-4 text-center relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">After</p>
          <p className="text-lg font-bold text-emerald-400 font-mono">{afterDisplay}</p>
          {unit && <p className="text-[10px] text-slate-600 mt-0.5">{unit}</p>}
        </div>
      </div>

      {/* Reduction bar */}
      {hasReduction && (
        <div className="px-4 py-3 border-t border-white/[0.04] bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500">Reduction</span>
            <motion.span
              className="text-sm font-bold text-emerald-400 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
            >
              ↓ {reduction}%
            </motion.span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              initial={{ width: '0%' }}
              animate={{ width: `${reduction}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.3 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ComparisonPanel({
  totalObservedSize,
  currentSize,
  blockedSize,
  trackerCountBefore,
  trackerCountAfter,
  blockedCount,
}: ComparisonPanelProps) {
  const beforeCarbon = CarbonService.calculateCarbon(totalObservedSize / 1024);
  const afterCarbon = CarbonService.calculateCarbon(currentSize / 1024);
  const hasBlocking = blockedCount > 0;

  if (!hasBlocking) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Impact Analysis
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-200">
                Before vs. After blocking
              </h2>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
            {blockedCount} blocked
          </span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-3">
        <MetricComparison
          label="Data Transfer"
          icon="📊"
          beforeValue={totalObservedSize}
          afterValue={currentSize}
          beforeDisplay={formatSize(totalObservedSize)}
          afterDisplay={formatSize(currentSize)}
          delay={0}
        />
        <MetricComparison
          label="Active Trackers"
          icon="🛡️"
          beforeValue={trackerCountBefore}
          afterValue={trackerCountAfter}
          beforeDisplay={`${trackerCountBefore}`}
          afterDisplay={`${trackerCountAfter}`}
          unit="trackers"
          delay={0.1}
        />
        <MetricComparison
          label="CO₂ Emissions"
          icon="🌱"
          beforeValue={beforeCarbon}
          afterValue={afterCarbon}
          beforeDisplay={CarbonService.formatCarbon(beforeCarbon)}
          afterDisplay={CarbonService.formatCarbon(afterCarbon)}
          delay={0.2}
        />
      </div>
    </motion.section>
  );
}
