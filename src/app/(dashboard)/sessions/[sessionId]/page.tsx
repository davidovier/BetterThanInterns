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
      // TODO: Implement session-specific chat API endpoint
      // For now, simulating a response
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantResponse = "This is a placeholder response. The unified assistant API will be implemented to handle session-based conversations, process mapping, opportunity discovery, and blueprint generation.";

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
              content: assistantResponse,
              createdAt: new Date(),
            },
          ])
      );
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
              </TabsContent>

              {/* Workflow Tab */}
              <TabsContent value="workflow" className="mt-0 p-4 space-y-4">
                {/* Processes */}
                <Card className="rounded-xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Processes ({processIds.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Process maps created in this session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {processIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No processes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {processIds.map((id: string) => (
                          <div key={id} className="text-xs p-2 rounded bg-muted/40">
                            Process {id.slice(0, 8)}
                          </div>
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
                      Opportunities ({opportunityIds.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      AI opportunities discovered
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {opportunityIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No opportunities yet</p>
                    ) : (
                      <div className="space-y-2">
                        {opportunityIds.map((id: string) => (
                          <div key={id} className="text-xs p-2 rounded bg-muted/40">
                            Opportunity {id.slice(0, 8)}
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
                      Blueprints ({blueprintIds.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Implementation blueprints generated
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {blueprintIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No blueprints yet</p>
                    ) : (
                      <div className="space-y-2">
                        {blueprintIds.map((id: string) => (
                          <div key={id} className="text-xs p-2 rounded bg-muted/40">
                            Blueprint {id.slice(0, 8)}
                          </div>
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
                      AI Use Cases ({aiUseCaseIds.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Registered AI use cases for governance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiUseCaseIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No AI use cases registered yet</p>
                    ) : (
                      <div className="space-y-2">
                        {aiUseCaseIds.map((id: string) => (
                          <Link key={id} href={`/governance/use-cases/${id}`}>
                            <div className="text-xs p-2 rounded bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                              Use Case {id.slice(0, 8)}
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
