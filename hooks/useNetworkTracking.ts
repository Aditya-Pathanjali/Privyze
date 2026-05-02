'use client';

import { useMemo } from 'react';
import { AggregatedDomain, NetworkRequest } from '@/lib/types';
import { CarbonService } from '@/lib/services/carbon';

export function useNetworkTracking(
  domains: AggregatedDomain[],
  blockedDomains: Set<string>,
  blockedRequests: NetworkRequest[]
) {
  return useMemo(() => {
    const currentSize = domains.reduce((sum, domain) => sum + domain.totalSize, 0);
    const blockedSize = blockedRequests.reduce(
      (sum, request) => sum + request.size,
      0
    );
    const totalObservedSize = currentSize + blockedSize;

    const trackerDomains = domains.filter((domain) => domain.isTracker);
    const trackerCount = trackerDomains.length;

    const blockedTrackerSize = blockedRequests.reduce((sum, request) => {
      return blockedDomains.has(request.domain) ? sum + request.size : sum;
    }, 0);

    const beforeCarbon = CarbonService.calculateCarbon(totalObservedSize / 1024);
    const afterCarbon = CarbonService.calculateCarbon(currentSize / 1024);

    return {
      currentSize,
      totalObservedSize,
      trackerCount,
      beforeCarbon,
      afterCarbon,
      blockedTrackerSize,
      reductionPercent: CarbonService.calculateReduction(beforeCarbon, afterCarbon),
      topTrackers: trackerDomains.slice().sort((a, b) => b.totalSize - a.totalSize).slice(0, 5),
    };
  }, [blockedDomains, blockedRequests, domains]);
}
