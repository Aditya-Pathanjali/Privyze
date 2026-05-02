'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  url: string;
  timestamp: number;
  trackerCount: number;
  domainCount: number;
  carbonGrams: number;
  privacyScore: number;
  dataTransferKB: number;
}

const STORAGE_KEY = 'privyze_history';
const MAX_ENTRIES = 50;

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is HistoryEntry => {
        return (
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.url === 'string' &&
          Number.isFinite(entry.timestamp) &&
          Number.isFinite(entry.trackerCount) &&
          Number.isFinite(entry.domainCount) &&
          Number.isFinite(entry.carbonGrams) &&
          Number.isFinite(entry.privacyScore) &&
          Number.isFinite(entry.dataTransferKB)
        );
      })
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    setHistory((prev) => {
      const newEntry: HistoryEntry = {
        url: entry.url,
        timestamp: Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now(),
        trackerCount: Math.max(0, entry.trackerCount || 0),
        domainCount: Math.max(0, entry.domainCount || 0),
        carbonGrams: Math.max(0, entry.carbonGrams || 0),
        privacyScore: Math.max(0, Math.min(100, entry.privacyScore || 0)),
        dataTransferKB: Math.max(0, entry.dataTransferKB || 0),
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      // Remove duplicate URLs (keep newest)
      const filtered = prev.filter((e) => e.url !== entry.url);
      const next = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
