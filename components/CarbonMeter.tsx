'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CarbonService } from '@/lib/services/carbon';

interface CarbonPanelProps {
  currentSize: number;
  totalObservedSize: number;
  blockedSize: number;
}

function formatTransfer(bytes: number) {
  const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safeBytes < 1024) return `${safeBytes} B`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(0)} KB`;
  return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const start = prevRef.current;
    const diff = safeValue - start;
    if (Math.abs(diff) < 0.001) {
      setDisplayed(safeValue);
      prevRef.current = safeValue;
      return;
    }

    const duration = 650;
    const startTime = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayed(current);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        prevRef.current = safeValue;
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="font-mono tabular-nums">{displayed.toFixed(decimals)}</span>;
}

function AnimatedTransferValue({ bytes }: { bytes: number }) {
  const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safeBytes < 1024) {
    return (
      <>
        <AnimatedNumber value={safeBytes} decimals={0} /> B
      </>
    );
  }
  if (safeBytes < 1024 * 1024) {
    return (
      <>
        <AnimatedNumber value={safeBytes / 1024} decimals={0} /> KB
      </>
    );
  }
  return (
    <>
      <AnimatedNumber value={safeBytes / (1024 * 1024)} decimals={2} /> MB
    </>
  );
}

function AnimatedCarbonValue({
  grams,
  className = '',
}: {
  grams: number;
  className?: string;
}) {
  const safeGrams = Number.isFinite(grams) ? Math.max(0, grams) : 0;
  const useMilligrams = safeGrams < 1;
  const displayValue = useMilligrams ? safeGrams * 1000 : safeGrams;

  return (
    <span className={className}>
      <AnimatedNumber value={displayValue} decimals={useMilligrams ? 1 : 2} />
      <span className="ml-1">{useMilligrams ? 'mg CO2' : 'g CO2'}</span>
    </span>
  );
}

function getPhoneCharges(carbonGrams: number): string {
  const charges = carbonGrams / 8.22;
  if (charges < 0.01) return 'less than 0.01 phone charges';
  if (charges < 1) return `${charges.toFixed(2)} phone charges`;
  return `${charges.toFixed(1)} phone charges`;
}

function getDrivingDistance(carbonGrams: number): string {
  const meters = (carbonGrams / 192) * 1000;
  if (meters < 1) return 'less than 1 meter of driving';
  if (meters < 1000) return `${Math.round(meters)} meters of driving`;
  return `${(meters / 1000).toFixed(1)} km of driving`;
}

function getLEDBulbMinutes(carbonGrams: number): string {
  const minutes = (carbonGrams / 4.6) * 60;
  if (minutes < 1) return 'less than 1 minute of LED light';
  if (minutes < 60) return `${Math.round(minutes)} min of LED light`;
  return `${(minutes / 60).toFixed(1)} hours of LED light`;
}

export default React.memo(function CarbonPanel({
  currentSize,
  totalObservedSize,
  blockedSize,
}: CarbonPanelProps) {
  const beforeCarbon = CarbonService.calculateCarbon(totalObservedSize / 1024);
  const afterCarbon = CarbonService.calculateCarbon(currentSize / 1024);
  const savedCarbon = Math.max(0, beforeCarbon - afterCarbon);
  const reduction = CarbonService.calculateReduction(beforeCarbon, afterCarbon);
  const blockedPercent = totalObservedSize > 0
    ? Math.min(100, (blockedSize / totalObservedSize) * 100)
    : 0;
  const hasSavings = savedCarbon > 0.0005 || blockedSize > 0;
  const displayCarbon = afterCarbon > 0 ? afterCarbon : beforeCarbon;

  const stats = [
    {
      label: 'Current transfer',
      value: <AnimatedTransferValue bytes={currentSize} />,
      icon: '📊',
      color: 'text-slate-200',
    },
    {
      label: 'Before filtering',
      value: <AnimatedCarbonValue grams={beforeCarbon} />,
      icon: '📈',
      color: 'text-slate-200',
    },
    {
      label: 'After filtering',
      value: <AnimatedCarbonValue grams={afterCarbon} />,
      icon: '📉',
      color: 'text-emerald-400',
    },
  ];

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

      <div className="space-y-5 px-5 py-5">
        <div className="py-3 text-center">
          <motion.div
            className="inline-flex flex-wrap items-baseline justify-center gap-2"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45 }}
          >
            <AnimatedCarbonValue
              grams={hasSavings ? savedCarbon : displayCarbon}
              className={`text-4xl font-bold ${
                hasSavings ? 'text-emerald-400' : 'text-purple-300'
              }`}
            />
            <span
              className={`text-lg font-medium ${
                hasSavings ? 'text-emerald-400/70' : 'text-purple-300/70'
              }`}
            >
              {hasSavings ? 'saved' : 'current impact'}
            </span>
          </motion.div>

          {!hasSavings && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-slate-500"
            >
              Turn on blocking controls to compare emissions before and after filtering.
            </motion.p>
          )}

          <motion.div
            className="mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <SustainabilityBadge icon="🔌" text={`≈ ${getPhoneCharges(displayCarbon)}`} delay={0.25} />
              <SustainabilityBadge icon="🚗" text={`≈ ${getDrivingDistance(displayCarbon)}`} delay={0.32} />
              <SustainabilityBadge icon="💡" text={`≈ ${getLEDBulbMinutes(displayCarbon)}`} delay={0.39} />
            </div>
          </motion.div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {stats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {item.icon} {item.label}
              </p>
              <p className={`mt-1.5 text-sm font-semibold ${item.color}`}>{item.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Filtering impact</p>
              <p className="mt-0.5 text-xs text-slate-600">
                Data transfer reduction from blocking
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                <AnimatedNumber value={reduction} decimals={0} />
                <span className="text-lg">%</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-600">reduction</p>
            </div>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="progress-bar h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #10b981, #8b5cf6)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${blockedPercent}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Blocked: {formatTransfer(blockedSize)}</span>
            <span className="text-purple-400">
              Emissions: <AnimatedCarbonValue grams={afterCarbon} />
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
});

function SustainabilityBadge({
  icon,
  text,
  delay,
}: {
  icon: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-slate-400"
    >
      <span>{icon}</span>
      {text}
    </motion.span>
  );
}
