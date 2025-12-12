'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import { OpportunityArtifact } from '@/types/artifacts';
import { formatDistanceToNow } from 'date-fns';

type OpportunityCardProps = {
  opportunity: OpportunityArtifact;
  isNew?: boolean;
};

const getImpactColor = (level: string) => {
  switch (level) {
    case 'high':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

const getEffortColor = (level: string) => {
  switch (level) {
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export function OpportunityCard({ opportunity, isNew = false }: OpportunityCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={isNew ? 'ring-2 ring-amber-500 ring-offset-2' : ''}
      >
        <Card
          className="group hover:shadow-md transition-all duration-200 hover:border-amber-300 cursor-pointer"
          onClick={() => setShowDetails(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-medium line-clamp-2 leading-snug">
                  {opportunity.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs mt-1">
                  {opportunity.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-2">
            {/* Impact and Effort badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getImpactColor(opportunity.impactLevel)}`}>
                {opportunity.impactLevel} impact
              </Badge>
              <Badge variant="outline" className={`text-xs ${getEffortColor(opportunity.effortLevel)}`}>
                {opportunity.effortLevel} effort
              </Badge>
            </div>

            {/* Context */}
            {opportunity.step && (
              <div className="text-xs text-muted-foreground">
                Step: <span className="font-medium text-foreground">{opportunity.step.title}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              {opportunity.title}
            </DialogTitle>
            <DialogDescription>{opportunity.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Scores Grid */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Impact Level</div>
                <Badge variant="outline" className={`text-xs ${getImpactColor(opportunity.impactLevel)}`}>
                  {opportunity.impactLevel}
                </Badge>
                <div className="text-lg font-semibold mt-1">{opportunity.impactScore}/100</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Effort Level</div>
                <Badge variant="outline" className={`text-xs ${getEffortColor(opportunity.effortLevel)}`}>
                  {opportunity.effortLevel}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Feasibility</div>
                <div className="text-lg font-semibold">{opportunity.feasibilityScore}%</div>
              </div>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Context</h4>
              <div className="p-3 bg-muted/20 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary" className="capitalize">
                    {opportunity.opportunityType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {opportunity.process && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Process:</span>
                    <span className="font-medium">{opportunity.process.name}</span>
                  </div>
                )}
                {opportunity.step && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Step:</span>
                    <span className="font-medium">{opportunity.step.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rationale */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Rationale</h4>
              <div className="p-4 bg-muted/20 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {opportunity.rationaleText}
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
              Identified {formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
