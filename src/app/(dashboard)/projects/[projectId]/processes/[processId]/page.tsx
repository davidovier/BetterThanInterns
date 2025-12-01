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
import { Send, ArrowLeft, Loader2, Sparkles, Target, Wrench, X, Lightbulb, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { StepDetailsDialog } from '@/components/step-details-dialog';
import { ToolRecommendationsDialog } from '@/components/tool-recommendations-dialog';
import { DebugPanel } from '@/components/debug-panel';
import { ChatMessageType, ProcessStep as ProcessStepType } from '@/types/process';
import { Badge } from '@/components/ui/badge';

type Process = {
  id: string;
  name: string;
  description?: string;
  project?: {
    id: string;
    name: string;
  };
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
  const [selectedOpportunityForTools, setSelectedOpportunityForTools] = useState<Opportunity | null>(null);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [lastChatDebugPayload, setLastChatDebugPayload] = useState<any | null>(null);
  const [showFirstRunHint, setShowFirstRunHint] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDemoProject = process?.project?.name?.startsWith('Demo – ');
  const shouldShowHint = isDemoProject && messages.length === 0 && showFirstRunHint;

  useEffect(() => {
    loadProcess();
    loadOpportunities();
    loadChatSession();
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

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const processData = result.ok && result.data ? result.data.process : result.process;
      setProcess(processData);

      // Convert steps to React Flow nodes
      if (processData.steps) {
        const flowNodes: Node[] = processData.steps.map((step: any) => {
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
      }

      // Convert links to React Flow edges
      if (processData.links) {
        const flowEdges: Edge[] = processData.links.map((link: any) => ({
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

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const opportunitiesData = result.ok && result.data ? result.data.opportunities : result.opportunities;

      setOpportunities(opportunitiesData || []);
    } catch (error) {
      // Silently fail - opportunities are optional
      console.log('No opportunities loaded');
    }
  };

  const loadChatSession = async () => {
    try {
      const response = await fetch(
        `/api/processes/${params.processId}/chat-sessions`
      );
      if (!response.ok) return; // Silently fail if no session yet

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const chatSession = result.ok && result.data ? result.data.chatSession : result.chatSession;

      if (chatSession) {
        setChatSessionId(chatSession.id);
        setMessages(chatSession.messages || []);
      }
    } catch (error) {
      // Silently fail - chat session is optional
      console.log('No chat session loaded');
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

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const count = result.ok && result.data ? result.data.count : result.count;

      toast({
        title: 'Scan complete!',
        description: `Found ${count} automation ${count === 1 ? 'opportunity' : 'opportunities'}`,
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

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const chatSession = result.ok && result.data ? result.data.chatSession : result.chatSession;

      setChatSessionId(chatSession.id);
      return chatSession.id;
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

    // Add user message to UI (optimistic update)
    const tempUserMsg: ChatMessageType = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMsg,
      createdAt: new Date(),
    };

    // Add loading assistant message (optimistic placeholder)
    const tempAssistantMsg: ChatMessageType = {
      id: 'temp-assistant-' + Date.now(),
      role: 'assistant',
      content: '...',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

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

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const data = result.ok && result.data ? result.data : result;

      // 🔧 Capture debug payload for developer analysis
      setLastChatDebugPayload({
        workflowDelta: data.workflowDelta || null,
        updatedGraph: data.updatedGraph || null,
        userMessage: data.userMessage || null,
        assistantMessage: data.assistantMessage || null,
        timestamp: new Date().toISOString(),
        raw: result,
      });

      // Update messages with real ones from server (replace optimistic placeholders)
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id)
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

        const result = await response.json();

        // Handle new API response format { ok: true, data: {...} }
        const processData = result.ok && result.data ? result.data.process : result.process;

        const step = processData.steps.find((s: any) => s.id === node.id);
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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link href={`/projects/${params.projectId}`}>
            <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">{process?.name || 'Process Mapping'}</h1>
          </div>
        </div>
        <Button
          onClick={scanForOpportunities}
          disabled={isScanning || nodes.length === 0}
          className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Scanning...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Scan for Opportunities
            </>
          )}
        </Button>
      </div>

      {/* Three-panel layout: Chat (30%) | Graph (45%) | Opportunities (25%) */}
      <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
        {/* Chat Panel - Left (30-35%) */}
        <div className="col-span-4 flex flex-col border-r bg-gradient-to-b from-card to-muted/20">
          {/* Chat Header */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm">
            <h2 className="font-semibold text-base mb-1">Process Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Describe how this process actually works
            </p>
          </div>

          {/* Messages - Bubble UI */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* First-run hint for demo projects */}
            {shouldShowHint && (
              <div className="bg-gradient-to-br from-warm-50 to-warm-100/50 border border-warm-200 rounded-2xl p-4 shadow-soft animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="rounded-full bg-warm-100 p-2 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-warm-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-warm-900 mb-2">
                        Try this to see how it works
                      </p>
                      <p className="text-xs text-warm-700 mb-2">
                        Paste a short description like:
                      </p>
                      <p className="text-xs italic text-warm-600 bg-white/60 rounded-lg p-2 mb-2">
                        "We receive invoices by email, someone types them into a spreadsheet,
                        then a manager approves them before payment."
                      </p>
                      <p className="text-xs text-warm-700">
                        Then hit send and watch the graph update in real-time.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFirstRunHint(false)}
                    className="ml-2 h-6 w-6 p-0 flex-shrink-0 hover:bg-warm-200/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {messages.length === 0 && !shouldShowHint && (
              <div className="text-center text-muted-foreground text-sm py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <Sparkles className="h-8 w-8 text-brand-500" />
                </div>
                <p className="font-medium mb-2">No steps yet. That's normal.</p>
                <p className="text-xs">
                  Start by describing the first step of your process.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-soft ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
                      : 'bg-card border border-border/60'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Sticky at bottom with rounded-full style */}
          <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
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
                  className="resize-none rounded-2xl border-border/60 focus:border-brand-300 focus:ring-brand-200 pr-12"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="h-auto rounded-full bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Graph Panel - Center (45-50%) */}
        <div className="col-span-5 relative bg-muted/20">
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

          {/* Top overlay chip with process info */}
          <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-medium border border-border/60 flex items-center space-x-3">
            <div className="text-sm font-medium">{process?.name || 'Workflow'}</div>
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

          {/* Heatmap Legend - Bottom right */}
          {opportunities.length > 0 && (
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
        </div>

        {/* Opportunities Panel - Right (20-25%) */}
        <div className="col-span-3 flex flex-col border-l bg-gradient-to-b from-card to-muted/20">
          {/* Opportunities Header */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm">
            <h2 className="font-semibold text-base flex items-center gap-2 mb-1">
              <div className="rounded-full bg-brand-100 p-1.5">
                <Target className="h-4 w-4 text-brand-600" />
              </div>
              AI Opportunities
            </h2>
            <p className="text-xs text-muted-foreground">
              {opportunities.length === 0
                ? 'Scan to find automation wins'
                : `${opportunities.length} found`}
            </p>
          </div>

          {/* Opportunities List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {opportunities.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <Target className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-medium mb-2 text-xs">
                  No opportunities found yet
                </p>
                <p className="text-xs">
                  Map some steps, then click "Scan" to find automation wins.
                </p>
              </div>
            ) : (
              opportunities.map((opp, index) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-border/60 bg-card shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[1px] transition-all overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className="cursor-pointer p-4 hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      if (opp.stepId) {
                        setHighlightedStepId(opp.stepId);
                        loadProcess();
                      }
                    }}
                    onMouseEnter={() => opp.stepId && setHighlightedStepId(opp.stepId)}
                    onMouseLeave={() => setHighlightedStepId(null)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-sm flex-1 leading-tight">{opp.title}</h3>
                      <Badge
                        variant={
                          opp.impactLevel === 'high'
                            ? 'destructive'
                            : opp.impactLevel === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs shrink-0"
                      >
                        {opp.impactLevel}
                      </Badge>
                    </div>

                    {opp.step && (
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <span className="font-medium">Step:</span> {opp.step.title}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {opp.rationaleText}
                    </p>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Effort:</span>
                        <span className="font-medium">{opp.effortLevel}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-medium">{opp.impactScore}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 rounded-lg hover:-translate-y-[1px] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOpportunityForTools(opp);
                        setIsToolDialogOpen(true);
                      }}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      View Tools
                    </Button>
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

      {/* Tool Recommendations Dialog */}
      {selectedOpportunityForTools && (
        <ToolRecommendationsDialog
          opportunityId={selectedOpportunityForTools.id}
          opportunityTitle={selectedOpportunityForTools.title}
          isOpen={isToolDialogOpen}
          onClose={() => {
            setIsToolDialogOpen(false);
            setSelectedOpportunityForTools(null);
          }}
        />
      )}

      {/* Debug Panel - Dev Only */}
      <DebugPanel
        title="Debug – Last Process Assistant Response"
        data={lastChatDebugPayload}
      />
    </div>
  );
}
