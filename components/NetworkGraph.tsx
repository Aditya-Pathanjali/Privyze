'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { NetworkRequest } from '@/lib/types';

interface NetworkGraphProps {
  requests: NetworkRequest[];
}

interface DataPoint {
  time: number;
  size: number;
  label: string;
}

export default function NetworkGraph({ requests }: NetworkGraphProps) {
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 200 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track history of data points
  useEffect(() => {
    const now = Date.now();
    const totalSize = requests.reduce((sum, r) => sum + r.size, 0);
    setPoints((prev) => {
      const next = [...prev, { time: now, size: totalSize, label: `${Math.round(totalSize / 1024)} KB` }];
      // Keep last 30 points
      return next.slice(-30);
    });
  }, [requests]);

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
            Data transfer over time
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            High
          </span>
        </div>
      </div>

      <div className="px-5 py-4">
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
      </div>
    </motion.div>
  );
}
