'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Loader2, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import { StepDetailsDialog } from '@/components/step-details-dialog';
import { ChatMessageType, ProcessStep as ProcessStepType } from '@/types/process';
import { Badge } from '@/components/ui/badge';

type Process = {
  id: string;
  name: string;
  description?: string;
};

type Opportunity = {
  id: string;
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
  };
};

export default function ProcessMappingPage({
  params,
}: {
  params: { projectId: string; processId: string };
}) {
  const { toast } = useToast();
  const [process, setProcess] = useState<Process | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ProcessStepType | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProcess();
    loadOpportunities();
  }, [params.processId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProcess = async () => {
    try {
      const response = await fetch(
        `/api/processes/${params.processId}?includeGraph=true`
      );
      if (!response.ok) throw new Error('Failed to load process');

      const data = await response.json();
      setProcess(data.process);

      // Convert steps to React Flow nodes
      if (data.process.steps) {
        const flowNodes: Node[] = data.process.steps.map((step: any) => {
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
            nodeStyle.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
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
      }

      // Convert links to React Flow edges
      if (data.process.links) {
        const flowEdges: Edge[] = data.process.links.map((link: any) => ({
          id: link.id,
          source: link.fromStepId,
          target: link.toStepId,
          label: link.label,
          animated: true,
        }));
        setEdges(flowEdges);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load process',
        variant: 'destructive',
      });
    }
  };

  const loadOpportunities = async () => {
    try {
      const response = await fetch(
        `/api/processes/${params.processId}/opportunities`
      );
      if (!response.ok) return; // Silently fail if no opportunities yet

      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      // Silently fail - opportunities are optional
      console.log('No opportunities loaded');
    }
  };

  const scanForOpportunities = async () => {
    setIsScanning(true);
    try {
      const response = await fetch(
        `/api/processes/${params.processId}/scan-opportunities`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to scan for opportunities');

      const data = await response.json();

      toast({
        title: 'Scan complete!',
        description: `Found ${data.count} automation ${data.count === 1 ? 'opportunity' : 'opportunities'}`,
      });

      // Reload opportunities
      await loadOpportunities();

      // Update graph to show heatmap
      await loadProcess();
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: 'Could not analyze process for opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const initChatSession = async () => {
    try {
      const response = await fetch(
        `/api/processes/${params.processId}/chat-sessions`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) throw new Error('Failed to create chat session');

      const data = await response.json();
      setChatSessionId(data.chatSession.id);
      return data.chatSession.id;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    let sessionId = chatSessionId;
    if (!sessionId) {
      sessionId = await initChatSession();
      if (!sessionId) return;
    }

    const userMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI
    const tempUserMsg: ChatMessageType = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMsg,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch(
        `/api/chat-sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: userMsg }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Update messages with real ones from server
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMsg.id)
          .concat([
            {
              id: data.userMessage.id,
              role: data.userMessage.role,
              content: data.userMessage.content,
              createdAt: new Date(data.userMessage.createdAt),
            },
            {
              id: data.assistantMessage.id,
              role: data.assistantMessage.role,
              content: data.assistantMessage.content,
              createdAt: new Date(data.assistantMessage.createdAt),
            },
          ])
      );

      // Update graph with new steps/links
      if (data.updatedGraph) {
        const flowNodes: Node[] = data.updatedGraph.steps.map((step: any) => ({
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
        }));
        setNodes(flowNodes);

        const flowEdges: Edge[] = data.updatedGraph.links.map((link: any) => ({
          id: link.id,
          source: link.fromStepId,
          target: link.toStepId,
          label: link.label,
          animated: true,
        }));
        setEdges(flowEdges);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick: NodeMouseHandler = useCallback(
    async (event, node) => {
      // Load step details
      try {
        const response = await fetch(
          `/api/processes/${params.processId}?includeGraph=true`
        );
        if (!response.ok) throw new Error('Failed to load step');

        const data = await response.json();
        const step = data.process.steps.find((s: any) => s.id === node.id);
        if (step) {
          setSelectedStep({
            id: step.id,
            title: step.title,
            description: step.description,
            owner: step.owner,
            inputs: step.inputs || [],
            outputs: step.outputs || [],
            frequency: step.frequency,
            duration: step.duration,
            positionX: step.positionX,
            positionY: step.positionY,
          });
          setIsStepDialogOpen(true);
        }
      } catch (error) {
        console.error('Error loading step:', error);
      }
    },
    [params.processId]
  );

  const handleUpdateStep = async (stepId: string, updates: any) => {
    try {
      const response = await fetch(
        `/api/processes/${params.processId}/steps/${stepId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) throw new Error('Failed to update step');

      toast({
        title: 'Step updated',
        description: 'Changes saved successfully',
      });

      // Reload process to get updated data
      await loadProcess();
      setIsStepDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Link href={`/projects/${params.projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Processes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{process?.name}</h1>
            {process?.description && (
              <p className="text-sm text-muted-foreground">
                {process.description}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={scanForOpportunities}
          disabled={isScanning || nodes.length === 0}
          className="gap-2"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Scan for AI Opportunities
            </>
          )}
        </Button>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Chat Panel - Left */}
        <div className="col-span-3 flex flex-col border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Process Assistant</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Describe how this process actually works, not how it's supposed to
              work.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>No steps yet. That's normal.</p>
                <p className="mt-2">
                  Start by describing the first step of your process.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe the process steps..."
                className="resize-none"
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="h-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Graph Panel - Center */}
        <div className="col-span-6 border rounded-lg bg-card overflow-hidden relative">
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

          {/* Heatmap Legend */}
          {opportunities.length > 0 && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border text-xs space-y-2">
              <div className="font-semibold mb-2">Impact Level</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-500 bg-amber-100 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 bg-blue-100 rounded"></div>
                <span>Low</span>
              </div>
            </div>
          )}
        </div>

        {/* Opportunities Panel - Right */}
        <div className="col-span-3 flex flex-col border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI Opportunities
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {opportunities.length === 0
                ? 'Click "Scan" to find automation wins'
                : `${opportunities.length} ${opportunities.length === 1 ? 'opportunity' : 'opportunities'} found`}
            </p>
          </div>

          {/* Opportunities List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {opportunities.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 px-4">
                <p className="font-medium mb-2">
                  We didn't find obvious AI wins yet.
                </p>
                <p>
                  Either this process is solid, or someone lied to us.
                </p>
              </div>
            ) : (
              opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    if (opp.stepId) {
                      setHighlightedStepId(opp.stepId);
                      // Reload process to apply highlight
                      loadProcess();
                    }
                  }}
                  onMouseEnter={() => opp.stepId && setHighlightedStepId(opp.stepId)}
                  onMouseLeave={() => setHighlightedStepId(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm flex-1">{opp.title}</h3>
                    <div className="flex gap-1">
                      <Badge
                        variant={
                          opp.impactLevel === 'high'
                            ? 'destructive'
                            : opp.impactLevel === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {opp.impactLevel} impact
                      </Badge>
                    </div>
                  </div>

                  {opp.step && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Step: {opp.step.title}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {opp.rationaleText}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-muted-foreground">
                      Effort: {opp.effortLevel}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Impact: {opp.impactScore}/100
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Step Details Dialog */}
      {selectedStep && (
        <StepDetailsDialog
          step={selectedStep}
          isOpen={isStepDialogOpen}
          onClose={() => setIsStepDialogOpen(false)}
          onUpdate={handleUpdateStep}
        />
      )}
    </div>
  );
}
