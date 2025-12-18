'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GitBranch, Target, MoreVertical, Pencil, Trash2, FileText, Clock } from 'lucide-react';
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
 * SessionCard with refined styling:
 * - Subtle state indicator (left border accent)
 * - Clean card styling with new design system
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link href={`/sessions/${session.id}`} className="block group">
        <Card
          className={cn(
            'relative h-full border-l-[3px] overflow-hidden',
            'shadow-soft hover:shadow-medium',
            'hover:-translate-y-0.5 transition-all duration-200',
            stateStyles.borderColor
          )}
        >
          <div className="relative p-5 space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-1.5 group-hover:text-brand-600 transition-colors">
                  {session.title}
                </h3>
                {session.contextSummary ? (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {session.contextSummary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    Summary pending.
                  </p>
                )}
              </div>

              {/* Action Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {session.isDemo && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold">
                    Demo
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-medium">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit();
                      }}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete();
                      }}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Artifacts Row */}
            <div className="flex items-center gap-4 text-sm">
              {processCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{processCount}</span>
                  <span className="text-xs">process{processCount !== 1 ? 'es' : ''}</span>
                </div>
              )}
              {opportunityCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{opportunityCount}</span>
                  <span className="text-xs">opp{opportunityCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {processCount === 0 && opportunityCount === 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">No artifacts yet.</span>
                </div>
              )}
            </div>

            {/* Footer - State & Timestamp */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className={cn("text-[10px] font-semibold tracking-wider uppercase", stateStyles.textColor)}>
                {getStateLabel(state)}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
