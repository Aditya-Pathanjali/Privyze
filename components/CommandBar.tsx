'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_SITES } from '@/lib/constants';
import { NetworkService } from '@/lib/services/network';

interface CommandBarProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  initialValue?: string;
  error?: string;
}

export default function CommandBar({
  onSubmit,
  isLoading,
  initialValue = '',
  error: externalError,
}: CommandBarProps) {
  const [input, setInput] = useState(initialValue);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setInput(initialValue);
  }, [initialValue]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validation = NetworkService.normalizeHttpUrl(input);
    if (!validation.url) {
      setError(validation.error || 'That URL does not look valid.');
      return;
    }

    onSubmit(validation.url);
  };

  return (
    <div className="w-full relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <form onSubmit={handleSubmit} className="w-full">
          {/* Command Bar */}
          <div
            className={`relative rounded-2xl p-[2px] transition-all duration-300 ${
              isFocused
                ? 'bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-purple-500/40 shadow-[0_0_40px_rgba(139,92,246,0.2)]'
                : 'bg-white/[0.08] hover:bg-white/[0.12]'
            }`}
          >
            <div className="flex items-center gap-3 rounded-xl bg-[#090b10] px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md">
              {/* Globe icon */}
              <div className="flex-shrink-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
                  isFocused ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400'
                }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
              </div>

              {/* Input */}
              <input
                type="text"
                placeholder="Enter website URL..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 font-medium w-full"
              />

              {/* Analyze button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all duration-300 disabled:opacity-60 ${
                  isLoading
                    ? 'bg-purple-700'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25'
                }`}
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span>Analyze</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Demo sites */}
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Try:</span>
            {DEMO_SITES.map((site, i) => (
              <motion.button
                key={site.url}
                type="button"
                onClick={() => onSubmit(site.url)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-all hover:text-white"
              >
                {site.name}
              </motion.button>
            ))}
          </div>
        </form>

        {/* Errors */}
        <AnimatePresence>
          {(error || externalError) && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error || externalError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
