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
import { Shield, User, Link as LinkIcon, Maximize2 } from 'lucide-react';
import { AiUseCaseArtifact } from '@/types/artifacts';

type GovernanceCardProps = {
  aiUseCase: AiUseCaseArtifact;
  isNew?: boolean;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'production':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'pilot':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'planned':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    case 'paused':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export function GovernanceCard({ aiUseCase, isNew = false }: GovernanceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const processIds = Array.isArray(aiUseCase.linkedProcessIds)
    ? aiUseCase.linkedProcessIds
    : [];
  const opportunityIds = Array.isArray(aiUseCase.linkedOpportunityIds)
    ? aiUseCase.linkedOpportunityIds
    : [];

  return (
    <>
      <motion.div
        initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={isNew ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
      >
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <CardTitle className="text-base line-clamp-2">{aiUseCase.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {aiUseCase.description}
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
            {/* Status and Owner */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(aiUseCase.status)}`}>
                {aiUseCase.status}
              </Badge>
              {aiUseCase.owner && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{aiUseCase.owner}</span>
                </div>
              )}
            </div>

            {/* Linked Artifacts */}
            <div className="space-y-2">
              {processIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Linked to {processIds.length} process{processIds.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              )}
              {opportunityIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Linked to {opportunityIds.length} opportunit{opportunityIds.length !== 1 ? 'ies' : 'y'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              {aiUseCase.title}
            </DialogTitle>
            <DialogDescription>{aiUseCase.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Status Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(aiUseCase.status)}`}>
                  {aiUseCase.status}
                </Badge>
              </div>
              {aiUseCase.owner && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Owner</div>
                  <div className="text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {aiUseCase.owner}
                  </div>
                </div>
              )}
            </div>

            {/* Linked Artifacts */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Linked Artifacts</h4>
              <div className="p-3 bg-muted/20 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Processes:</span>
                  <span className="font-medium">{processIds.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Opportunities:</span>
                  <span className="font-medium">{opportunityIds.length}</span>
                </div>
              </div>
            </div>

            {/* Governance Placeholder */}
            <div className="p-6 bg-muted/20 rounded-lg border border-border/50 text-center text-sm text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Risk assessment and policy mappings</p>
              <p className="text-xs mt-2">Full governance details coming in next iteration</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
