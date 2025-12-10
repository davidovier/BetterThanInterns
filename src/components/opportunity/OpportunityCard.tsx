'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, MessageSquare, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

type Opportunity = {
  id: string;
  processId?: string;
  stepId: string | null;
  title: string;
  description: string;
  opportunityType: string;
  impactLevel: 'low' | 'medium' | 'high';
  effortLevel: 'low' | 'medium' | 'high';
  impactScore: number;
  feasibilityScore: number;
  rationaleText: string;
  step?: {
    id: string;
    title: string;
  } | null;
};

type OpportunityCardProps = {
  opportunity: Opportunity;
  onExplain?: (opportunity: Opportunity) => void;
  onUseInBlueprint?: (opportunity: Opportunity) => void;
};

export function OpportunityCard({
  opportunity,
  onExplain,
  onUseInBlueprint,
}: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const impactColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const effortColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all duration-200 h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <CardTitle className="text-base leading-tight">
              {opportunity.title}
            </CardTitle>
            {opportunity.step && (
              <CardDescription className="text-xs">
                Step: {opportunity.step.title}
              </CardDescription>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge
            variant="outline"
            className={`text-xs ${impactColors[opportunity.impactLevel]}`}
          >
            Impact: {opportunity.impactLevel}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${effortColors[opportunity.effortLevel]}`}
          >
            Effort: {opportunity.effortLevel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {opportunity.opportunityType.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Expandable "Why this matters" section */}
        <div className="flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Why this matters
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
              )}
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-16 opacity-90'
            }`}
          >
            <p className={`text-sm text-muted-foreground leading-relaxed ${
              !isExpanded ? 'line-clamp-3' : ''
            }`}>
              {opportunity.rationaleText}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {onExplain && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onExplain(opportunity)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Explain this opportunity
            </Button>
          )}
          {onUseInBlueprint && (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start"
              onClick={() => onUseInBlueprint(opportunity)}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Use in blueprint
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
