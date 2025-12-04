'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Loader2, Sparkles, FolderOpen, Target, FileText, Shield, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AssistantSession = {
  id: string;
  title: string;
  contextSummary: string;
  workspaceId: string;
  linkedProjectId?: string | null;
  metadata: any;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
};

export default function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { data: authSession } = useSession();
  const { toast } = useToast();
  const [session, setSession] = useState<AssistantSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [aiUseCases, setAiUseCases] = useState<any[]>([]);

  useEffect(() => {
    loadSession();
  }, [params.sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    setIsLoadingSession(true);
    try {
      const response = await fetch(`/api/sessions/${params.sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');

      const result = await response.json();
      const sessionData = result.ok && result.data ? result.data.session : result.session;

      setSession(sessionData);

      // Load artifact details
      await loadArtifacts(sessionData.metadata || {});

      // TODO: Load chat messages from session-specific chat history
      // For now, using empty messages array
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

  const loadArtifacts = async (metadata: any) => {
    try {
      // Load processes
      if (metadata.processIds?.length > 0) {
        const processData = await Promise.all(
          metadata.processIds.map(async (id: string) => {
            try {
              const res = await fetch(`/api/processes/${id}`);
              if (res.ok) {
                const result = await res.json();
                return result.ok ? result.data.process : null;
              }
            } catch (err) {
              console.error('Failed to load process:', id, err);
            }
            return null;
          })
        );
        setProcesses(processData.filter(Boolean));
      } else {
        setProcesses([]);
      }

      // Load opportunities
      if (metadata.opportunityIds?.length > 0) {
        const oppData = await Promise.all(
          metadata.opportunityIds.map(async (id: string) => {
            try {
              const res = await fetch(`/api/opportunities/${id}`);
              if (res.ok) {
                const result = await res.json();
                return result.ok ? result.data.opportunity : null;
              }
            } catch (err) {
              console.error('Failed to load opportunity:', id, err);
            }
            return null;
          })
        );
        setOpportunities(oppData.filter(Boolean));
      } else {
        setOpportunities([]);
      }

      // Load blueprints
      if (metadata.blueprintIds?.length > 0) {
        const blueprintData = await Promise.all(
          metadata.blueprintIds.map(async (id: string) => {
            try {
              const res = await fetch(`/api/blueprints/${id}`);
              if (res.ok) {
                const result = await res.json();
                return result.ok ? result.data.blueprint : null;
              }
            } catch (err) {
              console.error('Failed to load blueprint:', id, err);
            }
            return null;
          })
        );
        setBlueprints(blueprintData.filter(Boolean));
      } else {
        setBlueprints([]);
      }

      // Load AI use cases
      if (metadata.aiUseCaseIds?.length > 0) {
        const useCaseData = await Promise.all(
          metadata.aiUseCaseIds.map(async (id: string) => {
            try {
              const res = await fetch(`/api/ai-use-cases/${id}`);
              if (res.ok) {
                const result = await res.json();
                return result.ok ? result.data.aiUseCase : null;
              }
            } catch (err) {
              console.error('Failed to load use case:', id, err);
            }
            return null;
          })
        );
        setAiUseCases(useCaseData.filter(Boolean));
      } else {
        setAiUseCases([]);
      }
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

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

      // Update messages with real response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id)
          .concat([
            {
              id: 'real-user-' + Date.now(),
              role: 'user',
              content: userMsg,
              createdAt: new Date(),
            },
            {
              id: 'real-assistant-' + Date.now(),
              role: 'assistant',
              content: assistantMessage,
              createdAt: new Date(),
            },
          ])
      );

      // Update session state with new metadata
      if (session) {
        setSession({
          ...session,
          metadata: updatedMetadata,
          linkedProjectId: updatedMetadata.projectId || session.linkedProjectId,
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

      // Refresh to update inspector panel
      await loadSession();
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });

      // Remove temp messages on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Extract linked IDs from metadata
  const linkedIds = session?.metadata || {};
  const processIds = linkedIds.processIds || [];
  const blueprintIds = linkedIds.blueprintIds || [];
  const aiUseCaseIds = linkedIds.aiUseCaseIds || [];
  const opportunityIds = linkedIds.opportunityIds || [];

  if (isLoadingSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Session not found</h2>
          <p className="text-muted-foreground mb-4">
            The session you're looking for doesn't exist.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">{session.title}</h1>
            {session.project && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <FolderOpen className="h-3 w-3" />
                {session.project.name}
              </p>
            )}
          </div>
          {session.isDemo && (
            <Badge variant="outline" className="text-xs">
              Demo
            </Badge>
          )}
        </div>
      </div>

      {/* Two-panel layout: Chat (70%) | Inspector (30%) */}
      <div className="flex-1 grid grid-cols-10 gap-0 min-h-0">
        {/* Chat Panel - Left (70%) */}
        <div className="col-span-7 flex flex-col border-r bg-gradient-to-b from-card to-muted/20">
          {/* Chat Header */}
          <div className="p-6 border-b bg-card/80 backdrop-blur-sm">
            <h2 className="font-semibold text-base mb-1">Unified Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Map processes, discover opportunities, and generate blueprints in one conversation
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
                  I'll help you map processes, identify AI use cases, and generate implementation blueprints.
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

          {/* Input */}
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

        {/* Inspector Panel - Right (30%) */}
        <div className="col-span-3 flex flex-col bg-gradient-to-b from-card to-muted/20 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4 py-3 bg-card/80 backdrop-blur-sm">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="workflow" className="text-xs">Workflow</TabsTrigger>
                <TabsTrigger value="governance" className="text-xs">Governance</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-0 p-4 space-y-4">
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Session Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Context</p>
                      <p className="text-foreground">
                        {session.contextSummary || 'No context summary yet'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Created</p>
                      <p className="text-foreground">
                        {new Date(session.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {session.project && (
                  <Card className="rounded-xl border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Linked Project
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/projects/${session.project.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View {session.project.name}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Artifact Summary */}
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Artifacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processes:</span>
                      <span className="font-medium">{processes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opportunities:</span>
                      <span className="font-medium">{opportunities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blueprints:</span>
                      <span className="font-medium">{blueprints.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Use Cases:</span>
                      <span className="font-medium">{aiUseCases.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workflow Tab */}
              <TabsContent value="workflow" className="mt-0 p-4 space-y-4">
                {/* Processes */}
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Processes ({processes.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Process maps created in this session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {processes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No processes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {processes.map((process: any) => (
                          <Link key={process.id} href={`/processes/${process.id}`}>
                            <div className="text-xs p-3 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-border/40">
                              <div className="font-medium mb-1">{process.name}</div>
                              <div className="text-muted-foreground">
                                {process._count?.steps || 0} steps
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Opportunities */}
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Opportunities ({opportunities.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      AI opportunities discovered
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {opportunities.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No opportunities yet</p>
                    ) : (
                      <div className="space-y-2">
                        {opportunities.map((opp: any) => (
                          <div key={opp.id} className="text-xs p-3 rounded bg-muted/40 border border-border/40">
                            <div className="font-medium mb-1">{opp.title}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {opp.impactLevel}
                              </Badge>
                              <span className="text-muted-foreground">
                                Score: {opp.impactScore}/100
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blueprints */}
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Blueprints ({blueprints.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Implementation blueprints generated
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {blueprints.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No blueprints yet</p>
                    ) : (
                      <div className="space-y-2">
                        {blueprints.map((blueprint: any) => (
                          <Link key={blueprint.id} href={`/blueprints/${blueprint.id}`}>
                            <div className="text-xs p-3 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-border/40">
                              <div className="font-medium mb-1">{blueprint.title}</div>
                              <div className="text-muted-foreground">
                                {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Governance Tab */}
              <TabsContent value="governance" className="mt-0 p-4 space-y-4">
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      AI Use Cases ({aiUseCases.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Registered AI use cases for governance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiUseCases.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No AI use cases registered yet</p>
                    ) : (
                      <div className="space-y-2">
                        {aiUseCases.map((useCase: any) => (
                          <Link key={useCase.id} href={`/governance/use-cases/${useCase.id}`}>
                            <div className="text-xs p-3 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-border/40">
                              <div className="font-medium mb-1">{useCase.title}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {useCase.status}
                                </Badge>
                                {useCase.riskAssessment && (
                                  <Badge
                                    variant={
                                      useCase.riskAssessment.riskLevel === 'critical' ? 'destructive' :
                                      useCase.riskAssessment.riskLevel === 'high' ? 'destructive' :
                                      useCase.riskAssessment.riskLevel === 'medium' ? 'default' : 'outline'
                                    }
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {useCase.riskAssessment.riskLevel}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
