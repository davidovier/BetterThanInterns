'use client';

import { useEffect, useRef } from 'react';
import { ProcessCard } from './process/ProcessCard';
import { OpportunityCard } from './opportunity/OpportunityCard';
import { BlueprintPreview } from './blueprint/BlueprintPreview';
import { GovernanceCard } from './governance/GovernanceCard';
import { Card, CardContent } from './ui/card';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

type Process = {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  steps: Array<{
    id: string;
    title: string;
    owner?: string | null;
    positionX: number;
    positionY: number;
  }>;
  links: Array<{
    id: string;
    fromStepId: string;
    toStepId: string;
    label?: string | null;
  }>;
  updatedAt?: string;
};

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

type Blueprint = {
  id: string;
  projectId?: string;
  title: string;
  renderedMarkdown: string;
  contentJson: any;
  metadataJson?: any;
  createdAt: string;
  updatedAt: string;
};

type AiUseCase = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner?: string | null;
  linkedProcessIds?: any;
  linkedOpportunityIds?: any;
  riskAssessment?: {
    id: string;
    riskLevel: string;
    impactAreas: string[];
    dataSensitivity?: string | null;
    summaryText: string;
    risksJson?: any;
    assumptionsJson?: any;
    residualRiskText?: string | null;
  } | null;
  policyMappings?: Array<{
    id: string;
    status: string;
    notes?: string | null;
    aiPolicy: {
      id: string;
      name: string;
      category: string;
      description: string;
    };
  }>;
};

type NextStepSuggestion = {
  label: string;
  actionType: string;
};

type UnifiedWorkspaceViewProps = {
  processes: Process[];
  opportunities: Opportunity[];
  blueprints: Blueprint[];
  aiUseCases: AiUseCase[];
  nextStepSuggestion: NextStepSuggestion | null;
  sessionSummary: string | null;
  highlightId?: string | null;
  onExplainOpportunity: (opportunity: Opportunity) => void;
  onUseOpportunityInBlueprint: (opportunity: Opportunity) => void;
  onRegenerateBlueprint: () => void;
};

export function UnifiedWorkspaceView({
  processes,
  opportunities,
  blueprints,
  aiUseCases,
  nextStepSuggestion,
  sessionSummary,
  highlightId,
  onExplainOpportunity,
  onUseOpportunityInBlueprint,
  onRegenerateBlueprint,
}: UnifiedWorkspaceViewProps) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to section when highlightId changes
  useEffect(() => {
    if (highlightId && sectionRefs.current[highlightId]) {
      sectionRefs.current[highlightId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [highlightId]);

  const hasContent =
    processes.length > 0 ||
    opportunities.length > 0 ||
    blueprints.length > 0 ||
    aiUseCases.length > 0 ||
    sessionSummary;

  return (
    <div className="space-y-6 p-4 h-full">
      {/* Section 1: Next Step Suggestion - Only shown if there's no other content yet */}
      {nextStepSuggestion && !hasContent && (
        <motion.div
          ref={(el) => { sectionRefs.current['next-step'] = el; }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          <Card className="w-full shadow-soft border-brand-200">
            <CardContent className="py-6 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Start your session by describing a process or asking a question.
              </p>
              {nextStepSuggestion && (
                <p className="text-xs font-medium text-brand-700">
                  💡 {nextStepSuggestion.label}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section 2: Processes */}
      {processes.length > 0 && (
        <motion.div
          ref={(el) => { sectionRefs.current['processes'] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-3 text-foreground">Mapped Processes</h2>
          <div className="grid gap-4">
            {processes.map((process) => (
              <ProcessCard
                key={process.id}
                process={process}
                opportunities={opportunities.filter((o) => o.processId === process.id)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 3: Opportunities */}
      {opportunities.length > 0 && (
        <motion.div
          ref={(el) => { sectionRefs.current['opportunities'] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-3 text-foreground">AI Opportunities</h2>
          <div className="grid gap-3">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onExplain={onExplainOpportunity}
                onUseInBlueprint={onUseOpportunityInBlueprint}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 4: Blueprints */}
      {blueprints.length > 0 && (
        <motion.div
          ref={(el) => { sectionRefs.current['blueprints'] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-3 text-foreground">Transformation Blueprint</h2>
          <div className="grid gap-4">
            {blueprints.map((blueprint) => (
              <BlueprintPreview
                key={blueprint.id}
                blueprint={blueprint}
                onRegenerate={onRegenerateBlueprint}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 5: Governance */}
      {aiUseCases.length > 0 && (
        <motion.div
          ref={(el) => { sectionRefs.current['governance'] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-3 text-foreground">AI Governance</h2>
          <div className="grid gap-3">
            {aiUseCases.map((useCase) => (
              <GovernanceCard key={useCase.id} aiUseCase={useCase} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 6: Session Summary */}
      {sessionSummary && (
        <motion.div
          ref={(el) => { sectionRefs.current['summary'] = el; }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-3 text-foreground">Session Summary</h2>
          <Card className="shadow-soft">
            <CardContent className="prose prose-sm max-w-none py-4">
              <ReactMarkdown>{sessionSummary}</ReactMarkdown>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
