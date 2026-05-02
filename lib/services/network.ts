// Network analysis service
import { NetworkRequest, AggregatedDomain } from '@/lib/types';
import { KNOWN_TRACKERS, TRACKER_PATTERNS, HEALTH_KEYWORDS } from '@/lib/constants';

export class NetworkService {
  /**
   * Normalize and validate a user-supplied URL before sandbox navigation.
   */
  static normalizeHttpUrl(input: string): { url?: string; error?: string } {
    const trimmed = input.trim();
    if (!trimmed) {
      return { error: 'URL is required' };
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      return { error: 'Invalid URL format' };
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Only HTTP and HTTPS URLs can be analyzed' };
    }

    if (parsed.username || parsed.password) {
      return { error: 'URLs with embedded credentials are not supported' };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (this.isBlockedHostname(hostname)) {
      return { error: 'Private, local, and internal hosts cannot be analyzed' };
    }

    parsed.hash = '';
    return { url: parsed.toString() };
  }

  private static isBlockedHostname(hostname: string): boolean {
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === 'metadata.google.internal'
    ) {
      return true;
    }

    if (hostname.includes(':')) {
      const normalized = hostname.replace(/^\[|\]$/g, '');
      return (
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80:')
      );
    }

    const octets = hostname.split('.').map((part) => Number(part));
    if (octets.length === 4 && octets.every((part) => Number.isInteger(part))) {
      const [a, b] = octets;
      return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a === 169 && b === 254 ||
        a === 172 && b >= 16 && b <= 31 ||
        a === 192 && b === 168
      );
    }

    return false;
  }

  /**
   * Parse domain from URL
   */
  static parseDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || '';
    } catch {
      return url.split('/')[2] || url;
    }
  }

  /**
   * Determine if domain is third-party (different from main origin)
   */
  static isThirdParty(requestDomain: string, mainDomain: string): boolean {
    // Remove www. for comparison
    const cleanRequest = requestDomain.replace(/^www\./, '');
    const cleanMain = mainDomain.replace(/^www\./, '');

    return (
      cleanRequest !== cleanMain &&
      !cleanRequest.endsWith(`.${cleanMain}`) &&
      !cleanMain.endsWith(`.${cleanRequest}`)
    );
  }

  /**
   * Classify request type (tracker, analytics, ads, api, cdn, other)
   */
  static classifyRequest(
    domain: string,
    type: string
  ): { classification: string; confidence: number } {
    // Check against known trackers list
    if (KNOWN_TRACKERS.some((tracker) => domain.includes(tracker))) {
      return { classification: 'tracker', confidence: 0.95 };
    }

    // Check against patterns
    for (const pattern of TRACKER_PATTERNS) {
      if (pattern.test(domain)) {
        if (domain.includes('analytics')) {
          return { classification: 'analytics', confidence: 0.8 };
        }
        if (domain.includes('ads') || domain.includes('ad')) {
          return { classification: 'ads', confidence: 0.8 };
        }
        return { classification: 'tracker', confidence: 0.7 };
      }
    }

    // Check type-based classification
    if (type === 'script' || type === 'fetch' || type === 'xhr') {
      // Could be API or tracking - lean towards API if not suspicious
      if (domain.includes('api') || domain.includes('service')) {
        return { classification: 'api', confidence: 0.6 };
      }
    }

    if (type === 'stylesheet' || type === 'font') {
      return { classification: 'cdn', confidence: 0.7 };
    }

    // Default to API for fetch/xhr on unknown domains
    if (type === 'fetch' || type === 'xhr') {
      return { classification: 'api', confidence: 0.5 };
    }

    return { classification: 'other', confidence: 0.3 };
  }

  /**
   * Aggregate network requests by domain
   */
  static aggregateByDomain(
    requests: NetworkRequest[],
    mainDomain: string
  ): AggregatedDomain[] {
    const domains = new Map<string, AggregatedDomain>();

    for (const req of requests) {
      if (!domains.has(req.domain)) {
        const { classification, confidence } = this.classifyRequest(
          req.domain,
          req.type
        );
        const isThirdParty = this.isThirdParty(req.domain, mainDomain);
        const isTracker =
          classification === 'tracker' ||
          classification === 'analytics' ||
          classification === 'ads';

        domains.set(req.domain, {
          domain: req.domain,
          requestCount: 0,
          totalSize: 0,
          types: [],
          isThirdParty,
          isTracker,
          classification: classification as any,
          confidence,
        });
      }

      const domain = domains.get(req.domain)!;
      domain.requestCount++;
      domain.totalSize += req.size;
      if (!domain.types.includes(req.type)) {
        domain.types.push(req.type);
      }
    }

    return Array.from(domains.values()).sort(
      (a, b) => b.totalSize - a.totalSize
    );
  }

  /**
   * Detect if page is health-related
   */
  static detectHealthPage(
    pageContent: string,
    pageTitle: string
  ): boolean {
    const combined = `${pageTitle} ${pageContent}`.toLowerCase();
    return HEALTH_KEYWORDS.some((keyword) => combined.includes(keyword));
  }

  /**
   * Filter requests by tracker status
   */
  static getTrackerRequests(requests: NetworkRequest[]): NetworkRequest[] {
    return requests.filter((req) => {
      const { classification } = this.classifyRequest(req.domain, req.type);
      return (
        classification === 'tracker' ||
        classification === 'analytics' ||
        classification === 'ads'
      );
    });
  }

  /**
   * Calculate tracker stats
   */
  static calculateTrackerStats(domains: AggregatedDomain[]): {
    trackerCount: number;
    trackerSize: number;
    trackerPercent: number;
  } {
    const trackerDomains = domains.filter((d) => d.isTracker);
    const trackerSize = trackerDomains.reduce((sum, d) => sum + d.totalSize, 0);
    const totalSize = domains.reduce((sum, d) => sum + d.totalSize, 0);

    return {
      trackerCount: trackerDomains.length,
      trackerSize,
      trackerPercent: totalSize > 0 ? Math.round((trackerSize / totalSize) * 100) : 0,
    };
  }
}
