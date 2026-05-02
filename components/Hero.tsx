'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PrivacyOrb = dynamic(() => import('@/components/PrivacyOrb'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-40 h-40 rounded-full bg-purple-500/10 blur-2xl animate-pulse" />
    </div>
  ),
});

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_40%,rgba(139,92,246,0.12)_0%,transparent_70%)]" />
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/40"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1400),
            y: Math.random() * 500 + 100,
            opacity: 0,
          }}
          animate={{ y: [null, -400], opacity: [0, 0.5, 0] }}
          transition={{
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default function Hero({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden">
      {mounted && <GridBackground />}

      {/* Main hero content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-0 lg:gap-8 items-center min-h-[420px] py-14 lg:py-16">

          {/* ── LEFT: Text content ── */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 self-start rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 mb-8"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 dot-pulse" />
              <span className="text-[11px] font-semibold text-purple-300 tracking-widest uppercase">
                Powered by BrowserPod
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-6xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.0] mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <span className="bg-gradient-to-br from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                Privyze
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              className="text-2xl sm:text-3xl font-semibold text-slate-200 mb-4 leading-snug"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              See what the web hides{' '}
              <span className="text-purple-400">from you.</span>
            </motion.p>

            {/* Description */}
            <motion.p
              className="text-base text-slate-400 leading-7 max-w-md mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Real-time tracking intelligence, AI explanations, and carbon impact
              — all inside a secure sandbox.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              className="flex flex-wrap gap-2 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {[
                { icon: '🔍', label: 'Deep analysis' },
                { icon: '🛡️', label: 'Sandbox isolation' },
                { icon: '🌱', label: 'Carbon tracking' },
                { icon: '🤖', label: 'AI insights' },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </motion.div>

            {/* Command bar slot */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                {children}
              </motion.div>
            )}
          </div>

          {/* ── RIGHT: 3D Orb ── */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center h-[420px] xl:h-[480px]"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.5, ease: 'easeOut' }}
          >
            {/* Glow layers behind orb */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-purple-600/10 blur-[80px]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full bg-blue-500/8 blur-[50px]" />
            </div>

            {mounted && (
              <div className="w-full h-full">
                <PrivacyOrb />
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0F14] to-transparent pointer-events-none" />
    </section>
  );
}
