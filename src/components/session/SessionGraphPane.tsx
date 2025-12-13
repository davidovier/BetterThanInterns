'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessArtifact, OpportunityArtifact } from '@/types/artifacts';

type SessionGraphPaneProps = {
  processes: ProcessArtifact[];
  opportunities: OpportunityArtifact[];
  selectedProcessIndex: number;
  highlightedStepId?: string | null;
  onProcessSelect: (index: number) => void;
  onStepClick: (stepId: string, processId: string) => void;
};

// M22: Transform procedural labels to outcome-focused language
function deriveExecutiveLabel(proceduralLabel: string): string {
  const label = proceduralLabel.trim();

  // Convert to sentence case, outcome-focused phrasing
  // Remove procedural verbs like "validate", "click", "enter", "update"
  // Favor completed states over actions

  const transformations: Record<string, string> = {
    // Common patterns - procedural → outcome
    'validate invoice': 'Invoice verified for payment',
    'approve request': 'Request approved',
    'review document': 'Document reviewed',
    'check vendor': 'Vendor checked',
    'enter data': 'Data entered',
    'update system': 'System updated',
    'send email': 'Email sent',
    'create report': 'Report created',
    'assign task': 'Task assigned',
  };

  const lowerLabel = label.toLowerCase();

  // Check for exact transformations
  if (transformations[lowerLabel]) {
    return transformations[lowerLabel];
  }

  // Simple heuristic: if starts with verb, try to convert to past/outcome
  // "Process invoice" → "Invoice processed"
  // "Verify payment" → "Payment verified"
  const verbPatterns = [
    { from: /^process (.+)/i, to: (match: string[]) => `${match[1]} processed` },
    { from: /^verify (.+)/i, to: (match: string[]) => `${match[1]} verified` },
    { from: /^validate (.+)/i, to: (match: string[]) => `${match[1]} validated` },
    { from: /^approve (.+)/i, to: (match: string[]) => `${match[1]} approved` },
    { from: /^review (.+)/i, to: (match: string[]) => `${match[1]} reviewed` },
    { from: /^check (.+)/i, to: (match: string[]) => `${match[1]} checked` },
    { from: /^send (.+)/i, to: (match: string[]) => `${match[1]} sent` },
    { from: /^create (.+)/i, to: (match: string[]) => `${match[1]} created` },
  ];

  for (const pattern of verbPatterns) {
    const match = label.match(pattern.from);
    if (match) {
      return pattern.to(match);
    }
  }

  // Fallback: capitalize first letter only (sentence case)
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

export function SessionGraphPane({
  processes,
  opportunities,
  selectedProcessIndex,
  highlightedStepId,
  onProcessSelect,
  onStepClick,
}: SessionGraphPaneProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const selectedProcess = processes[selectedProcessIndex] || null;

  // Update graph whenever process, opportunities, or highlighted step changes
  React.useEffect(() => {
    if (selectedProcess) {
      updateGraphFromProcess(selectedProcess);
    }
  }, [selectedProcess, opportunities, highlightedStepId]);

  const updateGraphFromProcess = (process: ProcessArtifact) => {
    if (!process.steps) return;

    // Convert steps to React Flow nodes with vertical layout
    const flowNodes: Node[] = process.steps.map((step, index) => {
      // Check if this step has an opportunity
      const stepOpportunity = opportunities.find(opp => opp.stepId === step.id);
      const impactLevel = stepOpportunity?.impactLevel;

      // M22: Check if step is a bottleneck (high friction based on duration/frequency)
      const isBottleneck = step.duration && parseFloat(step.duration) > 60; // >60 min is high friction

      // M22: Base node styling - executive readability
      let nodeStyle: any = {
        background: '#ffffff',
        color: '#1f2937',
        border: '1px solid #d1d5db', // Slightly darker base border for clarity
        borderRadius: '8px',
        padding: '14px 18px', // Slightly more padding for readability
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', // Softer shadow
        minWidth: '200px',
      };

      // M22: Bottleneck emphasis - heavier border, darker text (no color)
      if (isBottleneck) {
        nodeStyle.borderWidth = '2px';
        nodeStyle.borderColor = '#6b7280'; // Darker gray for emphasis
        nodeStyle.color = '#111827'; // Darker text
        nodeStyle.fontWeight = '500';
      }

      // M22: Leverage emphasis - thin left accent for opportunity presence
      if (stepOpportunity) {
        nodeStyle.borderLeft = '3px solid #374151'; // Brand-700 equivalent, subtle accent
      }

      // Add subtle highlight if this step is selected
      if (highlightedStepId === step.id) {
        nodeStyle.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
      }

      // M22: Derive executive label
      const executiveLabel = deriveExecutiveLabel(step.title);

      return {
        id: step.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-sm leading-snug">{executiveLabel}</div>
              {step.owner && (
                <div className="text-xs text-slate-500 mt-1.5">{step.owner}</div>
              )}
              {/* M22: Opportunity presence annotation (subtle, below owner) */}
              {stepOpportunity && (
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Automation potential identified
                </div>
              )}
            </div>
          ),
        },
        // M22: Vertical layout with increased spacing for executive readability
        position: { x: 100, y: index * 180 },
        style: nodeStyle,
      };
    });
    setNodes(flowNodes);

    // M22: Convert links to React Flow edges with executive-appropriate styling
    if (process.links) {
      const flowEdges: Edge[] = process.links.map((link) => ({
        id: link.id,
        source: link.fromStepId,
        target: link.toStepId,
        label: link.label || undefined,
        animated: false, // M22: Remove animation for calm, document-like feel
        style: {
          stroke: '#d1d5db', // Lighter, less prominent edges
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#d1d5db',
        },
      }));
      setEdges(flowEdges);
    }
  };

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      if (!selectedProcess) return;
      onStepClick(node.id, selectedProcess.id);
    },
    [selectedProcess, onStepClick]
  );

  return (
    <div className="h-full relative bg-muted/20">
      {processes.length > 0 ? (
        <>
          {/* Process Tabs */}
          {processes.length > 1 && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <Tabs
                value={selectedProcessIndex.toString()}
                onValueChange={(val) => onProcessSelect(parseInt(val))}
              >
                <TabsList className="bg-card/95 backdrop-blur-sm">
                  {processes.map((proc, idx) => (
                    <TabsTrigger key={proc.id} value={idx.toString()} className="text-xs">
                      {proc.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </>
      ) : (
        // M16: Empty Graph State
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto shadow-sm border border-slate-200">
              <Sparkles className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-2">
                Your process map will appear here
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Describe a workflow in the chat and we'll sketch it out for you. No need for perfect
                wording—start with "First we... then we..."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
