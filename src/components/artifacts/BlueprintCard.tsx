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
import { FileText, Maximize2, Layers } from 'lucide-react';
import { BlueprintArtifact } from '@/types/artifacts';
import { formatDistanceToNow } from 'date-fns';

type BlueprintCardProps = {
  blueprint: BlueprintArtifact;
  isNew?: boolean;
};

export function BlueprintCard({ blueprint, isNew = false }: BlueprintCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={isNew ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      >
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <CardTitle className="text-base truncate">{blueprint.title}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  AI Implementation Blueprint
                </CardDescription>
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
            {/* Version Info */}
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Version {blueprint.version}
              </Badge>
            </div>

            {/* Preview Placeholder */}
            <div className="relative bg-muted/30 rounded-lg p-4 border border-border/50 min-h-[80px]">
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                <div className="text-center space-y-1">
                  <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <div>Comprehensive implementation plan</div>
                  <div className="text-[10px]">Click to view details</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                Updated {formatDistanceToNow(new Date(blueprint.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {blueprint.title}
            </DialogTitle>
            <DialogDescription>
              AI Implementation Blueprint - Version {blueprint.version}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Version</div>
                <div className="text-lg font-semibold">{blueprint.version}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(blueprint.updatedAt), { addSuffix: true })}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Created</div>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(blueprint.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-6 bg-muted/20 rounded-lg border border-border/50 text-center text-sm text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Blueprint content will be loaded here</p>
              <p className="text-xs mt-2">Full markdown rendering coming in next iteration</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
