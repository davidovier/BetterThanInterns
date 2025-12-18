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
import { cn } from '@/lib/utils';

type SessionsHeaderProps = {
  workspaceName: string | null;
  workspacePlan: 'starter' | 'pro' | 'enterprise';
  onNewSession: () => void;
};

const planColors = {
  starter: 'bg-muted text-muted-foreground border-border',
  pro: 'bg-brand-50 text-brand-700 border-brand-200',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
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
      transition={{ duration: 0.4 }}
      className="relative"
    >
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6">
        {/* Left Side - Title & Meta */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Sessions
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="bottom">
                  <p className="text-sm leading-relaxed">
                    Each session is a working file with your AI ops consultant. Map processes,
                    identify opportunities, and generate implementation blueprints.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Working files with your AI ops consultant. Processes, opportunities, and decisions in one place.
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground/70">Workspace:</span>
            <span className="font-medium text-foreground">{workspaceName || 'Loading...'}</span>
            <span className="text-border">·</span>
            <Badge
              variant="outline"
              className={cn('uppercase text-[10px] tracking-wide font-semibold', planColors[workspacePlan])}
            >
              {workspacePlan}
            </Badge>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onNewSession}
            variant="brand"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New session
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
