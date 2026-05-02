'use client';

import { motion } from 'framer-motion';
import { PrivacyScoreResult } from '@/hooks/usePrivacyScore';

interface PrivacyScoreProps {
  score: PrivacyScoreResult;
}

export default function PrivacyScore({ score }: PrivacyScoreProps) {
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score.score / 100) * circumference;

  const strokeColor =
    score.score >= 80
      ? '#10b981'
      : score.score >= 40
        ? '#f59e0b'
        : '#ef4444';

  const glowColor =
    score.score >= 80
      ? 'rgba(16,185,129,0.3)'
      : score.score >= 40
        ? 'rgba(245,158,11,0.3)'
        : 'rgba(239,68,68,0.3)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`glass-panel overflow-hidden border ${score.borderColor}`}
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-5">
          {/* Circular progress */}
          <div className="relative shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={strokeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
              />
            </svg>
            {/* Score number in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className={`text-2xl font-bold ${score.color} font-mono`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {score.score}
              </motion.span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                /100
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-widest ${score.color}`}>
                Privacy Score
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${score.bgColor} ${score.color} border ${score.borderColor}`}>
                {score.emoji} {score.label}
              </span>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2 mt-3">
              <BreakdownBar
                label="Trackers"
                value={score.breakdown.trackerPenalty}
                max={40}
                color="bg-red-500"
              />
              <BreakdownBar
                label="Third-party"
                value={score.breakdown.thirdPartyPenalty}
                max={30}
                color="bg-amber-500"
              />
              <BreakdownBar
                label="Data size"
                value={score.breakdown.dataSizePenalty}
                max={30}
                color="bg-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-16 shrink-0 font-medium">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          style={{ opacity: 0.7 }}
        />
      </div>
      <span className="text-[10px] text-slate-600 w-6 text-right font-mono">
        -{value}
      </span>
    </div>
  );
}
