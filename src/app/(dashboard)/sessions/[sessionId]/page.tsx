'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Loader2, Sparkles, Target, Wrench, FolderOpen, HelpCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { StepDetailsDialog } from '@/components/process/step-details-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessStep } from '@/types/process';

type AssistantSession = {
  id: string;
  title: string;
  contextSummary: string;
  workspaceId: string;
  metadata: any;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
};

type Process = {
  id: string;
  name: string;
  description?: string | null;
  steps: Array<{
    id: string;
    title: string;
    owner?: string | null;
    positionX: number;
    positionY: number;
  }>;
  links: Array<{
    id: string;
    fromStepId: string;
    toStepId: string;
    label?: string | null;
  }>;
  updatedAt?: string;
};

type Opportunity = {
  id: string;
  processId?: string;
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
  } | null;
};

type Blueprint = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type AiUseCase = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner?: string | null;
  linkedProcessIds?: any;
  linkedOpportunityIds?: any;
};

export default function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { toast } = useToast();
  const [session, setSession] = useState<AssistantSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Process graph state
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);

  // Workspace artifacts state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [aiUseCases, setAiUseCases] = useState<AiUseCase[]>([]);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const selectedProcess = processes[selectedProcessIndex] || null;

  // Memoize process steps by ID for quick lookup
  const processStepsById = useMemo(() => {
    if (!selectedProcess?.steps) return new Map();
    return new Map(selectedProcess.steps.map(step => [step.id, step]));
  }, [selectedProcess]);

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update graph when selected process changes
    if (selectedProcess) {
      updateGraphFromProcess(selectedProcess);
    }
  }, [selectedProcess, opportunities, highlightedStepId]);

  // Scroll to bottom when loading is complete
  useEffect(() => {
    if (!isLoadingSession && messages.length > 0) {
      // Use instant scroll (no smooth) for initial load
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoadingSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    setIsLoadingSession(true);
    try {
      // Load session and artifacts in parallel
      const [sessionRes, messagesRes, artifactsRes] = await Promise.all([
        fetch(`/api/sessions/${params.sessionId}`),
        fetch(`/api/sessions/${params.sessionId}/messages`),
        fetch(`/api/sessions/${params.sessionId}/artifacts`),
      ]);

      if (!sessionRes.ok) throw new Error('Failed to load session');

      const sessionResult = await sessionRes.json();
      const sessionData = sessionResult.ok && sessionResult.data ? sessionResult.data.session : sessionResult.session;
      setSession(sessionData);

      // Load messages
      if (messagesRes.ok) {
        const messagesResult = await messagesRes.json();
        if (messagesResult.ok && messagesResult.data?.messages) {
          const loadedMessages = messagesResult.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            createdAt: new Date(msg.createdAt),
          }));
          setMessages(loadedMessages);
        }
      }

      // Load artifacts (all in one request!)
      if (artifactsRes.ok) {
        const artifactsResult = await artifactsRes.json();
        if (artifactsResult.ok && artifactsResult.data) {
          const { processes, opportunities, blueprints, aiUseCases } = artifactsResult.data;
          setProcesses(processes || []);
          setOpportunities(opportunities || []);
          setBlueprints(blueprints || []);
          setAiUseCases(aiUseCases || []);

          // Select first process by default
          if (processes?.length > 0) {
            updateGraphFromProcess(processes[0]);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load session',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const loadArtifacts = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.sessionId}/artifacts`);
      if (!response.ok) return;

      const result = await response.json();
      if (result.ok && result.data) {
        const { processes, opportunities, blueprints, aiUseCases } = result.data;
        setProcesses(processes || []);
        setOpportunities(opportunities || []);
        setBlueprints(blueprints || []);
        setAiUseCases(aiUseCases || []);
      }
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  const updateGraphFromProcess = useCallback((process: Process) => {
    if (!process.steps) return;

    // Convert steps to React Flow nodes with vertical layout
    const flowNodes: Node[] = process.steps.map((step: any, index: number) => {
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
      const flowEdges: Edge[] = process.links.map((link: any) => ({
        id: link.id,
        source: link.fromStepId,
        target: link.toStepId,
        label: link.label,
        animated: true,
        style: {
          stroke: '#9333ea',
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#9333ea',
        },
      }));
      setEdges(flowEdges);
    }
  }, [opportunities, highlightedStepId, setNodes, setEdges]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Optimistic update
    const tempUserMsg: ChatMessage = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMsg,
      createdAt: new Date(),
    };

    const tempAssistantMsg: ChatMessage = {
      id: 'temp-assistant-' + Date.now(),
      role: 'assistant',
      content: '...',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

    try {
      // Call orchestration endpoint
      const response = await fetch(`/api/sessions/${params.sessionId}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to process message');
      }

      const { assistantMessage, artifacts, updatedMetadata } = result.data;

      // Load messages from database
      const messagesRes = await fetch(`/api/sessions/${params.sessionId}/messages`);
      if (messagesRes.ok) {
        const messagesResult = await messagesRes.json();
        if (messagesResult.ok && messagesResult.data?.messages) {
          const loadedMessages = messagesResult.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            createdAt: new Date(msg.createdAt),
          }));
          setMessages(loadedMessages);
        }
      }

      // Update session state with new metadata
      if (session) {
        setSession({
          ...session,
          metadata: updatedMetadata,
          contextSummary: artifacts.updatedSummary || session.contextSummary,
        });
      }

      // Show success toast for created artifacts
      if (artifacts.createdProcesses?.length > 0) {
        toast({
          title: 'Process Created',
          description: `Created: ${artifacts.createdProcesses.map((p: any) => p.name).join(', ')}`,
        });
      }

      if (artifacts.createdOpportunities?.length > 0) {
        toast({
          title: 'Opportunities Found',
          description: `Identified ${artifacts.createdOpportunities.length} automation opportunities`,
        });
      }

      if (artifacts.createdBlueprints?.length > 0) {
        toast({
          title: 'Blueprint Generated',
          description: `Created: ${artifacts.createdBlueprints.map((b: any) => b.title).join(', ')}`,
        });
      }

      // Refresh artifacts
      await loadArtifacts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick: NodeMouseHandler = useCallback(
    async (event, node) => {
      if (!selectedProcess || !processStepsById.has(node.id)) return;

      const step = processStepsById.get(node.id)!;

      // Fetch full step details if needed
      try {
        const response = await fetch(
          `/api/processes/${selectedProcess.id}/steps/${step.id}`
        );
        if (!response.ok) return;

        const result = await response.json();
        const stepData = result.ok ? result.data.step : null;

        if (stepData) {
          setSelectedStep({
            id: stepData.id,
            title: stepData.title,
            description: stepData.description || undefined,
            owner: stepData.owner || undefined,
            inputs: stepData.inputs || [],
            outputs: stepData.outputs || [],
            frequency: stepData.frequency || undefined,
            duration: stepData.duration || undefined,
            positionX: stepData.positionX,
            positionY: stepData.positionY,
          });
          setIsStepDialogOpen(true);
        }
      } catch (error) {
        console.error('Error loading step:', error);
      }
    },
    [selectedProcess, processStepsById]
  );

  const handleUpdateStep = async (stepId: string, updates: any) => {
    if (!selectedProcess) return;

    try {
      const response = await fetch(
        `/api/processes/${selectedProcess.id}/steps/${stepId}`,
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

      // Reload artifacts
      await loadArtifacts();
      setIsStepDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  const scanForOpportunities = async () => {
    if (!selectedProcess) return;

    setIsScanning(true);
    try {
      const response = await fetch(
        `/api/processes/${selectedProcess.id}/scan-opportunities?sessionId=${params.sessionId}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to scan for opportunities');

      const result = await response.json();
      const count = result.ok && result.data ? result.data.count : result.count;

      toast({
        title: 'Scan complete!',
        description: `Found ${count} automation ${count === 1 ? 'opportunity' : 'opportunities'}`,
      });

      // Reload artifacts
      await loadArtifacts();
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

  if (isLoadingSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">{session?.title}</h1>
          </div>
          {session?.isDemo && (
            <Badge variant="outline" className="text-xs">
              Demo
            </Badge>
          )}
        </div>
        <Button
          onClick={scanForOpportunities}
          disabled={isScanning || !selectedProcess || nodes.length === 0}
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

      {/* Three-panel layout: Chat (30%) | Graph (45%) | Workspace (25%) */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden min-h-0">
        {/* Chat Panel - Left (30%) */}
        <div className="col-span-4 flex flex-col border-r bg-gradient-to-b from-card to-muted/20 overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm shrink-0">
            <h2 className="font-semibold text-base mb-1">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Describe workflows and ask questions about your processes
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <Sparkles className="h-8 w-8 text-brand-500" />
                </div>
                <p className="font-medium mb-2">Ready to start exploring</p>
                <p className="text-xs max-w-md mx-auto">
                  Describe your workflows, ask questions, or explore automation opportunities.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`w-full rounded-2xl px-5 py-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-white border-2 border-slate-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-card/80 backdrop-blur-sm shrink-0">
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
                  placeholder="Describe your process, ask a question, or request a blueprint..."
                  className="resize-none rounded-2xl border-border/60 focus:border-brand-300 focus:ring-brand-200"
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

        {/* Graph Panel - Center (45%) */}
        <div className="col-span-5 relative bg-muted/20">
          {processes.length > 0 ? (
            <>
              {/* Process Tabs */}
              {processes.length > 1 && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <Tabs value={selectedProcessIndex.toString()} onValueChange={(val) => setSelectedProcessIndex(parseInt(val))}>
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
                <MiniMap
                  nodeColor={(node) => {
                    // Color nodes in minimap based on their gradient
                    const style = node.style as any;
                    if (style?.background?.includes('f87171')) return '#ef4444'; // High impact - red
                    if (style?.background?.includes('fb923c')) return '#ea580c'; // Medium impact - orange
                    if (style?.background?.includes('60a5fa')) return '#3b82f6'; // Low impact - blue
                    return '#9333ea'; // Default - purple
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid rgba(147, 51, 234, 0.2)',
                    borderRadius: '12px',
                  }}
                />
              </ReactFlow>

              {/* Process info overlay */}
              <div className={`absolute ${processes.length > 1 ? 'top-20' : 'top-4'} left-4 bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-medium border border-border/60 flex items-center space-x-3`}>
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
              {opportunities.some(opp => opp.processId === selectedProcess?.id) && (
                <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-medium border border-border/60">
                  <div className="text-xs font-semibold mb-3">Impact Level</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded-sm"></div>
                      <span className="text-xs">High impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-orange-500 bg-orange-100 rounded-sm"></div>
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

        {/* Workspace Panel - Right (25%) */}
        <div className="col-span-3 flex flex-col border-l bg-gradient-to-b from-card to-muted/20 overflow-hidden">
          {/* Workspace Header */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm shrink-0">
            <h2 className="font-semibold text-base flex items-center gap-2 mb-1">
              <div className="rounded-full bg-brand-100 p-1.5">
                <Target className="h-4 w-4 text-brand-600" />
              </div>
              Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Opportunities, blueprints & governance
            </p>
          </div>

          {/* Workspace Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* AI Opportunities */}
            {opportunities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">AI Opportunities ({opportunities.length})</h3>
                <div className="space-y-2">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-lg border p-3 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer bg-card"
                      onClick={() => {
                        if (opp.stepId) {
                          setHighlightedStepId(opp.stepId);
                        }
                      }}
                      onMouseEnter={() => opp.stepId && setHighlightedStepId(opp.stepId)}
                      onMouseLeave={() => setHighlightedStepId(null)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-xs flex-1 leading-tight">{opp.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${
                            opp.impactLevel === 'high'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : opp.impactLevel === 'medium'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {opp.impactLevel}
                        </Badge>
                      </div>
                      {opp.step && (
                        <div className="text-xs text-muted-foreground mb-2">
                          → {opp.step.title}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {opp.rationaleText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blueprints */}
            {blueprints.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Blueprints ({blueprints.length})</h3>
                <div className="space-y-2">
                  {blueprints.map((blueprint) => (
                    <div
                      key={blueprint.id}
                      className="rounded-lg border p-3 bg-card"
                    >
                      <h4 className="font-semibold text-xs mb-1">{blueprint.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(blueprint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Governance */}
            {aiUseCases.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">AI Governance ({aiUseCases.length})</h3>
                <div className="space-y-2">
                  {aiUseCases.map((useCase) => (
                    <div
                      key={useCase.id}
                      className="rounded-lg border p-3 bg-card"
                    >
                      <h4 className="font-semibold text-xs mb-1">{useCase.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {useCase.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no artifacts */}
            {opportunities.length === 0 && blueprints.length === 0 && aiUseCases.length === 0 && (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No artifacts yet</p>
                  <p className="text-xs mt-1">Opportunities and blueprints will appear here</p>
                </div>
              </div>
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
