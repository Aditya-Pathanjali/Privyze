'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
  index: number;
}

function MetricCard({ label, value, detail, icon, color, index }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="glass-panel card-hover relative overflow-hidden px-5 py-5"
    >
      {/* Colored top accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${color}`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white font-mono tabular-nums">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500 leading-5">{detail}</p>
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface LiveMetricsProps {
  domains: number;
  trackerCount: number;
  currentSizeKB: number;
  totalSizeKB: number;
  blockedSizeKB: number;
  blockedCount: number;
  reductionPercent: number;
}

export default React.memo(function LiveMetrics({
  domains,
  trackerCount,
  currentSizeKB,
  totalSizeKB,
  blockedSizeKB,
  blockedCount,
  reductionPercent,
}: LiveMetricsProps) {
  const cards = [
    {
      label: 'Observed Domains',
      value: `${domains}`,
      detail: `${trackerCount} tracker-related domains`,
      color: 'bg-gradient-to-r from-blue-500 to-blue-400',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      label: 'Data Transfer',
      value: `${currentSizeKB} KB`,
      detail: `${totalSizeKB} KB before filtering`,
      color: 'bg-gradient-to-r from-purple-500 to-purple-400',
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17" />
        </svg>
      ),
    },
    {
      label: 'Blocked Traffic',
      value: `${blockedSizeKB} KB`,
      detail: `${blockedCount} blocked requests`,
      color: 'bg-gradient-to-r from-red-500 to-red-400',
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      label: 'Carbon Reduction',
      value: `${reductionPercent}%`,
      detail: 'Compared with unfiltered run',
      color: 'bg-gradient-to-r from-green-500 to-emerald-400',
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M12 22V8M5 12l7-7 7 7" />
          <path d="M3 22h18" />
        </svg>
      ),
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <MetricCard key={card.label} index={i} {...card} />
      ))}
    </section>
  );
});
