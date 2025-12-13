'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, GitBranch, Target, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SessionWithState, getStateLabel, getStateStyles } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';

type FeaturedSessionProps = {
  session: SessionWithState;
};

/**
 * M18: Featured Session - "Where to go next"
 * Larger, cleaner, more whitespace than grid cards
 * Obvious next click for the user
 */
export function FeaturedSession({ session }: FeaturedSessionProps) {
  const metadata = session.metadata || {};
  const processCount = metadata.processIds?.length || 0;
  const opportunityCount = metadata.opportunityIds?.length || 0;
  const governanceCount = metadata.aiUseCaseIds?.length || 0;

  const state = session.state || 'in-progress';
  const stateStyles = getStateStyles(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/sessions/${session.id}`} className="block group">
        <div className={cn(
          "relative bg-white rounded-2xl border-l-4 border-y border-r border-slate-200",
          "shadow-sm hover:shadow-lg transition-all duration-300",
          "overflow-hidden",
          stateStyles.borderColor
        )}>
          {/* Inner glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-50/0 to-slate-50/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="relative p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded",
                    stateStyles.textColor,
                    stateStyles.bgColor
                  )}>
                    {getStateLabel(state)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {session.title}
                </h2>
                {session.contextSummary ? (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {session.contextSummary}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Summary will appear as decisions are made.
                  </p>
                )}
              </div>

              {/* Continue indicator */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 group-hover:bg-brand-100 transition-colors shrink-0">
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Artifacts */}
            {(processCount > 0 || opportunityCount > 0 || governanceCount > 0) && (
              <div className="flex items-center gap-6 text-sm pt-4 border-t border-slate-100">
                {processCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <GitBranch className="h-4 w-4" />
                    <span className="font-semibold">{processCount}</span>
                    <span className="text-slate-500">process{processCount !== 1 ? 'es' : ''}</span>
                  </div>
                )}
                {opportunityCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="h-4 w-4" />
                    <span className="font-semibold">{opportunityCount}</span>
                    <span className="text-slate-500">opportunit{opportunityCount !== 1 ? 'ies' : 'y'}</span>
                  </div>
                )}
                {governanceCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield className="h-4 w-4" />
                    <span className="font-semibold">{governanceCount}</span>
                    <span className="text-slate-500">use case{governanceCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
