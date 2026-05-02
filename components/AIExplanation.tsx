'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AggregatedDomain } from '@/lib/types';

interface AIExplanationProps {
  domain: AggregatedDomain;
  accessibilityMode: boolean;
}

interface ExplanationResponse {
  explanation: string;
  source: 'gemini' | 'local';
  confidence: 'high' | 'medium';
}

function toneLabel(domain: AggregatedDomain) {
  if (domain.classification === 'ads') return 'Advertising';
  if (domain.classification === 'analytics') return 'Analytics';
  if (domain.classification === 'tracker') return 'Tracking';
  if (domain.classification === 'api') return 'Site feature';
  if (domain.classification === 'cdn') return 'Content delivery';
  return 'General request';
}

function toneIcon(domain: AggregatedDomain) {
  if (domain.classification === 'ads') return '📢';
  if (domain.classification === 'analytics') return '📊';
  if (domain.classification === 'tracker') return '⚠️';
  if (domain.classification === 'api') return '⚙️';
  if (domain.classification === 'cdn') return '📦';
  return '🔍';
}

function toneColor(domain: AggregatedDomain) {
  if (['ads', 'tracker'].includes(domain.classification)) return 'border-red-500/20 bg-red-500/10 text-red-400';
  if (domain.classification === 'analytics') return 'border-amber-500/20 bg-amber-500/10 text-amber-400';
  return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
}

