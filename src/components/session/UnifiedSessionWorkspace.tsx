'use client';

import { useState, useEffect } from 'react';
import { SessionChatPane, ChatMessage } from './SessionChatPane';
import { SessionArtifactPane } from './SessionArtifactPane';
import { SessionArtifacts } from '@/types/artifacts';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type UnifiedSessionWorkspaceProps = {
  sessionId: string;
  sessionTitle: string;
};

export function UnifiedSessionWorkspace({
  sessionId,
  sessionTitle,
}: UnifiedSessionWorkspaceProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifacts, setArtifacts] = useState<SessionArtifacts>({
    processes: [],
    opportunities: [],
    blueprints: [],
    aiUseCases: [],
  });
  const [highlightedArtifactId, setHighlightedArtifactId] = useState<string | null>(null);

  // Load initial messages and artifacts
  useEffect(() => {
    loadMessages();
    loadArtifacts();
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');

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
      console.error('Failed to load messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation history',
        variant: 'destructive',
      });
    }
  };

  const loadArtifacts = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/artifacts`);
      if (!response.ok) throw new Error('Failed to load artifacts');

      const result = await response.json();
      if (result.ok && result.data) {
        setArtifacts({
          processes: result.data.processes || [],
          opportunities: result.data.opportunities || [],
          blueprints: result.data.blueprints || [],
          aiUseCases: result.data.aiUseCases || [],
        });
      }
    } catch (error) {
      console.error('Failed to load artifacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artifacts',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Optimistic update - add user message
    const tempUserMsg: ChatMessage = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMsg,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Call orchestration endpoint
      const response = await fetch(`/api/sessions/${sessionId}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to process message');
      }

      const { artifacts: newArtifacts, ui } = result.data;

      // Reload messages from database to get the actual persisted messages
      await loadMessages();

      // Reload artifacts to get updated state
      await loadArtifacts();

      // Handle UI hints (e.g., highlight specific artifact)
      if (ui?.highlightId) {
        setHighlightedArtifactId(ui.highlightId);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedArtifactId(null), 3000);
      }

      // Show success toast for created artifacts
      if (newArtifacts?.createdProcesses?.length > 0) {
        toast({
          title: 'Process Created',
          description: `Created: ${newArtifacts.createdProcesses.map((p: any) => p.name).join(', ')}`,
        });
      }
      if (newArtifacts?.createdOpportunities?.length > 0) {
        toast({
          title: 'Opportunities Identified',
          description: `Found ${newArtifacts.createdOpportunities.length} automation opportunities`,
        });
      }
      if (newArtifacts?.createdBlueprints?.length > 0) {
        toast({
          title: 'Blueprint Generated',
          description: `Created: ${newArtifacts.createdBlueprints.map((b: any) => b.title).join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sessions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{sessionTitle}</h1>
          </div>
        </div>
      </div>

      {/* Main Workspace - 60/40 Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Pane - 60% */}
        <div className="w-[60%] border-r border-border">
          <SessionChatPane
            messages={messages}
            inputMessage={inputMessage}
            isLoading={isLoading}
            onInputChange={setInputMessage}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Artifact Pane - 40% */}
        <div className="w-[40%]">
          <SessionArtifactPane
            artifacts={artifacts}
            highlightedArtifactId={highlightedArtifactId}
          />
        </div>
      </div>
    </div>
  );
}
