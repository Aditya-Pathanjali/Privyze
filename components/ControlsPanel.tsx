'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ControlsPanelProps {
  blockTrackers: boolean;
  blockThirdParty: boolean;
  disableScripts: boolean;
  isBlocking: boolean;
  trackerCount: number;
  blockedCount: number;
  healthAlert: boolean;
  onBlockTrackersChange: (enabled: boolean) => void;
  onBlockThirdPartyChange: (enabled: boolean) => void;
  onDisableScriptsChange: (enabled: boolean) => void;
  accessibilityMode: boolean;
  onAccessibilityModeChange: (mode: boolean) => void;
  onReset: () => void;
}

function Toggle({
  checked,
  disabled,
  onChange,
  color = 'purple',
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  color?: 'purple' | 'blue' | 'green' | 'amber';
}) {
  const colors = {
    purple: { bg: 'from-purple-600 to-purple-500', glow: 'rgba(139,92,246,0.4)' },
    blue: { bg: 'from-blue-600 to-blue-500', glow: 'rgba(59,130,246,0.4)' },
    green: { bg: 'from-emerald-600 to-emerald-500', glow: 'rgba(16,185,129,0.4)' },
    amber: { bg: 'from-amber-600 to-amber-500', glow: 'rgba(245,158,11,0.4)' },
  };

  const c = colors[color];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        background: checked
          ? `linear-gradient(135deg, var(--tw-gradient-stops))`
          : 'rgba(71, 85, 105, 0.3)',
        boxShadow: checked ? `0 0 12px ${c.glow}` : 'none',
      }}
    >
      {checked && (
        <span
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${c.bg}`}
        />
      )}
      <motion.span
        className="relative z-10 inline-block h-5 w-5 rounded-full bg-white shadow-md"
        animate={{
          x: checked ? 22 : 4,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

interface ControlRowProps {
  title: string;
  description: string;
  icon: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  color?: 'purple' | 'blue' | 'green' | 'amber';
}

function ControlRow({ title, description, icon, checked, disabled, onChange, color }: ControlRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3">
        <span className="text-base mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-medium text-slate-200">{title}</p>
          <p className="mt-1 text-xs text-slate-500 leading-5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} color={color} />
    </div>
  );
}

export default React.memo(function ControlsPanel({
  blockTrackers,
  blockThirdParty,
  disableScripts,
  isBlocking,
  trackerCount,
  blockedCount,
  healthAlert,
  onBlockTrackersChange,
  onBlockThirdPartyChange,
  onDisableScriptsChange,
  accessibilityMode,
  onAccessibilityModeChange,
  onReset,
}: ControlsPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎛️</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Control Panel
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-200">
              Privacy & behavior controls
            </h2>
          </div>
        </div>
      </div>

      <div className="px-5 divide-y divide-white/[0.04]">
        <ControlRow
          icon="🛡️"
          title="Block trackers"
          description="Stops known analytics, ad, and tracking endpoints."
          checked={blockTrackers}
          disabled={isBlocking || trackerCount === 0}
          onChange={onBlockTrackersChange}
          color="purple"
        />

        <ControlRow
          icon="🚫"
          title="Block third-party domains"
          description="Allows only the main site and its direct subdomains."
          checked={blockThirdParty}
          disabled={isBlocking}
          onChange={onBlockThirdPartyChange}
          color="blue"
        />

        <ControlRow
          icon="⚡"
          title="Disable scripts"
          description="Blocks script resources and reloads the sandbox."
          checked={disableScripts}
          disabled={isBlocking}
          onChange={onDisableScriptsChange}
          color="amber"
        />

        <ControlRow
          icon="♿"
          title="Accessibility mode"
          description="Uses larger text and simpler wording."
          checked={accessibilityMode}
          onChange={onAccessibilityModeChange}
          color="green"
        />
      </div>

      <div className="px-5 py-4 space-y-3">
        {accessibilityMode && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Accessibility mode is active: larger text, calmer motion, and simpler AI explanations.
          </div>
        )}

        {/* Status card */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3.5">
          <div className="flex items-center gap-2">
            {isBlocking ? (
              <div className="h-4 w-4 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-400 dot-pulse" />
            )}
            <p className="text-sm font-medium text-slate-300">
              {isBlocking
                ? 'Reloading sandbox with updated controls…'
                : `${blockedCount} requests blocked`}
            </p>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            {healthAlert
              ? 'Healthcare mode active — stricter privacy defaults applied.'
              : 'Combine controls to compare behavior before and after changes.'}
          </p>
        </div>

        {/* Reset button */}
        <motion.button
          type="button"
          onClick={onReset}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:border-white/15 hover:bg-white/[0.04] hover:text-slate-200"
        >
          Reset all filters
        </motion.button>
      </div>
    </motion.section>
  );
});
