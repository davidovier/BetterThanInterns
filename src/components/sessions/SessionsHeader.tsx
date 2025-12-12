'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SessionsHeaderProps = {
  workspaceName: string | null;
  workspacePlan: 'starter' | 'pro' | 'enterprise';
  onNewSession: () => void;
};

const planColors = {
  starter: 'bg-slate-100 text-slate-700 border-slate-300',
  pro: 'bg-brand-100 text-brand-700 border-brand-300',
  enterprise: 'bg-purple-100 text-purple-700 border-purple-300',
};

export function SessionsHeader({
  workspaceName,
  workspacePlan,
  onNewSession,
}: SessionsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent opacity-50 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8">
        {/* Left Side - Title & Meta */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Sessions
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <HelpCircle className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Each session is a working file with your AI ops consultant. Map processes,
                    identify opportunities, and generate implementation blueprints — all in one place.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Each session is a working file with your AI ops consultant — processes, opportunities,
            and decisions in one place.
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">Workspace:</span>
            <span className="text-slate-700">{workspaceName || 'Loading...'}</span>
            <span className="text-slate-300">·</span>
            <Badge
              variant="outline"
              className={`capitalize ${planColors[workspacePlan]}`}
            >
              {workspacePlan}
            </Badge>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onNewSession}
            size="lg"
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
