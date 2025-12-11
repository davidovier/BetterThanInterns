'use client';

import { useEffect, useRef } from 'react';
import { SessionArtifacts } from '@/types/artifacts';
import { ProcessCard } from '@/components/artifacts/ProcessCard';
import { OpportunityCard } from '@/components/artifacts/OpportunityCard';
import { BlueprintCard } from '@/components/artifacts/BlueprintCard';
import { GovernanceCard } from '@/components/artifacts/GovernanceCard';
import { Inbox } from 'lucide-react';

type SessionArtifactPaneProps = {
  artifacts: SessionArtifacts;
  highlightedArtifactId?: string | null;
  onArtifactClick?: (artifactId: string, artifactType: string) => void;
};

export function SessionArtifactPane({
  artifacts,
  highlightedArtifactId,
  onArtifactClick,
}: SessionArtifactPaneProps) {
  const artifactRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to highlighted artifact
  useEffect(() => {
    if (highlightedArtifactId && artifactRefs.current[highlightedArtifactId]) {
      artifactRefs.current[highlightedArtifactId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedArtifactId]);

  const hasAnyArtifacts =
    artifacts.processes.length > 0 ||
    artifacts.opportunities.length > 0 ||
    artifacts.blueprints.length > 0 ||
    artifacts.aiUseCases.length > 0;

  return (
    <div className="h-full overflow-y-auto p-4 bg-muted/10">
      <div className="space-y-4">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold">Artifacts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {hasAnyArtifacts
              ? 'AI-generated insights and deliverables'
              : 'Start chatting to generate artifacts'}
          </p>
        </div>

        {/* Empty State */}
        {!hasAnyArtifacts && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No artifacts yet</h3>
            <p className="text-sm text-muted-foreground/70 max-w-sm">
              Describe your processes, ask for analysis, or request blueprints to get started
            </p>
          </div>
        )}

        {/* Processes */}
        {artifacts.processes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Processes ({artifacts.processes.length})
            </h3>
            {artifacts.processes.map((process) => (
              <div
                key={process.id}
                ref={(el) => { artifactRefs.current[process.id] = el; }}
                onClick={() => onArtifactClick?.(process.id, 'process')}
              >
                <ProcessCard
                  process={process}
                  isNew={highlightedArtifactId === process.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Opportunities */}
        {artifacts.opportunities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Opportunities ({artifacts.opportunities.length})
            </h3>
            {artifacts.opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                ref={(el) => { artifactRefs.current[opportunity.id] = el; }}
                onClick={() => onArtifactClick?.(opportunity.id, 'opportunity')}
              >
                <OpportunityCard
                  opportunity={opportunity}
                  isNew={highlightedArtifactId === opportunity.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Blueprints */}
        {artifacts.blueprints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Blueprints ({artifacts.blueprints.length})
            </h3>
            {artifacts.blueprints.map((blueprint) => (
              <div
                key={blueprint.id}
                ref={(el) => { artifactRefs.current[blueprint.id] = el; }}
                onClick={() => onArtifactClick?.(blueprint.id, 'blueprint')}
              >
                <BlueprintCard
                  blueprint={blueprint}
                  isNew={highlightedArtifactId === blueprint.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* AI Use Cases / Governance */}
        {artifacts.aiUseCases.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              AI Use Cases ({artifacts.aiUseCases.length})
            </h3>
            {artifacts.aiUseCases.map((aiUseCase) => (
              <div
                key={aiUseCase.id}
                ref={(el) => { artifactRefs.current[aiUseCase.id] = el; }}
                onClick={() => onArtifactClick?.(aiUseCase.id, 'aiUseCase')}
              >
                <GovernanceCard
                  aiUseCase={aiUseCase}
                  isNew={highlightedArtifactId === aiUseCase.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
