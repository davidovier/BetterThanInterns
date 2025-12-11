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

    // Convert steps to React Flow nodes
    const flowNodes: Node[] = process.steps.map((step) => {
      // Check if this step has an opportunity
      const stepOpportunity = opportunities.find(opp => opp.stepId === step.id);
      const impactLevel = stepOpportunity?.impactLevel;

      // Apply heatmap styling based on impact level
      let nodeStyle: any = {};
      if (impactLevel === 'high') {
        nodeStyle = {
          borderColor: '#ef4444',
          borderWidth: '3px',
          backgroundColor: '#fee2e2',
          borderStyle: 'solid',
        };
      } else if (impactLevel === 'medium') {
        nodeStyle = {
          borderColor: '#f59e0b',
          borderWidth: '2px',
          backgroundColor: '#fef3c7',
          borderStyle: 'solid',
        };
      } else if (impactLevel === 'low') {
        nodeStyle = {
          borderColor: '#3b82f6',
          borderWidth: '2px',
          backgroundColor: '#dbeafe',
          borderStyle: 'solid',
        };
      }

      // Add highlight if this step is selected
      if (highlightedStepId === step.id) {
        nodeStyle.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';
      }

      return {
        id: step.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium">{step.title}</div>
              {step.owner && (
                <div className="text-xs text-muted-foreground">{step.owner}</div>
              )}
            </div>
          ),
        },
        position: { x: step.positionX, y: step.positionY },
        style: nodeStyle,
      };
    });
    setNodes(flowNodes);

    // Convert links to React Flow edges
    if (process.links) {
      const flowEdges: Edge[] = process.links.map((link) => ({
        id: link.id,
        source: link.fromStepId,
        target: link.toStepId,
        label: link.label || undefined,
        animated: true,
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
                  <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded-sm"></div>
                  <span className="text-xs">High impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-500 bg-amber-100 rounded-sm"></div>
                  <span className="text-xs">Medium impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 bg-blue-100 rounded-sm"></div>
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
