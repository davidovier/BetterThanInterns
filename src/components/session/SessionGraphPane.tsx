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

      // Subtle node styling - clean and minimal
      let nodeStyle: any = {
        background: '#ffffff',
        color: '#1f2937',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minWidth: '180px',
      };

      // Subtle heatmap styling based on impact level
      if (impactLevel === 'high') {
        nodeStyle.borderColor = '#ef4444';
        nodeStyle.borderWidth = '2px';
        nodeStyle.backgroundColor = '#fef2f2';
      } else if (impactLevel === 'medium') {
        nodeStyle.borderColor = '#f59e0b';
        nodeStyle.borderWidth = '2px';
        nodeStyle.backgroundColor = '#fffbeb';
      } else if (impactLevel === 'low') {
        nodeStyle.borderColor = '#3b82f6';
        nodeStyle.borderWidth = '2px';
        nodeStyle.backgroundColor = '#eff6ff';
      }

      // Add subtle highlight if this step is selected
      if (highlightedStepId === step.id) {
        nodeStyle.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
      }

      return {
        id: step.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-sm">{step.title}</div>
              {step.owner && (
                <div className="text-xs text-muted-foreground mt-1">{step.owner}</div>
              )}
            </div>
          ),
        },
        // Vertical layout: x stays centered, y increases for each step
        position: { x: 100, y: index * 150 },
        style: nodeStyle,
      };
    });
    setNodes(flowNodes);

    // Convert links to React Flow edges with subtle styling
    if (process.links) {
      const flowEdges: Edge[] = process.links.map((link) => ({
        id: link.id,
        source: link.fromStepId,
        target: link.toStepId,
        label: link.label || undefined,
        animated: true,
        style: {
          stroke: '#9ca3af',
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#9ca3af',
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

          {/* Heatmap Legend */}
          {opportunities.some((opp) => opp.processId === selectedProcess?.id) && (
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-border">
              <div className="text-xs font-medium mb-2 text-muted-foreground">Impact Level</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50"></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-50"></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50"></div>
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </div>
          )}
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
