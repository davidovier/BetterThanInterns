'use client';

import { useEffect, useRef, useState } from 'react';
import { SessionArtifacts } from '@/types/artifacts';
import { ProcessCard } from '@/components/artifacts/ProcessCard';
import { OpportunityCard } from '@/components/artifacts/OpportunityCard';
import { BlueprintCard } from '@/components/artifacts/BlueprintCard';
import { GovernanceCard } from '@/components/artifacts/GovernanceCard';
import { Button } from '@/components/ui/button';
import { Inbox, ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SessionArtifactPaneProps = {
  artifacts: SessionArtifacts;
  highlightedArtifactId?: string | null;
  onArtifactClick?: (artifactId: string, artifactType: string) => void;
  // M16: Scan for opportunities callback
  onScanForOpportunities?: () => void;
  // M17.1: Callback fired after artifacts are rendered
  onArtifactsRendered?: () => void;
  // M17.1 Verification: Only fire callback when parent expects it
  shouldConfirmRender?: boolean;
  // M20: First-run detection
  isFirstRun?: boolean;
  // M21: Scroll target refs for Continue Work behavior
  outputsPaneRef?: React.RefObject<HTMLDivElement>;
  governanceRef?: React.RefObject<HTMLDivElement>;
};

export function SessionArtifactPane({
  artifacts,
  highlightedArtifactId,
  onArtifactClick,
  onScanForOpportunities,
  onArtifactsRendered,
  shouldConfirmRender = false,
  isFirstRun = false,
  outputsPaneRef,
  governanceRef,
}: SessionArtifactPaneProps) {
  const artifactRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    processes: true,
    opportunities: true,
    blueprints: true,
    aiUseCases: true,
  });

  // M16: Dismissible scan suggestion state
  const [showScanSuggestion, setShowScanSuggestion] = useState(true);

  // M16: Check if we should show the scan suggestion pill
  // Show when: at least 1 process with >=2 steps AND no opportunities
  const hasProcessWithSteps = artifacts.processes.some(p => (p._count?.steps || p.steps?.length || 0) >= 2);
  const hasOpportunities = artifacts.opportunities.length > 0;
  const shouldShowScanSuggestion = hasProcessWithSteps && !hasOpportunities && showScanSuggestion;

  // Auto-scroll to highlighted artifact
  useEffect(() => {
    if (highlightedArtifactId && artifactRefs.current[highlightedArtifactId]) {
      artifactRefs.current[highlightedArtifactId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedArtifactId]);

  // M17.1 Verification: Stable, cheap artifact signature (no JSON.stringify)
  const processIdsSorted = artifacts.processes.map(p => p.id).sort();
  const opportunityIdsSorted = artifacts.opportunities.map(o => o.id).sort();
  const blueprintIdsSorted = artifacts.blueprints.map(b => b.id).sort();
  const aiUseCaseIdsSorted = artifacts.aiUseCases.map(g => g.id).sort();

  const artifactSignature =
    `p:${processIdsSorted.join(',')}` +
    `|o:${opportunityIdsSorted.join(',')}` +
    `|b:${blueprintIdsSorted.join(',')}` +
    `|g:${aiUseCaseIdsSorted.join(',')}` +
    `|pc:${artifacts.processes.length}` +
    `|oc:${artifacts.opportunities.length}` +
    `|bc:${artifacts.blueprints.length}` +
    `|gc:${artifacts.aiUseCases.length}`;

  useEffect(() => {
    // M17.1 Verification: Only fire callback when parent expects it
    if (onArtifactsRendered && shouldConfirmRender) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        onArtifactsRendered();
      });
    }
  }, [artifactSignature, onArtifactsRendered, shouldConfirmRender]);

  const hasAnyArtifacts =
    artifacts.processes.length > 0 ||
    artifacts.opportunities.length > 0 ||
    artifacts.blueprints.length > 0 ||
    artifacts.aiUseCases.length > 0;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full overflow-y-auto bg-card">
      {/* M19: "Outputs from this session" Header */}
      <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Outputs from this session
        </h2>
        {hasAnyArtifacts && (
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Created in this session
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* M16: Scan Suggestion Pill */}
        <AnimatePresence>
          {shouldShowScanSuggestion && onScanForOpportunities && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-200 rounded-xl p-3">
                <button
                  onClick={() => setShowScanSuggestion(false)}
                  className="absolute top-2 right-2 p-1 hover:bg-white/80 rounded-full transition-colors"
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
                <div className="pr-6">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">
                        Ready to find automation opportunities.
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Scan your process to identify where AI can help save time.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      onScanForOpportunities();
                      setShowScanSuggestion(false);
                    }}
                    size="sm"
                    variant="brand"
                    className="w-full text-xs h-8"
                  >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Scan for Opportunities
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* M20: Empty State - First-run specific copy */}
        {!hasAnyArtifacts && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
              {isFirstRun
                ? 'Outputs will appear here as processes are identified and decisions are made.'
                : 'Outputs will appear as work progresses.'}
            </p>
          </div>
        )}

        {/* M19/M21: Processes Section - Grouped outputs */}
        {artifacts.processes.length > 0 && (
          <div className="mb-5" ref={outputsPaneRef}>
            <button
              onClick={() => toggleSection('processes')}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-muted/50 rounded transition-colors mb-2"
            >
              <div className="flex items-center gap-2">
                {expandedSections.processes ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Processes Identified
                </h3>
                <span className="text-[10px] text-muted-foreground/70">({artifacts.processes.length})</span>
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

        {/* M19: Opportunities Section */}
        {artifacts.opportunities.length > 0 && (
          <div className="mb-5">
            <button
              onClick={() => toggleSection('opportunities')}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-muted/50 rounded transition-colors mb-2"
            >
              <div className="flex items-center gap-2">
                {expandedSections.opportunities ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Opportunities Discovered
                </h3>
                <span className="text-[10px] text-muted-foreground/70">({artifacts.opportunities.length})</span>
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

        {/* M19: Blueprints Section - Decision gravity (heavier border) */}
        {artifacts.blueprints.length > 0 && (
          <div className="mb-5 pb-4 border-b-2 border-border">
            <button
              onClick={() => toggleSection('blueprints')}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-muted/50 rounded transition-colors mb-2"
            >
              <div className="flex items-center gap-2">
                {expandedSections.blueprints ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">
                  Blueprints
                </h3>
                <span className="text-[10px] text-muted-foreground/70">({artifacts.blueprints.length})</span>
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

        {/* M19/M21: AI Use Cases Section - Decision gravity (governance = heavier) */}
        {artifacts.aiUseCases.length > 0 && (
          <div className="mb-5 pb-4 border-b-2 border-border" ref={governanceRef}>
            <button
              onClick={() => toggleSection('aiUseCases')}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-muted/50 rounded transition-colors mb-2"
            >
              <div className="flex items-center gap-2">
                {expandedSections.aiUseCases ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">
                  Governance & Decisions
                </h3>
                <span className="text-[10px] text-muted-foreground/70">({artifacts.aiUseCases.length})</span>
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
