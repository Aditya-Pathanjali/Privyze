'use client';

import { useMemo } from 'react';
import { AggregatedDomain } from '@/lib/types';

export interface PrivacyScoreResult {
  score: number;
  label: 'Safe' | 'Moderate' | 'Risky';
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  breakdown: {
    trackerPenalty: number;
    thirdPartyPenalty: number;
    dataSizePenalty: number;
  };
}

export function usePrivacyScore(
  domains: AggregatedDomain[],
  currentSize: number,
  blockedDomains: Set<string>
): PrivacyScoreResult {
  return useMemo(() => {
    // Start at 100, subtract penalties
    let score = 100;

    // Tracker penalty: -8 per active tracker (not blocked)
    const activeTrackers = domains.filter(
      (d) => d.isTracker && !blockedDomains.has(d.domain)
    );
    const trackerPenalty = Math.min(40, activeTrackers.length * 8);
    score -= trackerPenalty;

    // Third-party penalty: -2 per third-party domain (max 30)
    const thirdPartyCount = domains.filter(
      (d) => d.isThirdParty && !blockedDomains.has(d.domain)
    ).length;
    const thirdPartyPenalty = Math.min(30, thirdPartyCount * 2);
    score -= thirdPartyPenalty;

    // Data size penalty: -1 per 100KB transferred (max 30)
    const sizeKB = currentSize / 1024;
    const dataSizePenalty = Math.min(30, Math.floor(sizeKB / 100));
    score -= dataSizePenalty;

    score = Math.max(0, Math.min(100, score));

    let label: PrivacyScoreResult['label'];
    let color: string;
    let bgColor: string;
    let borderColor: string;
    let emoji: string;

    if (score >= 80) {
      label = 'Safe';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-500/10';
      borderColor = 'border-emerald-500/20';
      emoji = '🟢';
    } else if (score >= 40) {
      label = 'Moderate';
      color = 'text-amber-400';
      bgColor = 'bg-amber-500/10';
      borderColor = 'border-amber-500/20';
      emoji = '🟡';
    } else {
      label = 'Risky';
      color = 'text-red-400';
      bgColor = 'bg-red-500/10';
      borderColor = 'border-red-500/20';
      emoji = '🔴';
    }

    return {
      score,
      label,
      color,
      bgColor,
      borderColor,
      emoji,
      breakdown: {
        trackerPenalty,
        thirdPartyPenalty,
        dataSizePenalty,
      },
    };
  }, [domains, currentSize, blockedDomains]);
}
