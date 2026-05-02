'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function URLInput({
  onSubmit,
  isLoading,
  initialValue = '',
}: URLInputProps) {
  const [input, setInput] = useState(initialValue);
  const [error, setError] = useState('');

  useEffect(() => {
    setInput(initialValue);
  }, [initialValue]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    let nextUrl = input.trim();
    if (!nextUrl) {
      setError('Enter a website URL to analyze.');
      return;
    }

    if (!nextUrl.startsWith('http://') && !nextUrl.startsWith('https://')) {
      nextUrl = `https://${nextUrl}`;
    }

    try {
      new URL(nextUrl);
      onSubmit(nextUrl);
    } catch {
      setError('That URL does not look valid.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Command Bar Container */}
      <div className="flex items-center gap-3 rounded-xl bg-[#111827] p-3 shadow-lg">
        {/* Icon */}
        <span className="text-2xl">🌐</span>
        {/* Input */}
        <input
          type="text"
          placeholder="Enter a website to analyze…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 rounded-lg bg-[#0B0F14] px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {/* Animated Analyze Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(138,43,226,0.8)' }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white transition-colors"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          ) : null}
          {isLoading ? 'Analyzing…' : 'Analyze'}
        </motion.button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </form>
  );
}
