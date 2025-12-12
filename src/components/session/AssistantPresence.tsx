'use client';

import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type AssistantPresenceState = 'idle' | 'listening' | 'thinking' | 'updating' | 'error';

interface AssistantPresenceProps {
  state: AssistantPresenceState;
  inputEnergy?: number; // 0..1 - drives listening state reactivity
}

/**
 * AssistantPresence - A premium, abstract presence indicator
 *
 * M17.1 Hardening:
 * - No internal state management (parent controls everything)
 * - Input energy drives listening reactivity
 * - Tooltip-only labels (CEO-grade minimal)
 * - No arbitrary timeouts
 *
 * Design philosophy:
 * - No faces, no avatars, no anthropomorphization
 * - Minimal, calm, executive-grade aesthetic
 * - Subtle motion that signals intelligence without distraction
 * - Think: Apple/Linear/Superhuman quality
 */
export function AssistantPresence({ state, inputEnergy = 0 }: AssistantPresenceProps) {
  // Clamp input energy to 0..1
  const energy = Math.max(0, Math.min(1, inputEnergy));

  // State-specific styling
  const stateConfig = {
    idle: {
      orbColor: 'from-slate-300 via-slate-200 to-slate-300',
      glowColor: 'shadow-slate-200/20',
      scale: 1,
      opacity: 0.6,
      label: 'Ready',
    },
    listening: {
      orbColor: 'from-brand-400 via-brand-300 to-brand-400',
      glowColor: 'shadow-brand-300/40',
      // M17.1: Scale increases slightly with input energy (max +2%)
      scale: 1 + energy * 0.02,
      // M17.1: Opacity increases with input energy
      opacity: 0.8 + energy * 0.2,
      label: 'Listening',
    },
    thinking: {
      orbColor: 'from-brand-500 via-brand-400 to-brand-500',
      glowColor: 'shadow-brand-400/50',
      scale: 1,
      opacity: 1,
      label: 'Thinking',
    },
    updating: {
      orbColor: 'from-emerald-400 via-teal-300 to-emerald-400',
      glowColor: 'shadow-emerald-300/40',
      scale: 1,
      opacity: 1,
      label: 'Updating',
    },
    error: {
      orbColor: 'from-red-400 via-rose-300 to-red-400',
      glowColor: 'shadow-red-300/40',
      scale: 0.95,
      opacity: 0.8,
      label: 'Error',
    },
  };

  const config = stateConfig[state];

  // M17.1: Pulse speed increases slightly with input energy
  const listeningPulseDuration = 1.5 - energy * 0.3; // 1.5s → 1.2s at max energy

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {/* Abstract Orb Indicator */}
            <div className="relative flex items-center justify-center">
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md"
                animate={{
                  scale: state === 'thinking' ? [1, 1.2, 1] : 1,
                  opacity: state === 'thinking' ? [0.3, 0.5, 0.3] : 0.3,
                }}
                transition={{
                  duration: state === 'thinking' ? 2 : 0.3,
                  repeat: state === 'thinking' ? Infinity : 0,
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
                {state === 'idle' && (
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
                {state === 'updating' && (
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

                {/* M17.1: Reactive pulse for listening - responds to input energy */}
                {state === 'listening' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/40 to-brand-400/40"
                    animate={{
                      scale: [1, 1.15 + energy * 0.05, 1],
                      opacity: [0.4 + energy * 0.2, 0.7 + energy * 0.2, 0.4 + energy * 0.2],
                    }}
                    transition={{
                      duration: listeningPulseDuration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Error flash */}
                {state === 'error' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-red-500/50"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
            </div>

            {/* M17.1: Error text inline (only state with visible text) */}
            {state === 'error' && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-2 text-xs text-red-600"
              >
                Something went wrong
              </motion.span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="flex flex-col">
            <span className="font-medium">{config.label}</span>
            <span className="text-muted-foreground text-[10px]">Assistant</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
