'use client';

import { useEffect, useRef, useState } from 'react';
import { SessionArtifacts } from '@/types/artifacts';
import { ProcessCard } from '@/components/artifacts/ProcessCard';
import { OpportunityCard } from '@/components/artifacts/OpportunityCard';
import { BlueprintCard } from '@/components/artifacts/BlueprintCard';
import { GovernanceCard } from '@/components/artifacts/GovernanceCard';
import { Inbox, ChevronDown, ChevronRight } from 'lucide-react';

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

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    processes: true,
    opportunities: true,
    blueprints: true,
    aiUseCases: true,
  });

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Artifacts</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {hasAnyArtifacts
            ? 'AI-generated insights and deliverables'
            : 'Start chatting to generate artifacts'}
        </p>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Empty State */}
        {!hasAnyArtifacts && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-600 mb-1">No artifacts yet</h3>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Describe your processes or request analysis to get started
            </p>
          </div>
        )}

        {/* Processes Section */}
        {artifacts.processes.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('processes')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors mb-2"
            >
              <div className="flex items-center gap-1.5">
                {expandedSections.processes ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
                <h3 className="text-xs font-semibold text-slate-700">
                  Processes
                </h3>
                <span className="text-xs text-slate-400">({artifacts.processes.length})</span>
              </div>
            </button>

            {expandedSections.processes && (
              <div className="grid grid-cols-1 gap-2">
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
          </div>
        )}

        {/* Opportunities Section */}
        {artifacts.opportunities.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('opportunities')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors mb-2"
            >
              <div className="flex items-center gap-1.5">
                {expandedSections.opportunities ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
                <h3 className="text-xs font-semibold text-slate-700">
                  Opportunities
                </h3>
                <span className="text-xs text-slate-400">({artifacts.opportunities.length})</span>
              </div>
            </button>

            {expandedSections.opportunities && (
              <div className="grid grid-cols-1 gap-2">
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
          </div>
        )}

        {/* Blueprints Section */}
        {artifacts.blueprints.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('blueprints')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors mb-2"
            >
              <div className="flex items-center gap-1.5">
                {expandedSections.blueprints ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
                <h3 className="text-xs font-semibold text-slate-700">
                  Blueprints
                </h3>
                <span className="text-xs text-slate-400">({artifacts.blueprints.length})</span>
              </div>
            </button>

            {expandedSections.blueprints && (
              <div className="grid grid-cols-1 gap-2">
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
          </div>
        )}

        {/* AI Use Cases Section */}
        {artifacts.aiUseCases.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('aiUseCases')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors mb-2"
            >
              <div className="flex items-center gap-1.5">
                {expandedSections.aiUseCases ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
                <h3 className="text-xs font-semibold text-slate-700">
                  AI Use Cases
                </h3>
                <span className="text-xs text-slate-400">({artifacts.aiUseCases.length})</span>
              </div>
            </button>

            {expandedSections.aiUseCases && (
              <div className="grid grid-cols-1 gap-2">
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
        )}
      </div>
    </div>
  );
}
