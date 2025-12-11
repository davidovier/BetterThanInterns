'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GitBranch, User, Clock, ChevronRight, Maximize2 } from 'lucide-react';
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
        initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={isNew ? 'ring-2 ring-brand-500 ring-offset-2' : ''}
      >
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="h-4 w-4 text-brand-600 flex-shrink-0" />
                  <CardTitle className="text-base truncate">{process.name}</CardTitle>
                </div>
                {process.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {process.description}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowDetails(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Mini Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span>{process._count.steps} steps</span>
              </div>
              {process._count.opportunities > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-amber-600">
                    {process._count.opportunities} opportunities
                  </span>
                </div>
              )}
              {process.owner && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{process.owner}</span>
                </div>
              )}
            </div>

            {/* Mini Map Preview */}
            <div className="relative bg-muted/30 rounded-lg p-3 border border-border/50 h-24 overflow-hidden">
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>Process Map ({process.steps.length} steps)</span>
                </div>
              </div>
              {/* TODO: Add actual mini ReactFlow visualization in future iteration */}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                Updated {formatDistanceToNow(new Date(process.updatedAt), { addSuffix: true })}
              </span>
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
