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

      // Apply professional color scheme based on impact level
      // Using a more sophisticated gradient approach with better color harmony
      let nodeStyle: any = {
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '13px',
      };

      if (impactLevel === 'high') {
        // High impact: Deep emerald green (indicates high value/ROI)
        nodeStyle = {
          ...nodeStyle,
          borderColor: '#059669', // emerald-600
          borderWidth: '2.5px',
          backgroundColor: '#d1fae5', // emerald-100
          borderStyle: 'solid',
          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
        };
      } else if (impactLevel === 'medium') {
        // Medium impact: Warm amber (balanced opportunity)
        nodeStyle = {
          ...nodeStyle,
          borderColor: '#d97706', // amber-600
          borderWidth: '2px',
          backgroundColor: '#fef3c7', // amber-100
          borderStyle: 'solid',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.12)',
        };
      } else if (impactLevel === 'low') {
        // Low impact: Soft slate (still valuable but lower priority)
        nodeStyle = {
          ...nodeStyle,
          borderColor: '#64748b', // slate-500
          borderWidth: '2px',
          backgroundColor: '#f1f5f9', // slate-100
          borderStyle: 'solid',
          boxShadow: '0 2px 6px rgba(100, 116, 139, 0.1)',
        };
      } else {
        // No opportunity: Clean neutral
        nodeStyle = {
          ...nodeStyle,
          borderColor: '#e2e8f0', // slate-200
          borderWidth: '2px',
          backgroundColor: '#ffffff',
          borderStyle: 'solid',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        };
      }

      // Add highlight if this step is selected
      if (highlightedStepId === step.id) {
        nodeStyle.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.4), ' + (nodeStyle.boxShadow || '');
        nodeStyle.borderColor = '#6366f1'; // brand-500
      }

      return {
        id: step.id,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-sm leading-tight">{step.title}</div>
              {step.owner && (
                <div className="text-xs text-muted-foreground mt-1">{step.owner}</div>
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
