// Backend types for Data Guardian

export interface NetworkRequest {
  url: string;
  domain: string;
  type: 'xhr' | 'fetch' | 'script' | 'image' | 'stylesheet' | 'document' | 'other';
  size: number; // in bytes
  timestamp: number;
  isThirdParty: boolean;
  headers?: Record<string, string>;
  responseStatus?: number;
}

export interface AggregatedDomain {
  domain: string;
  requestCount: number;
  totalSize: number; // in bytes
  types: string[];
  isThirdParty: boolean;
  isTracker: boolean;
  classification: 'tracker' | 'analytics' | 'ads' | 'api' | 'cdn' | 'other';
  confidence: number; // 0-1
}

export interface SessionState {
  sessionId: string;
  url: string;
  blockedDomains: Set<string>;
  blockedResourceTypes: Set<NetworkRequest['type']>;
  requests: NetworkRequest[];
  blockedRequests: NetworkRequest[];
  aggregatedDomains?: Record<string, AggregatedDomain>;
  totalRequests?: number;
  totalSize?: number;
  totalBlockedRequests?: number;
  totalBlockedSize?: number;
  pageContent?: string;
  isHealthRelated?: boolean;
  mode?: 'live' | 'mock';
  title?: string;
  lastError?: string;
  previewImage?: string;
  createdAt: number;
}

export interface ExplanationRequest {
  domain: string;
  type: string;
  sizeKB: number;
  isFirstParty: boolean;
  classification: string;
  accessibilityMode?: boolean;
}

export interface CarbonMetrics {
  totalSizeKB: number;
  estimatedCarbonGrams: number;
  trackerCount: number;
  topTrackers: { domain: string; size: number }[];
}

export interface DemoMetrics extends CarbonMetrics {
  before: CarbonMetrics;
  after: CarbonMetrics;
  reductionPercent: number;
}
