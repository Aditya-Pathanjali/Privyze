'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkRequest } from '@/lib/types';
import { KNOWN_TRACKERS } from '@/lib/constants';

interface NetworkGraphProps {
  requests: NetworkRequest[];
}

interface DataPoint {
  time: number;
  size: number;
  label: string;
}

interface DomainNode {
  domain: string;
  size: number;
  requestCount: number;
  isTracker: boolean;
  isThirdParty: boolean;
  x: number;
  y: number;
  category: 'tracker' | 'unknown' | 'safe';
}

function isDomainTracker(domain: string): boolean {
  return KNOWN_TRACKERS.some(
    (t) => domain === t || domain.endsWith(`.${t}`)
  );
}

function getDomainCategory(domain: string, isThirdParty: boolean): 'tracker' | 'unknown' | 'safe' {
  if (isDomainTracker(domain)) return 'tracker';
  if (isThirdParty) return 'unknown';
  return 'safe';
}

function getCategoryColor(cat: 'tracker' | 'unknown' | 'safe'): string {
  if (cat === 'tracker') return '#ef4444';
  if (cat === 'unknown') return '#f59e0b';
  return '#10b981';
}

function getCategoryTooltip(cat: 'tracker' | 'unknown' | 'safe'): string {
  if (cat === 'tracker') return 'This domain collects behavioral data and builds advertising profiles';
  if (cat === 'unknown') return 'Third-party domain with unverified data practices';
  return 'Verified first-party or safe resource domain';
}

