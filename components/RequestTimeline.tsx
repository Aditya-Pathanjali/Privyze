'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkRequest } from '@/lib/types';
import { KNOWN_TRACKERS } from '@/lib/constants';

interface RequestTimelineProps {
  requests: NetworkRequest[];
}

function isTracker(domain: string): boolean {
  return KNOWN_TRACKERS.some(
    (t) => domain === t || domain.endsWith(`.${t}`)
  );
}

function getTypeColor(type: string, domain: string): string {
  if (isTracker(domain)) return 'bg-red-500';
  if (type === 'script') return 'bg-amber-500';
  if (type === 'xhr' || type === 'fetch') return 'bg-blue-500';
  if (type === 'image') return 'bg-purple-500';
  if (type === 'stylesheet') return 'bg-cyan-500';
  if (type === 'document') return 'bg-emerald-500';
  return 'bg-slate-500';
}

function getTypeLabel(type: string, domain: string): string {
  if (isTracker(domain)) return 'Tracker';
  if (type === 'xhr' || type === 'fetch') return 'API Call';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RequestTimeline({ requests }: RequestTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sortedRequests = useMemo(() => {
    if (requests.length === 0) return [];
    const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sorted[0].timestamp;
    return sorted.map((r) => ({
      ...r,
      relativeTime: r.timestamp - startTime,
    }));
  }, [requests]);

  const visibleRequests = sortedRequests.slice(0, 30); // Limit for performance
  const maxTime = visibleRequests.length > 0
    ? visibleRequests[visibleRequests.length - 1].relativeTime
    : 1;

  const startPlayback = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlaybackIndex(0);

    let idx = 0;
    const play = () => {
      if (idx >= visibleRequests.length - 1) {
        setIsPlaying(false);
        setPlaybackIndex(-1);
        return;
      }
      idx++;
      setPlaybackIndex(idx);

      // Time between this and next request (capped)
      const delta = idx < visibleRequests.length - 1
        ? Math.min(visibleRequests[idx + 1].relativeTime - visibleRequests[idx].relativeTime, 500)
        : 300;

      setTimeout(play, Math.max(80, delta));
    };
    setTimeout(play, 200);
  };

  if (visibleRequests.length === 0) return null;

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
            <span className="text-sm">📈</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Timeline
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-200">
                Request replay
              </h2>
            </div>
          </div>

          <motion.button
            onClick={startPlayback}
            disabled={isPlaying}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-purple-500/20 text-purple-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <div className="h-3 w-3 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
                Replaying…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Replay
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="px-5 py-4 max-h-[24rem] overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[14px] top-2 bottom-2 w-px bg-white/[0.06]" />

          <AnimatePresence>
            {visibleRequests.map((request, index) => {
              const isActive = isPlaying && playbackIndex >= index;
              const isCurrentPlayback = isPlaying && playbackIndex === index;
              const isHovered = hoveredIndex === index;

              return (
                <motion.div
                  key={`${request.url}-${request.timestamp}-${index}`}
                  initial={isPlaying ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                  animate={{
                    opacity: isPlaying ? (isActive ? 1 : 0.2) : 1,
                    x: 0,
                    scale: isCurrentPlayback ? 1.01 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`relative flex items-start gap-3 py-2 pl-1 transition-all ${
                    isCurrentPlayback ? 'bg-purple-500/[0.04] -mx-2 px-3 rounded-lg' : ''
                  }`}
                >
                  {/* Dot */}
                  <div className="relative z-10 shrink-0 mt-1.5">
                    <div
                      className={`h-[9px] w-[9px] rounded-full ${getTypeColor(request.type, request.domain)} ${
                        isCurrentPlayback ? 'ring-2 ring-purple-400/50 ring-offset-1 ring-offset-[#0B0F14]' : ''
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono text-slate-400">
                        {formatTime(request.relativeTime)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isTracker(request.domain)
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
                      }`}>
                        {getTypeLabel(request.type, request.domain)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">
                        {request.size > 0 ? `${(request.size / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 truncate font-mono">
                      {request.domain}
                    </p>

                    {/* Tooltip on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                        >
                          <p className="text-[10px] text-slate-500 break-all font-mono leading-5">
                            {request.url}
                          </p>
                          <div className="mt-1.5 flex gap-3 text-[10px]">
                            <span className="text-slate-600">
                              {request.isThirdParty ? '↗ Third-party' : '↩ First-party'}
                            </span>
                            {isTracker(request.domain) && (
                              <span className="text-red-400 font-semibold">⚠ Tracking request</span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary footer */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500">
          <span>{visibleRequests.length} requests in {formatTime(maxTime)}</span>
          <span>
            {visibleRequests.filter((r) => isTracker(r.domain)).length} trackers detected
          </span>
        </div>
      </div>
    </motion.section>
  );
}