function getRiskLevel(domain: AggregatedDomain): { level: 'High' | 'Medium' | 'Low'; color: string; bgColor: string } {
  if (['ads', 'tracker'].includes(domain.classification)) {
    return { level: 'High', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' };
  }
  if (domain.classification === 'analytics') {
    return { level: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' };
  }
  return { level: 'Low', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' };
}

function getConsequence(domain: AggregatedDomain): string {
  if (domain.classification === 'tracker') {
    return 'If not blocked, this tracker will continue to monitor your browsing behavior across multiple websites, building a detailed profile of your interests, habits, and online identity for targeted advertising.';
  }
  if (domain.classification === 'ads') {
    return 'Without blocking, this advertising service will serve targeted ads based on your browsing history and personal data, potentially exposing sensitive information to third-party advertisers.';
  }
  if (domain.classification === 'analytics') {
    return 'If left unblocked, this analytics service will collect detailed usage data including page views, click patterns, session duration, and device information, which may be shared with third parties.';
  }
  if (domain.isThirdParty) {
    return 'This third-party service has access to your browsing context. While not classified as a tracker, it could potentially collect data about your visit.';
  }
  return 'This is a standard first-party resource. It is necessary for the website to function correctly and poses minimal privacy risk.';
}

function getWhatItIs(domain: AggregatedDomain): string {
  if (domain.classification === 'tracker')
    return `A tracking service embedded in this webpage that monitors user behavior.`;
  if (domain.classification === 'ads')
    return `An advertising network that serves targeted ads to visitors.`;
  if (domain.classification === 'analytics')
    return `An analytics platform that collects usage and behavioral data.`;
  if (domain.classification === 'cdn')
    return `A content delivery network that serves static assets like images and scripts.`;
  if (domain.classification === 'api')
    return `A functional API endpoint used by the website for features and data.`;
  return `A web service contacted by the page during loading.`;
}

function getWhatItDoes(domain: AggregatedDomain): string {
  if (domain.classification === 'tracker')
    return `Monitors your browsing behavior across websites and builds a detailed advertising profile about your interests, demographics, and online habits.`;
  if (domain.classification === 'ads')
    return `Delivers personalized advertisements based on your browsing history, search queries, and behavioral patterns collected across the web.`;
  if (domain.classification === 'analytics')
    return `Records detailed metrics about how you interact with the page — including clicks, scroll depth, session duration, and navigation patterns.`;
  if (domain.classification === 'cdn')
    return `Delivers cached copies of website resources from servers geographically close to you for faster load times.`;
  if (domain.classification === 'api')
    return `Provides backend functionality to the website such as authentication, data fetching, or real-time updates.`;
  return `Provides resources or services needed for the website to render and function correctly.`;
}

export default function AIExplanation({
  domain,
  accessibilityMode,
}: AIExplanationProps) {
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const risk = getRiskLevel(domain);
  const consequence = getConsequence(domain);
  const whatItIs = getWhatItIs(domain);
  const whatItDoes = getWhatItDoes(domain);

  useEffect(() => {
    const controller = new AbortController();

    const fetchExplanation = async () => {
      setLoading(true);
      setError('');
      setResult(null);
      setDisplayedText('');
      setIsTyping(false);

      try {
        const response = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: domain.domain,
            requestType: domain.types[0] || 'unknown',
            sizeKB: Math.round(domain.totalSize / 1024),
            isFirstParty: !domain.isThirdParty,
            classification: domain.classification,
            accessibilityMode,
          }),
          signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch explanation');
        }

        setResult(data);
        // Start typing animation
        setIsTyping(true);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError('We could not generate the explanation for this request.');
        console.error(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchExplanation();

    return () => {
      controller.abort();
    };
  }, [domain.domain, accessibilityMode]);

  // Typing animation
  useEffect(() => {
    if (!result?.explanation || !isTyping) return;

    const text = result.explanation;
    let i = 0;
    const interval = setInterval(() => {
      i += 2; // Type 2 characters at a time for speed
      if (i >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, i));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [result, isTyping]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs">🤖</span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                AI Insights
              </p>
            </div>
            <h2 className="mt-1 text-base font-semibold text-slate-200">
              {domain.domain}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Risk badge */}
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${risk.bgColor} ${risk.color}`}>
              {risk.level} Risk
            </span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneColor(domain)}`}>
              {toneIcon(domain)} {toneLabel(domain)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="h-3 w-full skeleton" />
              <div className="h-3 w-4/5 skeleton" />
              <div className="h-3 w-3/5 skeleton" />
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <div className="h-4 w-4 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                AI is analyzing this domain…
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Structured explanation cards */}
              <div className="space-y-2">
                <ExplainCard
                  label="What it is"
                  icon="🔎"
                  text={whatItIs}
                  delay={0}
                  accessibilityMode={accessibilityMode}
                />
                <ExplainCard
                  label="What it does"
                  icon="⚡"
                  text={whatItDoes}
                  delay={0.1}
                  accessibilityMode={accessibilityMode}
                />
                <ExplainCard
                  label="Why it matters"
                  icon="🎯"
                  text={consequence}
                  delay={0.2}
                  accessibilityMode={accessibilityMode}
                  highlight={risk.level !== 'Low'}
                />
              </div>

              {/* AI response bubble */}
              <div className="rounded-xl border border-purple-500/10 bg-purple-500/[0.04] px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px]">🧠</span>
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">
                    AI Analysis
                  </span>
                </div>
                <p
                  className={`leading-7 text-slate-300 ${accessibilityMode ? 'text-base' : 'text-sm'
                    } ${isTyping ? 'typing-cursor' : ''}`}
                >
                  {displayedText || result.explanation}
                </p>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Ownership',
                    value: domain.isThirdParty ? 'Third-party' : 'First-party',
                    icon: domain.isThirdParty ? '↗' : '↩',
                  },
                  {
                    label: 'Transfer',
                    value: `${Math.round(domain.totalSize / 1024)} KB`,
                    icon: '📊',
                  },
                  {
                    label: 'Source',
                    value: result.source === 'gemini' ? 'AI model' : 'Rule-based',
                    icon: result.source === 'gemini' ? '🧠' : '📋',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {item.icon} {item.label}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-300">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-600"
            >
              Select a request to see what it means in plain language.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function ExplainCard({
  label,
  icon,
  text,
  delay,
  accessibilityMode,
  highlight = false,
}: {
  label: string;
  icon: string;
  text: string;
  delay: number;
  accessibilityMode: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-xl border px-4 py-3 ${
        highlight
          ? 'border-red-500/10 bg-red-500/[0.03]'
          : 'border-white/[0.04] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <p className={`leading-6 text-slate-400 ${accessibilityMode ? 'text-sm' : 'text-xs'}`}>
        {text}
      </p>
    </motion.div>
  );
}
