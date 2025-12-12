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

type SessionCardProps = {
  session: {
    id: string;
    title: string;
    contextSummary: string;
    isDemo: boolean;
    updatedAt: string;
    metadata: any;
  };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function SessionCard({ session, index, onEdit, onDelete }: SessionCardProps) {
  const metadata = session.metadata || {};
  const processCount = metadata.processIds?.length || 0;
  const opportunityCount = metadata.opportunityIds?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link href={`/sessions/${session.id}`} className="block group">
        <div className="relative h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Inner glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 via-brand-50/0 to-brand-50/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="relative p-6 space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-brand-700 transition-colors">
                  {session.title}
                </h3>
                {session.contextSummary && (
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {session.contextSummary}
                  </p>
                )}
                {!session.contextSummary && (
                  <p className="text-sm text-slate-400 italic">
                    No summary yet — this will populate as you work
                  </p>
                )}
              </div>

              {/* Action Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {session.isDemo && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
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
                  <GitBranch className="h-4 w-4" />
                  <span className="font-medium">{processCount}</span>
                  <span className="text-slate-500">process{processCount !== 1 ? 'es' : ''}</span>
                </div>
              )}
              {opportunityCount > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">{opportunityCount}</span>
                  <span className="text-slate-500">opp{opportunityCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {processCount === 0 && opportunityCount === 0 && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">No artifacts yet</span>
                </div>
              )}
            </div>

            {/* Footer - Timestamp */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Last updated</span>
              <span className="text-xs font-medium text-slate-700">
                {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
