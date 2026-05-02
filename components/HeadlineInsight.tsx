'use client';

import { motion } from 'framer-motion';

interface HeadlineInsightProps {
  trackerCount: number;
  domainCount: number;
  carbonGrams: number;
  blockedCount: number;
  reductionPercent: number;
  privacyScore: number;
}

function getAverageCarbon(): number {
  // Average website CO2: ~0.5g (source: HTTP Archive / websitecarbon.com)
  return 0.5;
}

export default function HeadlineInsight({
  trackerCount,
  domainCount,
  carbonGrams,
  blockedCount,
  reductionPercent,
  privacyScore,
}: HeadlineInsightProps) {
  const avgCarbon = getAverageCarbon();
  const carbonMultiplier = avgCarbon > 0 ? (carbonGrams / avgCarbon).toFixed(1) : '0';
  const isHighCarbon = carbonGrams > avgCarbon;

  // Generate the most impactful headline
  let headline = '';

  if (blockedCount > 0 && reductionPercent > 0) {
    headline = `Blocking removed ${reductionPercent}% of unnecessary data transfer${trackerCount > 0 ? ` and neutralized ${trackerCount} tracker${trackerCount > 1 ? 's' : ''}` : ''}.`;
  } else if (trackerCount > 0 && isHighCarbon) {
    headline = `This page sent your data to ${trackerCount} tracking service${trackerCount > 1 ? 's' : ''} and generated ${carbonMultiplier}× more emissions than the average website.`;
  } else if (trackerCount > 0) {
    headline = `This page contains ${trackerCount} tracker${trackerCount > 1 ? 's' : ''} across ${domainCount} domains monitoring your browsing activity.`;
  } else if (isHighCarbon) {
    headline = `This page generates ${carbonMultiplier}× more CO₂ than the average website — heavy assets detected.`;
  } else if (domainCount > 0) {
    headline = `Analysis complete: ${domainCount} domains observed with a privacy score of ${privacyScore}/100.`;
  } else {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-purple-500/15 bg-gradient-to-r from-purple-500/[0.06] via-blue-500/[0.04] to-purple-500/[0.06] px-6 py-4"
    >
      {/* Subtle animated shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'linear' }}
      />
      <div className="relative flex items-start gap-3">
        <motion.span
          className="text-lg shrink-0 mt-0.5"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          🎯
        </motion.span>
        <div>
          <p className="text-sm font-semibold text-slate-200 leading-relaxed">
            {headline}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Powered by real-time network analysis
          </p>
        </div>
      </div>
    </motion.div>
  );
}
