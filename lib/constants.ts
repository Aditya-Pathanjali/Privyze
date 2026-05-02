// Constants for Data Guardian

export const KNOWN_TRACKERS = [
  'doubleclick.net',
  'google-analytics.com',
  'analytics.google.com',
  'facebook.com',
  'facebook.net',
  'fbcdn.net',
  'connect.facebook.net',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'heap.io',
  'hotjar.com',
  'intercom.io',
  'intercomcdn.com',
  'typeform.com',
  'optimizely.com',
  'tiktok.com',
  'twitter.com',
  'platform.twitter.com',
  'ads.twitter.com',
  'linkedin.com',
  'platform.linkedin.com',
  'reddit.com',
  'redd.it',
  'pinterest.com',
  'pinterest.com',
  'snapchat.com',
  'snap.com',
  'instagram.com',
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
  'criteo.net',
  'casalemedia.com',
  'contextweb.com',
  'bing.com',
];

export const TRACKER_PATTERNS = [
  /analytics/i,
  /tracking/i,
  /tracker/i,
  /ads/i,
  /advertisement/i,
  /adserver/i,
  /adcenter/i,
  /doubleclick/i,
  /google.*/i,
  /facebook/i,
  /pixel/i,
  /beacon/i,
];

export const HEALTH_KEYWORDS = [
  'symptom',
  'symptoms',
  'disease',
  'illness',
  'doctor',
  'hospital',
  'treatment',
  'medication',
  'diagnosis',
  'health',
  'medical',
  'therapy',
  'medicine',
  'patient',
  'clinical',
  'condition',
  'disorder',
  'syndrome',
  'wellness',
  'mental health',
  'depression',
  'anxiety',
  'cancer',
  'diabetes',
  'hypertension',
  'asthma',
  'infection',
  'virus',
  'prescription',
];

export const CARBON_PER_KB = 0.0002; // grams of CO2 per KB transferred
export const TREE_CO2_REMOVAL_G_PER_YEAR = 22000; // grams of CO2 removed by one mature tree per year

export const CARBON_EQUIVALENTS: Record<number, string> = {
  0.5: 'equivalent to 1 meter of car driving',
  1: 'equivalent to 5 meters of car driving',
  2: 'equivalent to 10 meters of car driving',
  5: 'equivalent to 25 meters of car driving',
  10: 'equivalent to 50 meters of car driving',
  50: 'equivalent to 250 meters of car driving',
  100: 'equivalent to 500 meters of car driving',
  500: 'equivalent to 2.5 km of car driving',
  1000: 'equivalent to 5 km of car driving',
};

export const ACCESSIBILITY_KEYWORDS = [
  'accessibility',
  'aria',
  'wcag',
  'screen reader',
  'keyboard navigation',
];

export const API_ENDPOINTS = {
  SESSION: '/api/session',
  NETWORK: '/api/network',
  EXPLAIN: '/api/explain',
  BLOCK: '/api/block',
};

export const UI_COLORS = {
  TRACKER: '#ef4444',      // red
  ANALYTICS: '#f97316',    // orange
  ADS: '#eab308',          // yellow
  API: '#3b82f6',          // blue
  CDN: '#10b981',          // emerald
  OTHER: '#6b7280',        // gray
  FIRST_PARTY: '#06b6d4',  // cyan
  THIRD_PARTY: '#a855f7',  // purple
};

export const DEMO_SITES = [
  { url: 'https://www.bbc.com', name: 'BBC News' },
  { url: 'https://www.medium.com', name: 'Medium' },
  { url: 'https://www.github.com', name: 'GitHub' },
  { url: 'https://www.wikipedia.org', name: 'Wikipedia' },
];
