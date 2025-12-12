'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GitBranch, User, Clock, Lightbulb } from 'lucide-react';
import { ProcessArtifact } from '@/types/artifacts';
import { formatDistanceToNow } from 'date-fns';

type ProcessCardProps = {
  process: ProcessArtifact;
  isNew?: boolean;
};

export function ProcessCard({ process, isNew = false }: ProcessCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        initial={isNew ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={isNew ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
      >
        <Card
          className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-slate-200 bg-white"
          onClick={() => setShowDetails(true)}
        >
          <CardContent className="p-3">
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
              <GitBranch className="h-3.5 w-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-900 line-clamp-1">
                  {process.name}
                </h3>
                {process.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {process.description}
                  </p>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-slate-600">
                <GitBranch className="h-3 w-3" />
                <span>{process._count.steps} steps</span>
              </div>
              {process._count.opportunities > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Lightbulb className="h-3 w-3" />
                  <span>{process._count.opportunities}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-brand-600" />
              {process.name}
            </DialogTitle>
            {process.description && (
              <DialogDescription>{process.description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Steps</div>
                <div className="text-lg font-semibold">{process._count.steps}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Opportunities</div>
                <div className="text-lg font-semibold">{process._count.opportunities}</div>
              </div>
              {process.owner && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Owner</div>
                  <div className="text-sm">{process.owner}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(process.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Steps List */}
            <div>
              <h4 className="font-semibold mb-3">Process Steps</h4>
              <div className="space-y-2">
                {process.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="p-3 bg-muted/20 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{step.title}</div>
                        {step.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {step.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {step.owner && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{step.owner}</span>
                            </div>
                          )}
                          {step.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{step.duration}</span>
                            </div>
                          )}
                          {step.frequency && (
                            <Badge variant="secondary" className="text-xs">
                              {step.frequency}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
