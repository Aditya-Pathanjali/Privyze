'use client';

import { AggregatedDomain, NetworkRequest } from '@/lib/types';
import { UI_COLORS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface DataFlowPanelProps {
  domains: AggregatedDomain[];
  requests: NetworkRequest[];
  selectedDomain: AggregatedDomain | null;
  onSelectDomain: (domain: AggregatedDomain) => void;
  blockedDomains: Set<string>;
  onToggleDomainBlock: (domain: string, blocked: boolean) => void;
}

function getColorForClassification(classification: string) {
  const key = classification.toUpperCase() as keyof typeof UI_COLORS;
  return UI_COLORS[key] || UI_COLORS.OTHER;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DataFlowPanel({
  domains,
  requests,
  selectedDomain,
  onSelectDomain,
  blockedDomains,
  onToggleDomainBlock,
}: DataFlowPanelProps) {
  const visibleRequests = selectedDomain
    ? requests.filter((r) => r.domain === selectedDomain.domain).slice(-8).reverse()
    : requests.slice(-8).reverse();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Network Monitoring
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-200">
              Outbound requests in real time
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 dot-pulse" />
            <span className="text-xs font-medium text-slate-500">Live</span>
          </div>
        </div>
      </div>

      <div className="grid min-h-[34rem] xl:grid-cols-[1.05fr,0.95fr]">
        {/* Domains list */}
        <div className="border-b border-white/[0.06] xl:border-b-0 xl:border-r xl:border-white/[0.06]">
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">{domains.length} domains observed</span>
          </div>
          <div className="max-h-[32rem] overflow-y-auto px-3 pb-3">
            {domains.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <div className="mx-auto h-6 w-6 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                <p className="mt-3 text-sm text-slate-600">
                  Waiting for network activity…
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {domains.map((domain, index) => {
                  const isBlocked = blockedDomains.has(domain.domain);
                  const isSelected = selectedDomain?.domain === domain.domain;

                  return (
                    <motion.div
                      key={domain.domain}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`mb-2 rounded-xl border px-4 py-3 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-purple-500/30 bg-purple-500/[0.08] shadow-[0_0_15px_rgba(139,92,246,0.06)]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                      }`}
                      onClick={() => onSelectDomain(domain)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getColorForClassification(domain.classification) }}
                            />
                            <span className="truncate text-sm font-medium text-slate-200">
                              {domain.domain}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="font-mono">{domain.requestCount} req</span>
                            <span className="font-mono">{formatSize(domain.totalSize)}</span>
                            <span>{domain.isThirdParty ? '3rd party' : '1st party'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {domain.isTracker && (
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                              Tracker
                            </span>
                          )}
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleDomainBlock(domain.domain, !isBlocked);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                              isBlocked
                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : 'border border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:border-white/20'
                            }`}
                          >
                            {isBlocked ? '✓ Blocked' : 'Block'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Request details */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Request Details
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-200">
                {selectedDomain ? selectedDomain.domain : 'Select a domain'}
              </h3>
            </div>
            {selectedDomain && (
              <div className="flex flex-wrap gap-1">
                {selectedDomain.types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-400"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {visibleRequests.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
              <svg className="mx-auto w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-3 text-sm text-slate-600">
                Select a domain to inspect its request timeline.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleRequests.map((request, index) => (
                  <motion.div
                    key={`${request.url}-${request.timestamp}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded">
                        {request.type}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatSize(request.size)}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-[11px] leading-5 text-slate-500 font-mono">
                      {request.url}
                    </p>
                    <p className="mt-1.5 text-[10px] font-medium text-slate-600">
                      {request.isThirdParty ? '↗ Third-party request' : '↩ First-party request'}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
