'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type AssistantPresenceState = 'idle' | 'listening' | 'thinking' | 'updating' | 'error';

interface AssistantPresenceProps {
  state: AssistantPresenceState;
}

/**
 * AssistantPresence - A premium, abstract presence indicator
 *
 * Design philosophy:
 * - No faces, no avatars, no anthropomorphization
 * - Minimal, calm, executive-grade aesthetic
 * - Subtle motion that signals intelligence without distraction
 * - Think: Apple/Linear/Superhuman quality
 */
export function AssistantPresence({ state }: AssistantPresenceProps) {
  const [localError, setLocalError] = useState(false);

  // Auto-clear error state after brief pulse
  useEffect(() => {
    if (state === 'error') {
      setLocalError(true);
      const timeout = setTimeout(() => {
        setLocalError(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  // Determine visual state (error gets priority for brief moment)
  const visualState = localError ? 'error' : state;

  // State-specific styling
  const stateConfig = {
    idle: {
      orbColor: 'from-slate-300 via-slate-200 to-slate-300',
      glowColor: 'shadow-slate-200/20',
      scale: 1,
      opacity: 0.6,
      label: 'Ready',
      labelColor: 'text-slate-500',
    },
    listening: {
      orbColor: 'from-brand-400 via-brand-300 to-brand-400',
      glowColor: 'shadow-brand-300/40',
      scale: 1.05,
      opacity: 0.9,
      label: 'Listening',
      labelColor: 'text-brand-600',
    },
    thinking: {
      orbColor: 'from-brand-500 via-brand-400 to-brand-500',
      glowColor: 'shadow-brand-400/50',
      scale: 1,
      opacity: 1,
      label: 'Thinking',
      labelColor: 'text-brand-700',
    },
    updating: {
      orbColor: 'from-emerald-400 via-teal-300 to-emerald-400',
      glowColor: 'shadow-emerald-300/40',
      scale: 1,
      opacity: 1,
      label: 'Updating',
      labelColor: 'text-emerald-700',
    },
    error: {
      orbColor: 'from-red-400 via-rose-300 to-red-400',
      glowColor: 'shadow-red-300/40',
      scale: 0.95,
      opacity: 0.8,
      label: 'Error',
      labelColor: 'text-red-600',
    },
  };

  const config = stateConfig[visualState];

  return (
    <div className="flex items-center gap-3">
      {/* Abstract Orb Indicator */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full blur-md"
          animate={{
            scale: visualState === 'thinking' ? [1, 1.2, 1] : 1,
            opacity: visualState === 'thinking' ? [0.3, 0.5, 0.3] : 0.3,
          }}
          transition={{
            duration: visualState === 'thinking' ? 2 : 0.3,
            repeat: visualState === 'thinking' ? Infinity : 0,
            ease: 'easeInOut',
          }}
        >
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.orbColor} ${config.glowColor}`} />
        </motion.div>

        {/* Main orb */}
        <motion.div
          className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${config.orbColor} shadow-lg ${config.glowColor}`}
          animate={{
            scale: config.scale,
            opacity: config.opacity,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        >
          {/* Breathing pulse for idle state */}
          {visualState === 'idle' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400/30 to-slate-300/30"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Ripple effect for updating state */}
          {visualState === 'updating' && (
            <>
              {[0, 0.5, 1].map((delay) => (
                <motion.div
                  key={delay}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: 1.4,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}

          {/* Reactive pulse for listening */}
          {visualState === 'listening' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/40 to-brand-400/40"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Error flash */}
          {visualState === 'error' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/50"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </motion.div>
      </div>

      {/* State Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={visualState}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
        >
          <span className={`text-xs font-medium ${config.labelColor}`}>{config.label}</span>
          <span className="text-[10px] text-slate-400">Assistant</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