export default function NetworkGraph({ requests }: NetworkGraphProps) {
  const [dimensions, setDimensions] = useState({ width: 600, height: 200 });
  const [hoveredNode, setHoveredNode] = useState<DomainNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'nodes'>('graph');
  const containerRef = useRef<HTMLDivElement>(null);

  const points = useMemo<DataPoint[]>(() => {
    const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    const sampled: DataPoint[] = [];
    let runningSize = 0;
    const stride = Math.max(1, Math.ceil(sorted.length / 30));

    sorted.forEach((request, index) => {
      runningSize += request.size;
      if (index % stride === 0 || index === sorted.length - 1) {
        sampled.push({
          time: request.timestamp || index,
          size: runningSize,
          label: `${Math.round(runningSize / 1024)} KB`,
        });
      }
    });

    return sampled;
  }, [requests]);

  // Build domain nodes for node view
  const domainNodes: DomainNode[] = (() => {
    const map = new Map<string, { size: number; count: number; isThirdParty: boolean }>();
    requests.forEach((r) => {
      const existing = map.get(r.domain) || { size: 0, count: 0, isThirdParty: r.isThirdParty };
      existing.size += r.size;
      existing.count += 1;
      map.set(r.domain, existing);
    });

    const entries = Array.from(map.entries()).slice(0, 20);
    const total = entries.length;

    return entries.map(([domain, data], i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 0.35;
      return {
        domain,
        size: data.size,
        requestCount: data.count,
        isTracker: isDomainTracker(domain),
        isThirdParty: data.isThirdParty,
        x: 0.5 + radius * Math.cos(angle),
        y: 0.5 + radius * Math.sin(angle),
        category: getDomainCategory(domain, data.isThirdParty),
      };
    });
  })();

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(180, Math.min(entry.contentRect.width * 0.35, 220)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxSize = Math.max(...points.map((p) => p.size), 1024);
  const minTime = points.length > 0 ? points[0].time : 0;
  const maxTime = points.length > 0 ? points[points.length - 1].time : 1;
  const timeRange = Math.max(maxTime - minTime, 1);

  const toX = (time: number) => padding.left + ((time - minTime) / timeRange) * chartW;
  const toY = (size: number) => padding.top + chartH - (size / maxSize) * chartH;

  // Create path
  const pathD = points
    .map((p, i) => {
      const x = toX(p.time);
      const y = toY(p.size);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Area fill path
  const areaD = points.length > 0
    ? `${pathD} L ${toX(points[points.length - 1].time)} ${padding.top + chartH} L ${toX(points[0].time)} ${padding.top + chartH} Z`
    : '';

  // Color based on traffic level
  const lastSize = points.length > 0 ? points[points.length - 1].size : 0;
  const intensity = lastSize / maxSize;
  const lineColor = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#10b981';
  const gradientId = 'graph-gradient';

  // Node view dimensions
  const nodeW = width;
  const nodeH = 280;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Real-Time Graph
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-200">
            {viewMode === 'graph' ? 'Data transfer over time' : 'Domain network map'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Trackers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Unknown
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Safe
            </span>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
            <button
              onClick={() => setViewMode('graph')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                viewMode === 'graph'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('nodes')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                viewMode === 'nodes'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Nodes
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {viewMode === 'graph' ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {points.length < 2 ? (
                <div className="flex h-[180px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                    <p className="mt-3 text-sm text-slate-500">Collecting data points…</p>
                  </div>
                </div>
              ) : (
                <svg width={width} height={height} className="overflow-visible">
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1={padding.left}
                      y1={padding.top + chartH * (1 - ratio)}
                      x2={padding.left + chartW}
                      y2={padding.top + chartH * (1 - ratio)}
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Y-axis labels */}
                  {[0, 0.5, 1].map((ratio) => (
                    <text
                      key={ratio}
                      x={padding.left - 8}
                      y={padding.top + chartH * (1 - ratio) + 4}
                      textAnchor="end"
                      className="fill-slate-600 text-[10px] font-mono"
                    >
                      {Math.round((maxSize * ratio) / 1024)} KB
                    </text>
                  ))}

                  {/* Area fill */}
                  <motion.path
                    d={areaD}
                    fill={`url(#${gradientId})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  />

                  {/* Line */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 6px ${lineColor}40)` }}
                  />

                  {/* Last point indicator */}
                  {points.length > 0 && (
                    <g>
                      <circle
                        cx={toX(points[points.length - 1].time)}
                        cy={toY(points[points.length - 1].size)}
                        r="4"
                        fill={lineColor}
                        className="dot-pulse"
                      />
                      <circle
                        cx={toX(points[points.length - 1].time)}
                        cy={toY(points[points.length - 1].size)}
                        r="8"
                        fill="none"
                        stroke={lineColor}
                        strokeWidth="1"
                        opacity="0.3"
                        className="dot-pulse-delayed"
                      />
                    </g>
                  )}
                </svg>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="nodes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {domainNodes.length === 0 ? (
                <div className="flex h-[280px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                    <p className="mt-3 text-sm text-slate-500">Waiting for domains…</p>
                  </div>
                </div>
              ) : (
                <svg width={nodeW} height={nodeH} className="overflow-visible">
                  <defs>
                    {/* Animated data flow pattern */}
                    <pattern id="flowPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="rgba(139,92,246,0.4)">
                        <animate attributeName="cx" from="0" to="8" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </pattern>
                  </defs>

                  {/* Center hub */}
                  <circle
                    cx={nodeW / 2}
                    cy={nodeH / 2}
                    r="20"
                    fill="rgba(139,92,246,0.15)"
                    stroke="rgba(139,92,246,0.4)"
                    strokeWidth="2"
                  />
                  <text
                    x={nodeW / 2}
                    y={nodeH / 2 + 4}
                    textAnchor="middle"
                    className="fill-purple-300 text-[10px] font-bold"
                  >
                    Site
                  </text>

                  {/* Connection lines with animated flow */}
                  {domainNodes.map((node, i) => {
                    const color = getCategoryColor(node.category);
                    return (
                      <g key={`line-${node.domain}`}>
                        <motion.line
                          x1={nodeW / 2}
                          y1={nodeH / 2}
                          x2={node.x * nodeW}
                          y2={node.y * nodeH}
                          stroke={color}
                          strokeWidth="1"
                          strokeOpacity="0.2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                        />
                        {/* Animated data flow dot */}
                        <circle r="2" fill={color} opacity="0.6">
                          <animateMotion
                            dur={`${1.5 + (i % 4) * 0.2}s`}
                            repeatCount="indefinite"
                            path={`M${nodeW / 2},${nodeH / 2} L${node.x * nodeW},${node.y * nodeH}`}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Domain nodes */}
                  {domainNodes.map((node, i) => {
                    const color = getCategoryColor(node.category);
                    const nodeRadius = Math.max(6, Math.min(14, Math.sqrt(node.size / 1024) * 2));
                    const isHovered = hoveredNode?.domain === node.domain;

                    return (
                      <g
                        key={node.domain}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <motion.circle
                          cx={node.x * nodeW}
                          cy={node.y * nodeH}
                          r={nodeRadius}
                          fill={color}
                          fillOpacity={isHovered ? 0.8 : 0.4}
                          stroke={color}
                          strokeWidth={isHovered ? 2 : 1}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                          style={{ filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                        />
                        {/* Domain label */}
                        <text
                          x={node.x * nodeW}
                          y={node.y * nodeH + nodeRadius + 12}
                          textAnchor="middle"
                          className={`text-[8px] font-medium ${isHovered ? 'fill-slate-200' : 'fill-slate-500'}`}
                        >
                          {node.domain.length > 18 ? node.domain.slice(0, 16) + '…' : node.domain}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Hover tooltip */}
              <AnimatePresence>
                {hoveredNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-xl border border-white/[0.1] bg-[#0d1117]/95 backdrop-blur-md px-4 py-3 shadow-xl max-w-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(hoveredNode.category) }}
                      />
                      <span className="text-xs font-semibold text-slate-200">{hoveredNode.domain}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {getCategoryTooltip(hoveredNode.category)}
                    </p>
                    <div className="flex gap-3 text-[10px] text-slate-500">
                      <span>{hoveredNode.requestCount} req</span>
                      <span>{(hoveredNode.size / 1024).toFixed(1)} KB</span>
                      <span className={`font-semibold ${
                        hoveredNode.category === 'tracker' ? 'text-red-400' :
                        hoveredNode.category === 'unknown' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {hoveredNode.category === 'tracker' ? '⚠ Tracker' :
                         hoveredNode.category === 'unknown' ? '? Unknown' :
                         '✓ Safe'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
