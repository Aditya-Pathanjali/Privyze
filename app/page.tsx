'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import CommandBar from '@/components/CommandBar';
import LiveMetrics from '@/components/LiveMetrics';
import NetworkGraph from '@/components/NetworkGraph';
import SandboxView from '@/components/SandboxView';
import DataFlowPanel from '@/components/DataFlowPanel';
import FlowVisualization from '@/components/FlowVisualization';
import AIExplanation from '@/components/AIExplanation';
import CarbonMeter from '@/components/CarbonMeter';
import ControlsPanel from '@/components/ControlsPanel';
import { useBrowserPod } from '@/hooks/useBrowserPod';
import { useNetworkTracking } from '@/hooks/useNetworkTracking';

function setsMatch(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockTrackers, setBlockTrackers] = useState(false);
  const [blockThirdParty, setBlockThirdParty] = useState(false);
  const [disableScripts, setDisableScripts] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [manuallyBlockedDomains, setManuallyBlockedDomains] = useState<Set<string>>(
    new Set()
  );

  const {
    sessionId,
    isLoading,
    domains,
    requests,
    blockedRequests,
    selectedDomain,
    selectDomain,
    healthAlert,
    error,
    mode,
    title,
    blockedCount,
    blockedDomains: appliedBlockedDomains,
    blockedResourceTypes,
    previewImage,
  } = useBrowserPod(url);

  const desiredBlockedDomains = useMemo(() => {
    const next = new Set(manuallyBlockedDomains);
    for (const domain of domains) {
      if (blockTrackers && domain.isTracker) {
        next.add(domain.domain);
      }
      if (blockThirdParty && domain.isThirdParty) {
        next.add(domain.domain);
      }
    }
    return next;
  }, [blockThirdParty, blockTrackers, domains, manuallyBlockedDomains]);

  const appliedBlockedDomainSet = useMemo(
    () => new Set(appliedBlockedDomains),
    [appliedBlockedDomains]
  );
  const scriptsBlocked = blockedResourceTypes.includes('script');

  const {
    currentSize,
    totalObservedSize,
    trackerCount,
    reductionPercent,
  } = useNetworkTracking(domains, appliedBlockedDomainSet, blockedRequests);

  const blockedSize = blockedRequests.reduce((sum, request) => sum + request.size, 0);

  useEffect(() => {
    setManuallyBlockedDomains(new Set());
    setBlockTrackers(false);
    setBlockThirdParty(false);
    setDisableScripts(false);
  }, [sessionId]);

  useEffect(() => {
    if (!healthAlert || !sessionId) {
      return;
    }

    setBlockTrackers(true);
    setBlockThirdParty(true);
  }, [healthAlert, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const shouldUpdateDomains = !setsMatch(
      desiredBlockedDomains,
      appliedBlockedDomainSet
    );
    const shouldUpdateScripts = disableScripts !== scriptsBlocked;

    if (!shouldUpdateDomains && !shouldUpdateScripts) {
      return;
    }

    const applyBlocking = async () => {
      setIsBlocking(true);
      try {
        if (shouldUpdateDomains) {
          const domainsToBlock = Array.from(desiredBlockedDomains).filter(
            (domain) => !appliedBlockedDomainSet.has(domain)
          );
          const domainsToUnblock = Array.from(appliedBlockedDomainSet).filter(
            (domain) => !desiredBlockedDomains.has(domain)
          );

          if (domainsToBlock.length > 0) {
            await fetch('/api/block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                domains: domainsToBlock,
                resourceTypes: [],
                unblock: false,
              }),
            });
          }

          if (domainsToUnblock.length > 0) {
            await fetch('/api/block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                domains: domainsToUnblock,
                resourceTypes: [],
                unblock: true,
              }),
            });
          }
        }

        if (shouldUpdateScripts) {
          await fetch('/api/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              domains: [],
              resourceTypes: ['script'],
              unblock: !disableScripts,
            }),
          });
        }
      } catch (blockError) {
        console.error(blockError);
      } finally {
        setIsBlocking(false);
      }
    };

    void applyBlocking();
  }, [
    appliedBlockedDomainSet,
    desiredBlockedDomains,
    disableScripts,
    scriptsBlocked,
    sessionId,
  ]);

  const handleToggleDomainBlock = (domain: string, blocked: boolean) => {
    setManuallyBlockedDomains((current) => {
      const next = new Set(current);
      if (blocked) {
        next.add(domain);
      } else {
        next.delete(domain);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setManuallyBlockedDomains(new Set());
    setBlockTrackers(false);
    setBlockThirdParty(false);
    setDisableScripts(false);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero + Command bar */}
      <Hero>
        <CommandBar
          onSubmit={setUrl}
          isLoading={isLoading}
          initialValue={url}
          error={error && !sessionId ? error : undefined}
        />
      </Hero>

      {/* Dashboard */}
      <AnimatePresence mode="wait">
        {sessionId ? (
          <motion.main
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-7xl px-4 pb-16 sm:px-6"
          >
            {/* Health alert */}
            {healthAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-300"
              >
                🏥 Health-related content detected. Accessibility mode enabled and stricter privacy defaults applied automatically.
              </motion.div>
            )}

            {/* Live Metrics Row */}
            <section className="mb-6">
              <LiveMetrics
                domains={domains.length}
                trackerCount={trackerCount}
                currentSizeKB={Math.round(currentSize / 1024)}
                totalSizeKB={Math.round(totalObservedSize / 1024)}
                blockedSizeKB={Math.round(blockedSize / 1024)}
                blockedCount={blockedCount}
                reductionPercent={reductionPercent}
              />
            </section>

            {/* Real-time Graph + Flow Viz */}
            <section className="mb-6 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
              <NetworkGraph requests={requests} />
              <FlowVisualization
                url={url}
                domains={domains}
                blockedDomains={appliedBlockedDomainSet}
              />
            </section>

            {/* Main content grid */}
            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              {/* Left column */}
              <div className="space-y-6">
                <SandboxView
                  url={url}
                  title={title}
                  mode={mode}
                  isLoading={isLoading}
                  error={error}
                  previewImage={previewImage}
                />

                <DataFlowPanel
                  domains={domains}
                  requests={requests}
                  selectedDomain={selectedDomain}
                  onSelectDomain={selectDomain}
                  blockedDomains={appliedBlockedDomainSet}
                  onToggleDomainBlock={handleToggleDomainBlock}
                />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {selectedDomain ? (
                  <AIExplanation
                    domain={selectedDomain}
                    accessibilityMode={accessibilityMode}
                  />
                ) : (
                  <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-panel px-5 py-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🤖</span>
                      <div>
                        <p className="text-sm font-medium text-slate-300">AI Insights</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Select a domain from the network panel to read a plain-language explanation.
                        </p>
                      </div>
                    </div>
                  </motion.section>
                )}

                <CarbonMeter
                  currentSize={currentSize}
                  totalObservedSize={totalObservedSize}
                  blockedSize={blockedSize}
                />

                <ControlsPanel
                  blockTrackers={blockTrackers}
                  blockThirdParty={blockThirdParty}
                  disableScripts={disableScripts}
                  isBlocking={isBlocking}
                  trackerCount={trackerCount}
                  blockedCount={blockedCount}
                  healthAlert={healthAlert}
                  onBlockTrackersChange={setBlockTrackers}
                  onBlockThirdPartyChange={setBlockThirdParty}
                  onDisableScriptsChange={setDisableScripts}
                  accessibilityMode={accessibilityMode}
                  onAccessibilityModeChange={setAccessibilityMode}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
          </motion.main>
        ) : (
          !isLoading && (
            <motion.main
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
            >
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  {
                    step: '01',
                    title: 'Sandbox Execution',
                    description: 'Sites are executed in a contained browser session instead of directly in the interface.',
                    icon: '🔒',
                  },
                  {
                    step: '02',
                    title: 'Real-time Monitoring',
                    description: 'Requests, domains, types, and estimated transfer sizes are surfaced as the page loads.',
                    icon: '📡',
                  },
                  {
                    step: '03',
                    title: 'Explanation & Control',
                    description: 'AI translates technical activity into plain language while filters re-run the site safely.',
                    icon: '🧠',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="glass-panel card-hover p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                        Step {item.step}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.main>
          )
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              Privyze
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-600">
              Privacy intelligence platform
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Powered by BrowserPod · Real-time analysis
          </p>
        </div>
      </footer>
    </div>
  );
}
