'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GitBranch, Target, MoreVertical, Pencil, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SessionWithState, getStateLabel, getStateStyles } from '@/lib/sessionUtils';
import { cn } from '@/lib/utils';

type SessionCardProps = {
  session: SessionWithState;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * M18: Updated SessionCard with:
 * - Subtle state indicator (left border accent)
 * - De-emphasized styling (softer shadows, more whitespace)
 * - Executive copy tone
 */
export function SessionCard({ session, index, onEdit, onDelete }: SessionCardProps) {
  const metadata = session.metadata || {};
  const processCount = metadata.processIds?.length || 0;
  const opportunityCount = metadata.opportunityIds?.length || 0;

  const state = session.state || 'in-progress';
  const stateStyles = getStateStyles(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Link href={`/sessions/${session.id}`} className="block group">
        <div className={cn(
          "relative h-full bg-white rounded-xl border-l-[3px] border-y border-r",
          "border-slate-200/80 shadow-sm hover:shadow-md",
          "hover:-translate-y-0.5 transition-all duration-300 overflow-hidden",
          stateStyles.borderColor
        )}>
          {/* Reduced inner glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-50/0 to-slate-50/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="relative p-5 space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 line-clamp-2 mb-1.5 group-hover:text-brand-700 transition-colors">
                  {session.title}
                </h3>
                {session.contextSummary ? (
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {session.contextSummary}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Summary pending
                  </p>
                )}
              </div>

              {/* Action Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {session.isDemo && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                    Demo
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit();
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Artifacts Row */}
            <div className="flex items-center gap-3 text-sm">
              {processCount > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="font-semibold">{processCount}</span>
                  <span className="text-slate-500 text-xs">process{processCount !== 1 ? 'es' : ''}</span>
                </div>
              )}
              {opportunityCount > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Target className="h-3.5 w-3.5" />
                  <span className="font-semibold">{opportunityCount}</span>
                  <span className="text-slate-500 text-xs">opp{opportunityCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {processCount === 0 && opportunityCount === 0 && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">No artifacts</span>
                </div>
              )}
            </div>

            {/* Footer - State & Timestamp */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
              <span className={cn("text-[10px] font-medium tracking-wide uppercase", stateStyles.textColor)}>
                {getStateLabel(state)}
              </span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
