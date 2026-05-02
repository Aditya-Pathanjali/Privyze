'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CarbonService } from '@/lib/services/carbon';

interface CarbonPanelProps {
  currentSize: number;
  totalObservedSize: number;
  blockedSize: number;
}

function formatTransfer(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.001) {
      setDisplayed(value);
      prevRef.current = value;
      return;
    }
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayed(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevRef.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span className="font-mono tabular-nums">{displayed.toFixed(decimals)}</span>;
}

export default function CarbonPanel({
  currentSize,
  totalObservedSize,
  blockedSize,
}: CarbonPanelProps) {
  const beforeCarbon = CarbonService.calculateCarbon(totalObservedSize / 1024);
  const afterCarbon = CarbonService.calculateCarbon(currentSize / 1024);
  const savedCarbon = Math.max(0, beforeCarbon - afterCarbon);
  const reduction = CarbonService.calculateReduction(beforeCarbon, afterCarbon);
  const equivalent = CarbonService.getEquivalent(savedCarbon);
  const progressPercent = totalObservedSize > 0 ? Math.min(100, (currentSize / totalObservedSize) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌱</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Impact Engine
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-200">
              Carbon impact & data transfer
            </h2>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Hero saved number */}
        <div className="text-center py-3">
          <motion.div
            className="inline-flex items-baseline gap-1"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-4xl font-bold text-emerald-400">
              <AnimatedNumber value={savedCarbon} />
            </span>
            <span className="text-lg font-medium text-emerald-400/70">g CO₂ saved</span>
          </motion.div>
          {savedCarbon > 0 && (
            <motion.p
              className="mt-2 text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {equivalent}
            </motion.p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              label: 'Current transfer',
              value: formatTransfer(currentSize),
              icon: '📊',
              color: 'text-slate-200',
            },
            {
              label: 'Before filtering',
              value: CarbonService.formatCarbon(beforeCarbon),
              icon: '📈',
              color: 'text-slate-200',
            },
            {
              label: 'After filtering',
              value: CarbonService.formatCarbon(afterCarbon),
              icon: '📉',
              color: 'text-emerald-400',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {item.icon} {item.label}
              </p>
              <p className={`mt-1.5 text-sm font-semibold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-300">Filtering impact</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Data transfer reduction from blocking
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                <AnimatedNumber value={reduction} decimals={0} />
                <span className="text-lg">%</span>
              </p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">reduction</p>
            </div>
          </div>

          {/* Bar */}
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full progress-bar"
              style={{
                background: `linear-gradient(90deg, #10b981, #8b5cf6)`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${100 - progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Blocked: {formatTransfer(blockedSize)}</span>
            <span className="text-purple-400">
              Emissions: {CarbonService.formatCarbon(afterCarbon)}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
