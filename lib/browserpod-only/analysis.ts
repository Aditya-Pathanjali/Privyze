import { AggregatedDomain, NetworkRequest } from '@/lib/types';

export type BrowserPodOnlyStatus =
  | 'idle'
  | 'booting'
  | 'running'
  | 'complete'
  | 'error';

export interface BrowserPodOnlyResult {
  runId?: string;
  url: string;
  finalUrl: string;
  title: string;
  mode: 'browserpod';
  requests: NetworkRequest[];
  domains: AggregatedDomain[];
  blockedDomains: string[];
  blockedRequests: NetworkRequest[];
  totalSize: number;
  blockedSize: number;
  isHealthRelated: boolean;
  portalUrls: string[];
}

export interface BrowserPodRunState {
  status: BrowserPodOnlyStatus;
  message: string;
  result: BrowserPodOnlyResult | null;
  error: string;
  logs: string[];
}

export const initialBrowserPodRunState: BrowserPodRunState = {
  status: 'idle',
  message: 'Ready to boot a BrowserPod in this browser tab.',
  result: null,
  error: '',
  logs: [],
};

export const BROWSERPOD_ANALYZER_SCRIPT = String.raw`
const targetUrl = process.argv[2];
const runId = process.argv[4] || String(Date.now());
const blockedDomains = new Set(
  (process.argv[3] || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
);

const knownTrackers = [
  'doubleclick.net',
  'google-analytics.com',
  'analytics.google.com',
  'facebook.com',
  'facebook.net',
  'connect.facebook.net',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'hotjar.com',
  'intercom.io',
  'optimizely.com',
  'tiktok.com',
  'twitter.com',
  'ads.twitter.com',
  'linkedin.com',
  'reddit.com',
  'pinterest.com',
  'snapchat.com',
  'gstatic.com',
  'adsense.google.com',
  'adservices.google.com',
  'pagead2.googlesyndication.com',
  'googleadservices.com',
  'amazon-adsystem.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.com',
  'appnexus.com',
  'adnxs.com',
  'criteo.com',
  'bing.com',
];

const trackerPatterns = [
  /analytics/i,
  /tracking/i,
  /tracker/i,
  /ads/i,
  /advertisement/i,
  /adserver/i,
  /doubleclick/i,
  /google.*/i,
  /facebook/i,
  /pixel/i,
  /beacon/i,
];

const healthKeywords = [
  'symptom',
  'disease',
  'doctor',
  'hospital',
  'treatment',
  'medication',
  'diagnosis',
  'health',
  'medical',
  'therapy',
  'patient',
  'clinical',
  'wellness',
  'mental health',
  'cancer',
  'diabetes',
  'prescription',
];

function normalizeHttpUrl(input) {
  const trimmed = String(input || '').trim();
  if (
    /^file:\/?/i.test(trimmed) ||
    /^file\/{2,}/i.test(trimmed) ||
    /^[a-z]:[\\/]/i.test(trimmed) ||
    /^\\\\/.test(trimmed)
  ) {
    throw new Error('Local file paths cannot be analyzed. Enter a public HTTP or HTTPS website URL.');
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs can be analyzed');
  }
  if (parsed.hostname.toLowerCase() === 'file') {
    throw new Error('Local file paths cannot be analyzed. Enter a public HTTP or HTTPS website URL.');
  }
  parsed.hash = '';
  return parsed.toString();
}

function parseDomain(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isThirdParty(domain, mainDomain) {
  const cleanRequest = domain.replace(/^www\./, '');
  const cleanMain = mainDomain.replace(/^www\./, '');
  return (
    cleanRequest !== cleanMain &&
    !cleanRequest.endsWith('.' + cleanMain) &&
    !cleanMain.endsWith('.' + cleanRequest)
  );
}

function classify(domain, type) {
  if (knownTrackers.some((tracker) => domain.includes(tracker))) {
    return { classification: 'tracker', confidence: 0.95 };
  }
  for (const pattern of trackerPatterns) {
    if (pattern.test(domain)) {
      if (domain.includes('analytics')) return { classification: 'analytics', confidence: 0.8 };
      if (domain.includes('ads') || domain.includes('ad')) return { classification: 'ads', confidence: 0.8 };
      return { classification: 'tracker', confidence: 0.7 };
    }
  }
  if (domain.includes('api') || domain.includes('service')) {
    return { classification: 'api', confidence: 0.6 };
  }
  if (type === 'stylesheet' || type === 'image') {
    return { classification: 'cdn', confidence: 0.6 };
  }
  if (type === 'fetch' || type === 'xhr') {
    return { classification: 'api', confidence: 0.5 };
  }
  return { classification: 'other', confidence: 0.3 };
}

function inferType(url, attribute) {
  const lower = url.toLowerCase();
  if (attribute === 'src' && /\.js($|[?#])/i.test(lower)) return 'script';
  if (attribute === 'href' && /\.css($|[?#])/i.test(lower)) return 'stylesheet';
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico)($|[?#])/i.test(lower)) return 'image';
  if (/\.(css)($|[?#])/i.test(lower)) return 'stylesheet';
  if (/\.(js|mjs)($|[?#])/i.test(lower)) return 'script';
  return 'fetch';
}

function estimateSize(type, url, htmlLength) {
  const estimates = {
    document: Math.max(50000, htmlLength || 0),
    stylesheet: 30000,
    script: 120000,
    image: 200000,
    xhr: 25000,
    fetch: 25000,
    other: 15000,
  };
  return (estimates[type] || estimates.other) + Math.min(20000, url.length * 40);
}

function extractResources(html, baseUrl) {
  const resources = [{ url: baseUrl, type: 'document' }];
  const attrPattern = /\b(src|href)\s*=\s*["']([^"'#]+)["']/gi;
  let match;
  while ((match = attrPattern.exec(html))) {
    try {
      const url = new URL(match[2], baseUrl).toString();
      if (!/^https?:\/\//i.test(url)) continue;
      resources.push({ url, type: inferType(url, match[1]) });
    } catch {}
  }
  return Array.from(new Map(resources.map((item) => [item.url, item])).values()).slice(0, 80);
}

function aggregate(requests) {
  const domains = new Map();
  for (const request of requests) {
    if (!domains.has(request.domain)) {
      const { classification, confidence } = classify(request.domain, request.type);
      domains.set(request.domain, {
        domain: request.domain,
        requestCount: 0,
        totalSize: 0,
        types: [],
        isThirdParty: request.isThirdParty,
        isTracker: ['tracker', 'analytics', 'ads'].includes(classification),
        classification,
        confidence,
      });
    }
    const domain = domains.get(request.domain);
    domain.requestCount += 1;
    domain.totalSize += request.size;
    if (!domain.types.includes(request.type)) domain.types.push(request.type);
  }
  return Array.from(domains.values()).sort((a, b) => b.totalSize - a.totalSize);
}

async function main() {
  const normalized = normalizeHttpUrl(targetUrl);
  const response = await fetch(normalized, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Privyze BrowserPod Privacy Analyzer',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  const finalUrl = response.url || normalized;
  const html = await response.text();
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || parseDomain(finalUrl)).trim();
  const mainDomain = parseDomain(finalUrl);
  const resources = extractResources(html, finalUrl);

  const activeRequests = [];
  const blockedRequests = [];
  for (const resource of resources) {
    const domain = parseDomain(resource.url);
    if (!domain) continue;
    const request = {
      url: resource.url,
      domain,
      type: resource.type,
      size: estimateSize(resource.type, resource.url, resource.type === 'document' ? html.length : 0),
      timestamp: Date.now(),
      isThirdParty: isThirdParty(domain, mainDomain),
      responseStatus: resource.type === 'document' ? response.status : undefined,
    };
    if (blockedDomains.has(domain)) {
      blockedRequests.push(request);
    } else {
      activeRequests.push(request);
    }
  }

  const combinedForHealth = (title + ' ' + html.slice(0, 5000)).toLowerCase();
  const result = {
    runId,
    url: normalized,
    finalUrl,
    title,
    mode: 'browserpod',
    requests: activeRequests,
    domains: aggregate(activeRequests),
    blockedDomains: Array.from(blockedDomains),
    blockedRequests,
    totalSize: activeRequests.reduce((sum, request) => sum + request.size, 0),
    blockedSize: blockedRequests.reduce((sum, request) => sum + request.size, 0),
    isHealthRelated: healthKeywords.some((keyword) => combinedForHealth.includes(keyword)),
  };

  console.log('PRIVYZE_RESULT_START');
  console.log(JSON.stringify(result));
  console.log('PRIVYZE_RESULT_END');
}

main().catch((error) => {
  console.error('PRIVYZE_ERROR_START');
  console.error(error && error.stack ? error.stack : String(error));
  console.error('PRIVYZE_ERROR_END');
  process.exitCode = 1;
});
`;

export function parseBrowserPodResult(
  logs: string[],
  expectedRunId?: string
): BrowserPodOnlyResult | null {
  const joined = logs.join('\n');
  const matches = Array.from(
    joined.matchAll(/PRIVYZE_RESULT_START\s*([\s\S]*?)\s*PRIVYZE_RESULT_END/g)
  );
  if (matches.length === 0) return null;

  for (const match of matches.reverse()) {
    const parsed = JSON.parse(match[1]) as Omit<BrowserPodOnlyResult, 'portalUrls'>;
    if (!expectedRunId || parsed.runId === expectedRunId) {
      return {
        ...parsed,
        portalUrls: [],
      };
    }
  }

  return null;
}
