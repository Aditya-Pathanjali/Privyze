'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InsightAlert {
  id: string;
  emoji: string;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'success';
}

interface InsightAlertsProps {
  trackerCount: number;
  domainCount: number;
  carbonGrams: number;
  privacyScore: number;
  healthAlert: boolean;
  sessionActive: boolean;
}

const TYPE_STYLES = {
  danger: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-200',
  warning: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-200',
  info: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-200',
  success: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-200',
};

const TYPE_GLOW = {
  danger: '0 0 30px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.05)',
  warning: '0 0 30px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
  info: '0 0 30px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)',
  success: '0 0 30px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.05)',
};

function generateAlerts(props: InsightAlertsProps): InsightAlert[] {
  const alerts: InsightAlert[] = [];

  if (props.trackerCount > 0) {
    alerts.push({
      id: 'trackers',
      emoji: '🚨',
      message: `${props.trackerCount} tracker${props.trackerCount > 1 ? 's' : ''} detected — your browsing is being monitored`,
      type: 'danger',
    });
  }

  if (props.trackerCount > 3) {
    alerts.push({
      id: 'ad-networks',
      emoji: '🧠',
      message: 'Your data is being sent to advertising networks for profile building',
      type: 'warning',
    });
  }

  if (props.carbonGrams > 0.5) {
    alerts.push({
      id: 'carbon',
      emoji: '🌱',
      message: `High carbon footprint detected — ${props.carbonGrams.toFixed(2)}g CO₂ from this page alone`,
      type: 'warning',
    });
  }

  if (props.healthAlert) {
    alerts.push({
      id: 'health',
      emoji: '🔒',
      message: 'Sensitive health data detected — enhanced privacy protections activated',
      type: 'danger',
    });
  }

  if (props.privacyScore < 40) {
    alerts.push({
      id: 'risky',
      emoji: '⚠️',
      message: `Privacy score is critically low (${props.privacyScore}/100) — immediate action recommended`,
      type: 'danger',
    });
  }

  if (props.domainCount > 15) {
    alerts.push({
      id: 'domains',
      emoji: '📡',
      message: `${props.domainCount} external domains contacted — your data is widely shared`,
      type: 'info',
    });
  }

  return alerts;
}

export default function InsightAlerts({
  trackerCount,
  domainCount,
  carbonGrams,
  privacyScore,
  healthAlert,
  sessionActive,
}: InsightAlertsProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<InsightAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionActive) {
      setVisibleAlerts((prev) => (prev.length === 0 ? prev : []));
      setDismissed((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    const allAlerts = generateAlerts({
      trackerCount,
      domainCount,
      carbonGrams,
      privacyScore,
      healthAlert,
      sessionActive,
    });

    const undismissed = allAlerts.filter((a) => !dismissed.has(a.id));
    setVisibleAlerts(undismissed);
  }, [trackerCount, domainCount, carbonGrams, privacyScore, healthAlert, sessionActive, dismissed]);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none w-full max-w-xl px-4">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            className={`pointer-events-auto w-full rounded-2xl border bg-gradient-to-r backdrop-blur-xl px-5 py-3.5 ${TYPE_STYLES[alert.type]}`}
            style={{ boxShadow: TYPE_GLOW[alert.type] }}
          >
            <div className="flex items-center gap-3">
              <span className="min-w-5 shrink-0 text-center text-xs font-bold">
                {alert.emoji}
              </span>
              <p className="text-sm font-medium flex-1 leading-relaxed">{alert.message}</p>
              <button
                onClick={() => {
                  setDismissed((prev) => new Set(prev).add(alert.id));
                  setVisibleAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                }}
                className="shrink-0 ml-2 text-white/40 hover:text-white/80 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
