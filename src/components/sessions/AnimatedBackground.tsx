'use client';

import { motion } from 'framer-motion';

/**
 * Subtle animated background with floating gradient blobs
 * Creates a premium 3D-ish effect without being distracting
 */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blob 1 - Top Left */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, rgb(99, 102, 241) 0%, transparent 70%)',
          top: '-10%',
          left: '-5%',
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 2 - Top Right */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, rgb(168, 85, 247) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
        }}
        animate={{
          y: [0, -40, 0],
          x: [0, -25, 0],
          scale: [1, 1.05, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 3 - Bottom Center */}
      <motion.div
        className="absolute w-[550px] h-[550px] rounded-full blur-3xl opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, rgb(6, 182, 212) 0%, transparent 70%)',
          bottom: '-20%',
          left: '30%',
        }}
        animate={{
          y: [0, 25, 0],
          x: [0, 30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgb(99, 102, 241), transparent 50%)',
        }}
      />
    </div>
  );
}
