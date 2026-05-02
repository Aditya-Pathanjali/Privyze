import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { NetworkRequest, SessionState } from '@/lib/types';
import { NetworkService } from './network';

interface SessionEntry {
  state: SessionState;
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  seedRequests?: NetworkRequest[];
}

const sessions: Record<string, SessionEntry> = {};

const REQUEST_TYPE_OVERRIDES: Record<string, NetworkRequest['type']> = {
  document: 'document',
  stylesheet: 'stylesheet',
  script: 'script',
  image: 'image',
  xhr: 'xhr',
  fetch: 'fetch',
};

function svgPreview(title: string, subtitle: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#eff6ff"/>
          <stop offset="1" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <rect x="80" y="80" width="1040" height="560" rx="24" fill="#ffffff" stroke="#cbd5e1"/>
      <rect x="110" y="120" width="980" height="18" rx="9" fill="#e2e8f0"/>
      <rect x="110" y="170" width="420" height="24" rx="12" fill="#0f172a"/>
      <rect x="110" y="220" width="760" height="16" rx="8" fill="#cbd5e1"/>
      <rect x="110" y="252" width="680" height="16" rx="8" fill="#e2e8f0"/>
      <rect x="110" y="320" width="280" height="180" rx="20" fill="#dbeafe"/>
      <rect x="420" y="320" width="280" height="180" rx="20" fill="#dcfce7"/>
      <rect x="730" y="320" width="280" height="180" rx="20" fill="#fef3c7"/>
      <text x="110" y="590" font-family="Arial, Helvetica, sans-serif" font-size="44" fill="#0f172a">${title}</text>
      <text x="110" y="630" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#475569">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export class BrowserPodService {
  static async createSession(
    sessionId: string,
    url: string
  ): Promise<{ sessionId: string; url: string; mode: 'live' | 'mock' }> {
    try {
      return await this.createLiveSession(sessionId, url);
    } catch (error) {
      console.error('Falling back to mock BrowserPod session:', error);
      return this.createMockSession(sessionId, url, error);
    }
  }

  private static async createLiveSession(
    sessionId: string,
    url: string
  ): Promise<{ sessionId: string; url: string; mode: 'live' }> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();
    const entry: SessionEntry = {
      browser,
      context,
      page,
      state: {
        sessionId,
        url,
        blockedDomains: new Set(),
        blockedResourceTypes: new Set(),
        requests: [],
        blockedRequests: [],
        aggregatedDomains: {},
        totalRequests: 0,
        totalSize: 0,
        totalBlockedRequests: 0,
        totalBlockedSize: 0,
        createdAt: Date.now(),
        mode: 'live',
      },
    };

    sessions[sessionId] = entry;
    await this.setupRequestCollection(entry);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.refreshLiveArtifacts(entry);

    return { sessionId, url, mode: 'live' };
  }

  private static async createMockSession(
    sessionId: string,
    url: string,
    error: unknown
  ): Promise<{ sessionId: string; url: string; mode: 'mock' }> {
    const seedRequests = this.buildMockRequests(url);
    const domain = NetworkService.parseDomain(url);
    const title = `${domain} sandbox simulation`;

    sessions[sessionId] = {
      browser: null,
      context: null,
      page: null,
      seedRequests,
      state: {
        sessionId,
        url,
        blockedDomains: new Set(),
        blockedResourceTypes: new Set(),
        requests: [],
        blockedRequests: [],
        aggregatedDomains: {},
        totalRequests: 0,
        totalSize: 0,
        totalBlockedRequests: 0,
        totalBlockedSize: 0,
        createdAt: Date.now(),
        pageContent: url,
        isHealthRelated: NetworkService.detectHealthPage(url, title),
        title,
        mode: 'mock',
        lastError: error instanceof Error ? error.message : 'Unknown sandbox error',
        previewImage: svgPreview(domain, 'Safe BrowserPod fallback preview'),
      },
    };

    this.refreshMockState(sessionId);
    return { sessionId, url, mode: 'mock' };
  }

  private static async setupRequestCollection(entry: SessionEntry) {
    const { page, state } = entry;
    if (!page) return;

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const domain = NetworkService.parseDomain(url);
      const requestType = this.normalizeRequestType(request.resourceType());

      if (
        state.blockedDomains.has(domain) ||
        state.blockedResourceTypes.has(requestType)
      ) {
        state.blockedRequests.push({
          url,
          domain,
          type: requestType,
          size: this.estimateSize(request.resourceType(), url),
          timestamp: Date.now(),
          isThirdParty: NetworkService.isThirdParty(
            domain,
            NetworkService.parseDomain(state.url)
          ),
        });
        
        state.totalBlockedRequests = (state.totalBlockedRequests || 0) + 1;
        state.totalBlockedSize = (state.totalBlockedSize || 0) + this.estimateSize(request.resourceType(), url);
        if (state.blockedRequests.length > 200) {
          state.blockedRequests.shift();
        }
        
        await route.abort();
        return;
      }

      await route.continue();
    });

    page.on('requestfinished', async (request) => {
      try {
        const response = await request.response();
        const url = request.url();
        const domain = NetworkService.parseDomain(url);
        const requestType = this.normalizeRequestType(request.resourceType());
        if (
          state.blockedDomains.has(domain) ||
          state.blockedResourceTypes.has(requestType)
        ) {
          return;
        }

        const contentLength = await response?.headerValue('content-length');
        const size = contentLength
          ? Number.parseInt(contentLength, 10)
          : this.estimateSize(request.resourceType(), url);

        const requestObj = {
          url,
          domain,
          type: requestType,
          size: Number.isFinite(size) ? size : 0,
          timestamp: Date.now(),
          isThirdParty: NetworkService.isThirdParty(
            domain,
            NetworkService.parseDomain(state.url)
          ),
          responseStatus: response?.status(),
        };
        
        state.requests.push(requestObj);
        
        state.totalRequests = (state.totalRequests || 0) + 1;
        state.totalSize = (state.totalSize || 0) + requestObj.size;
        if (state.requests.length > 500) {
          state.requests.shift();
        }
        
        if (!state.aggregatedDomains) state.aggregatedDomains = {};
        if (!state.aggregatedDomains[domain]) {
          const { classification, confidence } = NetworkService.classifyRequest(domain, requestObj.type);
          state.aggregatedDomains[domain] = {
            domain,
            requestCount: 0,
            totalSize: 0,
            types: [],
            isThirdParty: requestObj.isThirdParty,
            isTracker: ['tracker', 'analytics', 'ads'].includes(classification),
            classification: classification as any,
            confidence
          };
        }
        
        const agg = state.aggregatedDomains[domain];
        agg.requestCount++;
        agg.totalSize += requestObj.size;
        if (!agg.types.includes(requestObj.type)) {
          agg.types.push(requestObj.type);
        }
      } catch (error) {
        console.error('Failed to record request:', error);
      }
    });
  }

  private static async refreshLiveArtifacts(entry: SessionEntry) {
    if (!entry.page) return;

    const pageTitle = await entry.page.title();
    const pageContent = await entry.page.content();
    entry.state.title = pageTitle || NetworkService.parseDomain(entry.state.url);
    entry.state.pageContent = `${pageTitle}\n${pageContent}`.slice(0, 5000);
    entry.state.isHealthRelated = NetworkService.detectHealthPage(
      pageContent,
      pageTitle
    );

    try {
      const screenshot = await entry.page.screenshot({
        type: 'jpeg',
        quality: 70,
      });
      entry.state.previewImage = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
    } catch (error) {
      console.error('Failed to capture preview image:', error);
    }
  }

  private static normalizeRequestType(resourceType: string): NetworkRequest['type'] {
    return REQUEST_TYPE_OVERRIDES[resourceType] ?? 'other';
  }

  private static estimateSize(resourceType: string, url: string): number {
    const estimates: Record<string, number> = {
      document: 50000,
      stylesheet: 30000,
      script: 120000,
      image: 200000,
      xhr: 25000,
      fetch: 25000,
      other: 15000,
    };

    const base = estimates[resourceType] ?? estimates.other;
    return base + Math.min(20000, url.length * 40);
  }

  private static buildMockRequests(url: string): NetworkRequest[] {
    const mainDomain = NetworkService.parseDomain(url);
    const isHealth = NetworkService.detectHealthPage(url, mainDomain);
    const now = Date.now();

    const baseDomains = [
      { domain: mainDomain, type: 'document', size: 85000 },
      { domain: mainDomain, type: 'script', size: 125000 },
      { domain: mainDomain, type: 'stylesheet', size: 42000 },
      { domain: `cdn.${mainDomain}`, type: 'image', size: 190000 },
      { domain: `api.${mainDomain}`, type: 'fetch', size: 26000 },
      { domain: 'www.google-analytics.com', type: 'script', size: 36000 },
      { domain: 'stats.g.doubleclick.net', type: 'fetch', size: 18000 },
      { domain: 'connect.facebook.net', type: 'script', size: 41000 },
      { domain: 'pagead2.googlesyndication.com', type: 'script', size: 53000 },
    ];

    if (mainDomain.includes('github')) {
      baseDomains.push(
        { domain: 'collector.github.com', type: 'fetch', size: 14000 },
        { domain: 'avatars.githubusercontent.com', type: 'image', size: 130000 }
      );
    }

    if (mainDomain.includes('bbc')) {
      baseDomains.push(
        { domain: 'news.files.bbci.co.uk', type: 'script', size: 92000 },
        { domain: 'ichef.bbci.co.uk', type: 'image', size: 240000 }
      );
    }

    if (isHealth) {
      baseDomains.push(
        { domain: 'www.googletagmanager.com', type: 'script', size: 30000 },
        { domain: 'bat.bing.com', type: 'fetch', size: 12000 }
      );
    }

    return baseDomains.map((item, index) => ({
      url: `https://${item.domain}/resource-${index}`,
      domain: item.domain,
      type: item.type as NetworkRequest['type'],
      size: item.size,
      timestamp: now + index * 150,
      isThirdParty: NetworkService.isThirdParty(item.domain, mainDomain),
      responseStatus: 200,
    }));
  }

  private static refreshMockState(sessionId: string) {
    const entry = sessions[sessionId];
    if (!entry || entry.state.mode !== 'mock' || !entry.seedRequests) {
      return;
    }
    const state = entry.state;

    const elapsedMs = Date.now() - entry.state.createdAt;
    const visibleCount = Math.max(
      1,
      Math.min(entry.seedRequests.length, Math.floor(elapsedMs / 350) + 1)
    );
    const visible = entry.seedRequests.slice(0, visibleCount);

    const newlyVisible = visible.filter(r => 
      !state.requests.some(existing => existing.url === r.url && existing.timestamp === r.timestamp) &&
      !state.blockedRequests.some(existing => existing.url === r.url && existing.timestamp === r.timestamp)
    );
    
    for (const req of newlyVisible) {
      if (
        state.blockedDomains.has(req.domain) ||
        state.blockedResourceTypes.has(req.type)
      ) {
        state.blockedRequests.push(req);
        state.totalBlockedRequests = (state.totalBlockedRequests || 0) + 1;
        state.totalBlockedSize = (state.totalBlockedSize || 0) + req.size;
        if (state.blockedRequests.length > 200) state.blockedRequests.shift();
      } else {
        state.requests.push(req);
        state.totalRequests = (state.totalRequests || 0) + 1;
        state.totalSize = (state.totalSize || 0) + req.size;
        if (state.requests.length > 500) state.requests.shift();
        
        if (!state.aggregatedDomains) state.aggregatedDomains = {};
        if (!state.aggregatedDomains[req.domain]) {
          const { classification, confidence } = NetworkService.classifyRequest(req.domain, req.type);
          state.aggregatedDomains[req.domain] = {
            domain: req.domain,
            requestCount: 0,
            totalSize: 0,
            types: [],
            isThirdParty: req.isThirdParty,
            isTracker: ['tracker', 'analytics', 'ads'].includes(classification),
            classification: classification as any,
            confidence
          };
        }
        const agg = state.aggregatedDomains[req.domain];
        agg.requestCount++;
        agg.totalSize += req.size;
        if (!agg.types.includes(req.type)) agg.types.push(req.type);
      }
    }
  }

  static getRequests(sessionId: string): NetworkRequest[] {
    this.refreshMockState(sessionId);
    const session = sessions[sessionId];
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.state.requests;
  }

  static getSession(sessionId: string): SessionState | null {
    this.refreshMockState(sessionId);
    const session = sessions[sessionId];
    return session ? session.state : null;
  }

  static async blockDomains(
    sessionId: string,
    domainsToBlock: string[],
    resourceTypesToBlock: NetworkRequest['type'][] = []
  ): Promise<void> {
    const session = sessions[sessionId];
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    for (const domain of domainsToBlock) {
      session.state.blockedDomains.add(domain);
    }
    for (const resourceType of resourceTypesToBlock) {
      session.state.blockedResourceTypes.add(resourceType);
    }

    if (session.state.mode === 'mock') {
      session.state.createdAt = Date.now();
      this.refreshMockState(sessionId);
      return;
    }

    session.state.requests = [];
    session.state.blockedRequests = [];
    session.state.aggregatedDomains = {};
    session.state.totalRequests = 0;
    session.state.totalSize = 0;
    session.state.totalBlockedRequests = 0;
    session.state.totalBlockedSize = 0;

    try {
      await session.page?.reload({ waitUntil: 'domcontentloaded' });
      await this.refreshLiveArtifacts(session);
    } catch (error) {
      console.error('Reload error:', error);
    }
  }

  static async unblockDomains(
    sessionId: string,
    domainsToUnblock: string[],
    resourceTypesToUnblock: NetworkRequest['type'][] = []
  ): Promise<void> {
    const session = sessions[sessionId];
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    for (const domain of domainsToUnblock) {
      session.state.blockedDomains.delete(domain);
    }
    for (const resourceType of resourceTypesToUnblock) {
      session.state.blockedResourceTypes.delete(resourceType);
    }

    if (session.state.mode === 'mock') {
      session.state.createdAt = Date.now();
      this.refreshMockState(sessionId);
      return;
    }

    session.state.requests = [];
    session.state.blockedRequests = [];
    session.state.aggregatedDomains = {};
    session.state.totalRequests = 0;
    session.state.totalSize = 0;
    session.state.totalBlockedRequests = 0;
    session.state.totalBlockedSize = 0;

    try {
      await session.page?.reload({ waitUntil: 'domcontentloaded' });
      await this.refreshLiveArtifacts(session);
    } catch (error) {
      console.error('Reload error:', error);
    }
  }

  static getBlockedTrackers(sessionId: string): NetworkRequest[] {
    this.refreshMockState(sessionId);
    const session = sessions[sessionId];
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.state.blockedRequests;
  }

  static async closeSession(sessionId: string): Promise<void> {
    const session = sessions[sessionId];
    if (!session) return;

    try {
      await session.page?.close();
      await session.context?.close();
      await session.browser?.close();
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }

    delete sessions[sessionId];
  }

  static async closeAllSessions(): Promise<void> {
    for (const sessionId of Object.keys(sessions)) {
      await this.closeSession(sessionId);
    }
  }

  static getSessions(): string[] {
    return Object.keys(sessions);
  }
}
