'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CarbonService } from '@/lib/services/carbon';
import { NetworkService } from '@/lib/services/network';
import {
  BROWSERPOD_ANALYZER_SCRIPT,
  BrowserPodOnlyResult,
  BrowserPodRunState,
  initialBrowserPodRunState,
  parseBrowserPodResult,
} from '@/lib/browserpod-only/analysis';

type BrowserPodModule = {
  BrowserPod: {
    boot: (options: {
      apiKey: string;
      nodeVersion?: string;
      storageKey?: string;
    }) => Promise<any>;
  } | null;
};

const apiKey = process.env.NEXT_PUBLIC_BROWSERPOD_API_KEY || '';

function isCrossOriginIsolated() {
  return typeof window !== 'undefined' && window.crossOriginIsolated;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function timeout(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForResult(
  getLogs: () => string[],
  runId: string,
  timeoutMs = 20000
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = parseBrowserPodResult(getLogs(), runId);
    if (result) return result;
    await timeout(120);
  }
  throw new Error('BrowserPod analyzer did not return a result in time.');
}

export default function BrowserPodOnlyApp() {
  const [url, setUrl] = useState('https://example.com');
  const [blockedDomains, setBlockedDomains] = useState<Set<string>>(new Set());
  const [state, setState] = useState<BrowserPodRunState>(initialBrowserPodRunState);
  const podRef = useRef<any>(null);
  const podBootPromiseRef = useRef<Promise<any> | null>(null);
  const analyzerReadyRef = useRef(false);
  const terminalRef = useRef<any>(null);
  const terminalHostRef = useRef<HTMLDivElement | null>(null);
  const logsRef = useRef<string[]>([]);
  const portalsRef = useRef<string[]>([]);

  const carbonGrams = useMemo(() => {
    const currentSize = state.result?.totalSize ?? 0;
    return CarbonService.calculateCarbon(currentSize / 1024);
  }, [state.result]);

  const blockedCarbonGrams = useMemo(() => {
    const blockedSize = state.result?.blockedSize ?? 0;
    return CarbonService.calculateCarbon(blockedSize / 1024);
  }, [state.result]);

  const trackerDomains = state.result?.domains.filter((domain) => domain.isTracker) ?? [];

  const appendLog = (message: string) => {
    logsRef.current = [...logsRef.current, message].slice(-200);
    setState((current) => ({
      ...current,
      logs: logsRef.current,
    }));
  };

  const bootPod = (silent = false) => {
    if (podRef.current) return Promise.resolve(podRef.current);
    if (podBootPromiseRef.current) return podBootPromiseRef.current;
    if (!apiKey) {
      throw new Error('Set NEXT_PUBLIC_BROWSERPOD_API_KEY before running the BrowserPod-only demo.');
    }
    if (!isCrossOriginIsolated()) {
      throw new Error('BrowserPod requires cross-origin isolation. Check COOP/COEP headers on this page.');
    }

    if (!silent) {
      setState((current) => ({
        ...current,
        status: 'booting',
        message: 'Booting BrowserPod in this browser tab...',
        error: '',
      }));
    }

    podBootPromiseRef.current = (async () => {
      const { BrowserPod } = (await import('@leaningtech/browserpod')) as BrowserPodModule;
      if (!BrowserPod) {
        throw new Error('The BrowserPod runtime did not load.');
      }

      const pod = await BrowserPod.boot({
        apiKey,
        nodeVersion: '22',
        storageKey: 'privyze-browserpod-only',
      });
      pod.onPortal(({ url: portalUrl }: { url: string; port: number }) => {
        portalsRef.current = Array.from(new Set([...portalsRef.current, portalUrl]));
      });
      podRef.current = pod;
      if (!silent) {
        appendLog('BrowserPod booted successfully.');
      }
      return pod;
    })().catch((error) => {
      podBootPromiseRef.current = null;
      throw error;
    });

    return podBootPromiseRef.current;
  };

  const preparePod = async () => {
    const pod = await bootPod();
    const host = terminalHostRef.current;
    if (!host) throw new Error('Terminal host is unavailable.');

    if (!terminalRef.current) {
      terminalRef.current = await pod.createDefaultTerminal(host);
    }

    if (!analyzerReadyRef.current) {
      setState((current) => ({
        ...current,
        status: 'running',
        message: 'Installing analyzer in the BrowserPod filesystem...',
      }));
      const script = await pod.createFile('/privyze-analyze.js', 'utf-8');
      await script.write(BROWSERPOD_ANALYZER_SCRIPT);
      await script.close();
      analyzerReadyRef.current = true;
    }

    return { pod, terminal: terminalRef.current };
  };

  useEffect(() => {
    if (!apiKey || !isCrossOriginIsolated()) return;

    const timer = window.setTimeout(() => {
      void bootPod(true).then(async (pod) => {
        const host = terminalHostRef.current;
        if (!host || terminalRef.current) return;
        terminalRef.current = await pod.createDefaultTerminal(host);
      }).catch(() => undefined);
    }, 400);

    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async (event?: FormEvent) => {
    event?.preventDefault();
    logsRef.current = [];
    portalsRef.current = [];

    const validation = NetworkService.normalizeHttpUrl(url);
    if (!validation.url) {
      setState({
        ...initialBrowserPodRunState,
        status: 'error',
        message: 'The URL was not sent to BrowserPod.',
        error: validation.error || 'Enter a public HTTP or HTTPS website URL.',
      });
      return;
    }

    setState({
      ...initialBrowserPodRunState,
      status: 'running',
      message: 'Preparing analyzer inside BrowserPod...',
    });

    try {
      const host = terminalHostRef.current;
      if (!host) throw new Error('Terminal host is unavailable.');
      const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const observer = new MutationObserver(() => {
        const text = host.innerText.trim();
        if (text) {
          logsRef.current = text.split('\n').map((line) => line.trim()).filter(Boolean);
        }
      });
      observer.observe(host, { childList: true, subtree: true, characterData: true });

      const { pod, terminal } = await preparePod();

      setState((current) => ({
        ...current,
        status: 'running',
        message: 'Running privacy analysis inside the BrowserPod Node runtime...',
      }));

      await pod.run('node', [
        '/privyze-analyze.js',
        validation.url,
        Array.from(blockedDomains).join(','),
        runId,
      ], {
        terminal,
        echo: false,
      });

      const result = await waitForResult(() => logsRef.current, runId);
      observer.disconnect();

      setState({
        status: 'complete',
        message: 'Analysis completed inside BrowserPod. No Privyze API route was called.',
        result: {
          ...result,
          portalUrls: portalsRef.current,
        },
        error: '',
        logs: logsRef.current,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        message: 'BrowserPod analysis failed.',
        error: error instanceof Error ? error.message : 'Unknown BrowserPod error',
        logs: logsRef.current,
      }));
    }
  };

  const toggleBlockedDomain = (domain: string) => {
    setBlockedDomains((current) => {
      const next = new Set(current);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen gradient-bg px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="glass-panel px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                BrowserPod-only mode
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                Privyze running analysis inside the browser sandbox
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                This route boots the official BrowserPod runtime in the browser, writes
                a Node analyzer into the pod filesystem, and runs it there. It avoids
                the existing server-side Playwright API routes.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              {isCrossOriginIsolated() ? 'Cross-origin isolated' : 'Isolation missing'}
            </div>
          </div>

          <form onSubmit={runAnalysis} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              placeholder="https://example.com"
            />
            <button
              type="submit"
              disabled={state.status === 'booting' || state.status === 'running'}
              className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === 'booting' || state.status === 'running'
                ? 'Running in BrowserPod...'
                : 'Analyze with BrowserPod'}
            </button>
          </form>

          {!apiKey && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Add `NEXT_PUBLIC_BROWSERPOD_API_KEY` to your environment before demoing this route.
            </div>
          )}

          {state.error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </div>
          )}

          <p className="mt-4 text-sm text-slate-400">{state.message}</p>
        </section>

        {state.result && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="glass-panel overflow-hidden">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  BrowserPod analysis
                </p>
                <h2 className="mt-1 text-base font-semibold text-white">
                  {state.result.title || state.result.finalUrl}
                </h2>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-4">
                <Metric label="Domains" value={String(state.result.domains.length)} />
                <Metric label="Trackers" value={String(trackerDomains.length)} />
                <Metric label="Transfer" value={formatBytes(state.result.totalSize)} />
                <Metric label="CO2 estimate" value={`${carbonGrams.toFixed(3)}g`} />
              </div>
              <div className="max-h-[34rem] overflow-y-auto px-5 pb-5">
                {state.result.domains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{domain.domain}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {domain.requestCount} request(s) · {formatBytes(domain.totalSize)} ·{' '}
                          {domain.isThirdParty ? 'third-party' : 'first-party'} · {domain.classification}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBlockedDomain(domain.domain)}
                        className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                          blockedDomains.has(domain.domain)
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/10 bg-white/[0.03] text-slate-300'
                        }`}
                      >
                        {blockedDomains.has(domain.domain) ? 'Blocked next run' : 'Block next run'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Compliance evidence
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Runtime: official `@leaningtech/browserpod` package.</p>
                  <p>Execution: Node script runs inside the browser-hosted pod.</p>
                  <p>Server API usage: none from this route.</p>
                  <p>Blocked transfer estimate: {formatBytes(state.result.blockedSize)}</p>
                  <p>Blocked CO2 estimate: {blockedCarbonGrams.toFixed(3)}g</p>
                  <p>Health-related signal: {state.result.isHealthRelated ? 'detected' : 'not detected'}</p>
                </div>
              </section>

              <section className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Pod output
                </p>
                <div
                  ref={terminalHostRef}
                  className="mt-4 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-400"
                />
              </section>
            </aside>
          </div>
        )}

        {!state.result && (
          <div
            ref={terminalHostRef}
            className="mt-6 hidden max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-400"
          />
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
