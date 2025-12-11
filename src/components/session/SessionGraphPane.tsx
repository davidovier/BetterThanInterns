'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

      // Enhanced node styling with gradients and shadows
      let nodeStyle: any = {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '12px',
        padding: '16px 24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '200px',
      };

      // Apply heatmap styling based on impact level
      if (impactLevel === 'high') {
        nodeStyle.background = 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)';
        nodeStyle.border = '2px solid rgba(239, 68, 68, 0.5)';
        nodeStyle.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
      } else if (impactLevel === 'medium') {
        nodeStyle.background = 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
        nodeStyle.border = '2px solid rgba(234, 88, 12, 0.5)';
        nodeStyle.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.3)';
      } else if (impactLevel === 'low') {
        nodeStyle.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
        nodeStyle.border = '2px solid rgba(59, 130, 246, 0.5)';
        nodeStyle.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
      }

      // Add highlight if this step is selected
      if (highlightedStepId === step.id) {
        nodeStyle.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.6), 0 4px 12px rgba(0,0,0,0.15)';
        nodeStyle.transform = 'scale(1.05)';
      }

      return {
        id: step.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold text-sm">{step.title}</div>
              {step.owner && (
                <div className="text-xs opacity-90 mt-1">{step.owner}</div>
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

    // Convert links to React Flow edges with enhanced styling
    if (process.links) {
      const flowEdges: Edge[] = process.links.map((link) => ({
        id: link.id,
        source: link.fromStepId,
        target: link.toStepId,
        label: link.label || undefined,
        animated: true,
        style: {
          stroke: '#9333ea',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#9333ea',
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
            <MiniMap />
          </ReactFlow>

          {/* Process info overlay */}
          <div
            className={`absolute ${
              processes.length > 1 ? 'top-20' : 'top-4'
            } left-4 bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-medium border border-border/60 flex items-center space-x-3`}
          >
            <div className="text-sm font-medium">{selectedProcess?.name || 'Process'}</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-xs text-muted-foreground">
              {nodes.length} {nodes.length === 1 ? 'step' : 'steps'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full hover:bg-muted"
              title="Click steps to edit details"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Heatmap Legend */}
          {opportunities.some((opp) => opp.processId === selectedProcess?.id) && (
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-medium border border-border/60">
              <div className="text-xs font-semibold mb-3">Impact Level</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-sm" style={{ background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' }}></div>
                  <span className="text-xs">High impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-sm" style={{ background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)' }}></div>
                  <span className="text-xs">Medium impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-sm" style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}></div>
                  <span className="text-xs">Low impact</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center mx-auto mb-4 shadow-soft">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-sm mb-2">No process mapped yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Start by describing a process in the chat, and watch it appear here in real-time
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
