'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Loader2, Sparkles, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedWorkspaceView } from '@/components/UnifiedWorkspaceView'; // M15

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [aiUseCases, setAiUseCases] = useState<any[]>([]);
  // M14: Next step suggestion state
  const [nextStepSuggestion, setNextStepSuggestion] = useState<{
    label: string;
    actionType: string;
  } | null>(null);
  // M15: Highlight ID for scroll/animation
  const [highlightId, setHighlightId] = useState<string | null>(null);

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

      // M14: Load chat message history from database
      await loadMessages();
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

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.sessionId}/messages`);
      if (!response.ok) {
        console.error('Failed to load messages');
        return;
      }

      const result = await response.json();
      if (result.ok && result.data?.messages) {
        const loadedMessages = result.data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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

      const { assistantMessage, artifacts, updatedMetadata, clarification, nextStepSuggestion } = result.data;

      // M14: Reload messages from database to get persistent IDs
      await loadMessages();

      // M14: Update next step suggestion
      if (nextStepSuggestion) {
        setNextStepSuggestion(nextStepSuggestion);
      } else {
        setNextStepSuggestion(null);
      }

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

      // Refresh artifacts in the background without affecting chat messages
      await loadArtifacts(updatedMetadata);
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

            {/* M14: Next Step Suggestion */}
            {nextStepSuggestion && messages.length > 0 && (
              <div className="flex justify-center mt-4 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => {
                    // Pre-fill the input based on action type
                    const actionMessages: Record<string, string> = {
                      describe_process: "Let me describe a process for you to map.",
                      scan_opportunities: "Scan this session for AI opportunities",
                      generate_blueprint: "Generate a blueprint for this project",
                      create_governance: "Create governance tracking for this AI use case",
                    };
                    const message = actionMessages[nextStepSuggestion.actionType] || nextStepSuggestion.label;
                    setInputMessage(message);
                  }}
                  className="group px-4 py-2 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 hover:border-brand-300 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <Sparkles className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Suggested:</span>
                    <span>{nextStepSuggestion.label}</span>
                  </div>
                </button>
              </div>
            )}

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

        {/* M15: Unified Workspace View - Right (30%) */}
        <div className="col-span-3 flex flex-col bg-gradient-to-b from-card to-muted/20 overflow-auto">
          <UnifiedWorkspaceView
            processes={processes}
            opportunities={opportunities}
            blueprints={blueprints}
            aiUseCases={aiUseCases}
            nextStepSuggestion={nextStepSuggestion}
            sessionSummary={session?.contextSummary || null}
            highlightId={highlightId}
            onExplainOpportunity={(opp) => {
              setInputMessage(`Can you explain this opportunity: "${opp.title}"?`);
            }}
            onUseOpportunityInBlueprint={(opp) => {
              setInputMessage(`Use this opportunity in a blueprint: "${opp.title}"`);
            }}
            onRegenerateBlueprint={() => {
              setInputMessage('Regenerate the blueprint');
            }}
          />
        </div>
      </div>
    </div>
  );
}
