'use client';

import { useState, useEffect } from 'react';
import { SessionChatPane, ChatMessage } from './SessionChatPane';
import { SessionArtifactPane } from './SessionArtifactPane';
import { SessionGraphPane } from './SessionGraphPane';
import { AssistantPresence, AssistantPresenceState } from './AssistantPresence';
import { SessionArtifacts } from '@/types/artifacts';
import { ProcessStep } from '@/types/process';
import { StepDetailsDialog } from '@/components/process/step-details-dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
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
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // M17: Assistant Presence State
  const [presenceState, setPresenceState] = useState<AssistantPresenceState>('idle');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load initial messages and artifacts
  useEffect(() => {
    loadMessages();
    loadArtifacts();
  }, [sessionId]);

  // M17: Manage presence state based on input focus
  useEffect(() => {
    if (isInputFocused && !isLoading) {
      setPresenceState('listening');
    } else if (!isLoading) {
      setPresenceState('idle');
    }
  }, [isInputFocused, isLoading]);

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

  const handleStepClick = async (stepId: string, processId: string) => {
    try {
      const response = await fetch(`/api/processes/${processId}?includeGraph=true`);
      if (!response.ok) throw new Error('Failed to load step');

      const result = await response.json();
      const processData = result.ok && result.data ? result.data.process : result.process;

      const step = processData.steps.find((s: any) => s.id === stepId);
      if (step) {
        setSelectedStep({
          id: step.id,
          title: step.title,
          description: step.description || undefined,
          owner: step.owner || undefined,
          inputs: step.inputs || [],
          outputs: step.outputs || [],
          frequency: step.frequency || undefined,
          duration: step.duration || undefined,
          positionX: step.positionX,
          positionY: step.positionY,
        });
        setIsStepDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading step:', error);
      toast({
        title: 'Error',
        description: 'Failed to load step details',
        variant: 'destructive',
      });
    }
  };

  const handleStepUpdate = async (stepId: string, updates: any) => {
    try {
      const processId = artifacts.processes[selectedProcessIndex]?.id;
      if (!processId) return;

      const response = await fetch(`/api/processes/${processId}/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update step');

      toast({
        title: 'Success',
        description: 'Step updated successfully',
      });

      // Reload artifacts to get updated data
      await loadArtifacts();
      setIsStepDialogOpen(false);
    } catch (error) {
      console.error('Error updating step:', error);
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  const scanForOpportunities = async () => {
    const selectedProcess = artifacts.processes[selectedProcessIndex];
    if (!selectedProcess) return;

    setIsScanning(true);
    try {
      const response = await fetch(
        `/api/processes/${selectedProcess.id}/scan-opportunities?sessionId=${sessionId}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to scan for opportunities');

      const result = await response.json();
      const count = result.ok && result.data ? result.data.count : result.count;

      toast({
        title: 'Scan Complete',
        description: `Found ${count} automation ${count === 1 ? 'opportunity' : 'opportunities'}`,
      });

      // Reload artifacts to show new opportunities
      await loadArtifacts();
    } catch (error) {
      console.error('Failed to scan for opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to scan for opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    // M17: Set presence to 'thinking' when message is sent
    setPresenceState('thinking');

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

      // M17: Transition to 'updating' when artifacts are being applied
      setPresenceState('updating');

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

      // M17: Brief pause on 'updating' before returning to idle
      setTimeout(() => {
        setPresenceState('idle');
      }, 800);
    } catch (error) {
      console.error('Failed to send message:', error);
      // M17: Set presence to error, which will auto-clear after 1.5s
      setPresenceState('error');
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sessions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{sessionTitle}</h1>
            </div>
            {/* M17: Assistant Presence Indicator */}
            <div className="h-6 w-px bg-border" />
            <AssistantPresence state={presenceState} />
          </div>
          <Button
            onClick={scanForOpportunities}
            disabled={isScanning || !artifacts.processes[selectedProcessIndex] || artifacts.processes.length === 0}
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
      </div>

      {/* Main Workspace - Three-panel layout: Chat (30%) | Graph (45%) | Artifacts (25%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Pane - 30% */}
        <div className="w-[30%] border-r border-border">
          <SessionChatPane
            messages={messages}
            inputMessage={inputMessage}
            isLoading={isLoading}
            onInputChange={setInputMessage}
            onSendMessage={sendMessage}
            hasProcesses={artifacts.processes.length > 0}
            onInputFocus={() => setIsInputFocused(true)}
            onInputBlur={() => setIsInputFocused(false)}
          />
        </div>

        {/* Graph Pane - 45% */}
        <div className="w-[45%] border-r border-border">
          <SessionGraphPane
            processes={artifacts.processes}
            opportunities={artifacts.opportunities}
            selectedProcessIndex={selectedProcessIndex}
            highlightedStepId={highlightedArtifactId}
            onProcessSelect={setSelectedProcessIndex}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Artifact Pane - 25% */}
        <div className="w-[25%]">
          <SessionArtifactPane
            artifacts={artifacts}
            highlightedArtifactId={highlightedArtifactId}
            onScanForOpportunities={scanForOpportunities}
          />
        </div>
      </div>

      {/* Step Details Dialog */}
      {selectedStep && (
        <StepDetailsDialog
          step={selectedStep}
          isOpen={isStepDialogOpen}
          onClose={() => setIsStepDialogOpen(false)}
          onUpdate={handleStepUpdate}
        />
      )}
    </div>
  );
}
