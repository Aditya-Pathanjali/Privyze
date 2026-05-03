'use client';

import { useEffect, useRef, useState } from 'react';
import { AggregatedDomain, NetworkRequest } from '@/lib/types';

interface BrowserPodState {
  sessionId: string | null;
  isLoading: boolean;
  domains: AggregatedDomain[];
  selectedDomain: AggregatedDomain | null;
  healthAlert: boolean;
  error: string;
  mode: 'live' | 'mock' | null;
  title: string;
  blockedCount: number;
  totalSize: number;
  blockedSize: number;
  requests: NetworkRequest[];
  blockedRequests: NetworkRequest[];
  blockedDomains: string[];
  blockedResourceTypes: string[];
  previewImage: string;
}

const initialState: BrowserPodState = {
  sessionId: null,
  isLoading: false,
  domains: [],
  selectedDomain: null,
  healthAlert: false,
  error: '',
  mode: null,
  title: '',
  blockedCount: 0,
  totalSize: 0,
  blockedSize: 0,
  requests: [],
  blockedRequests: [],
  blockedDomains: [],
  blockedResourceTypes: [],
  previewImage: '',
};

export function useBrowserPod(urlToLoad: string) {
  const [state, setState] = useState<BrowserPodState>(initialState);
  const pollRef = useRef<number | null>(null);
  const lastDataRef = useRef<string>('');
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!urlToLoad) {
      setState(initialState);
      return;
    }

    let active = true;
    lastDataRef.current = '';

    const syncNetworkState = async (sessionId: string) => {
      if (!active) return;

      const response = await fetch(`/api/network?id=${sessionId}`, {
        cache: 'no-store',
      });
      if (response.status === 404) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        throw new Error('Session expired');
      }
      if (!response.ok) {
        throw new Error('Failed to fetch network data');
      }

      const data = await response.json();
      if (!active) return;

      // Create a hash of the critical data to detect changes
      const dataHash = JSON.stringify({
        domainCount: data.aggregated?.length,
        requestCount: data.requests?.length,
        blockedCount: data.blockedRequests?.length,
        stats: data.stats,
      });

      // Skip update if data hasn't changed
      if (dataHash === lastDataRef.current) {
        return;
      }
      lastDataRef.current = dataHash;

      setState((current) => {
        const nextSelectedDomain =
          current.selectedDomain &&
          data.aggregated.some(
            (domain: AggregatedDomain) =>
              domain.domain === current.selectedDomain?.domain
          )
            ? data.aggregated.find(
                (domain: AggregatedDomain) =>
                  domain.domain === current.selectedDomain?.domain
              ) ?? null
            : data.aggregated[0] ?? null;

        return {
          ...current,
          sessionId,
          isLoading: false,
          domains: data.aggregated,
          selectedDomain: nextSelectedDomain,
          healthAlert: Boolean(data.stats?.isHealthRelated),
          error: current.error && current.error.includes('simulation') ? current.error : '',
          mode: data.mode ?? current.mode,
          title: data.title ?? current.title,
          blockedCount: data.stats?.blockedRequests ?? 0,
          totalSize: data.stats?.totalSize ?? 0,
          blockedSize: data.stats?.blockedSize ?? 0,
          requests: data.requests ?? [],
          blockedRequests: data.blockedRequests ?? [],
          blockedDomains: data.blockedDomains ?? [],
          blockedResourceTypes: data.blockedResourceTypes ?? [],
          previewImage: data.previewImage ?? '',
        };
      });
    };

    const createSession = async () => {
      const previousSessionId = sessionRef.current;
      sessionRef.current = null;

      if (previousSessionId) {
        fetch(`/api/session?id=${previousSessionId}`, {
          method: 'DELETE',
          keepalive: true,
        }).catch(console.error);
      }

      setState({
        ...initialState,
        isLoading: true,
      });

      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToLoad }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create session');
        }
        if (!active) return;

        sessionRef.current = data.sessionId;

        setState((current) => ({
          ...current,
          sessionId: data.sessionId,
          mode: data.mode ?? null,
          error: data.warning ?? '',
        }));

        await syncNetworkState(data.sessionId);
        pollRef.current = window.setInterval(() => {
          void syncNetworkState(data.sessionId).catch((error) => {
            console.error('Network polling error:', error);
            if (!active) return;
            if (error.message === 'Session expired') {
              setState((current) => ({
                ...current,
                isLoading: false,
                error: 'Session expired. Please try submitting the URL again.',
              }));
            } else {
              setState((current) => ({
                ...current,
                isLoading: false,
                error: current.error || 'Network activity could not be refreshed.',
              }));
            }
          });
        }, 800);
      } catch (error) {
        if (!active) return;
        console.error('Session creation error:', error);
        setState({
          ...initialState,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create sandbox session',
        });
      }
    };

    void createSession();

    return () => {
      active = false;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [urlToLoad]);

  return {
    ...state,
    selectDomain: (domain: AggregatedDomain | null) =>
      setState((current) => ({ ...current, selectedDomain: domain })),
  };
}
