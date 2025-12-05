'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap as ReactFlowMiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

type ProcessStep = {
  id: string;
  title: string;
  owner?: string | null;
  positionX: number;
  positionY: number;
};

type ProcessLink = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label?: string | null;
};

type ProcessMiniMapProps = {
  steps: ProcessStep[];
  links: ProcessLink[];
  height?: number;
  readOnly?: boolean;
  highlightedStepId?: string | null;
  opportunities?: Array<{ stepId: string | null; impactLevel: 'low' | 'medium' | 'high' }>;
};

export function ProcessMiniMap({
  steps,
  links,
  height = 300,
  readOnly = true,
  highlightedStepId,
  opportunities = [],
}: ProcessMiniMapProps) {
  const nodes: Node[] = useMemo(() => {
    return steps.map((step) => {
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
              <div className="font-medium text-sm">{step.title}</div>
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
  }, [steps, highlightedStepId, opportunities]);

  const edges: Edge[] = useMemo(() => {
    return links.map((link) => ({
      id: link.id,
      source: link.fromStepId,
      target: link.toStepId,
      label: link.label || undefined,
      animated: true,
    }));
  }, [links]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }} className="rounded-xl overflow-hidden border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnScroll={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        {!readOnly && <Controls />}
        <ReactFlowMiniMap
          nodeColor={(node) => {
            if (node.style?.backgroundColor) {
              return node.style.backgroundColor as string;
            }
            return '#e5e7eb';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ backgroundColor: '#f9fafb' }}
        />
      </ReactFlow>
    </div>
  );
}
