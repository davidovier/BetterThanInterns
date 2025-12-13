'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionChatPane, ChatMessage } from './SessionChatPane';
import { SessionArtifactPane } from './SessionArtifactPane';
import { SessionGraphPane } from './SessionGraphPane';
import { AssistantPresence, AssistantPresenceState } from './AssistantPresence';
import { SessionArtifacts } from '@/types/artifacts';
import { ProcessStep } from '@/types/process';
import { StepDetailsDialog } from '@/components/process/step-details-dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Sparkles, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { formatDistanceToNow } from 'date-fns';
import { isFirstRunSession } from '@/lib/sessionUtils';

// M17.1 Verification: Debug mode for presence state (dev-only)
const DEBUG_PRESENCE = false;

type UnifiedSessionWorkspaceProps = {
  sessionId: string;
  sessionTitle: string;
  sessionData?: {
    contextSummary?: string;
    updatedAt?: string;
  };
};

export function UnifiedSessionWorkspace({
  sessionId,
  sessionTitle,
  sessionData,
}: UnifiedSessionWorkspaceProps) {
  const { toast } = useToast();
  const { currentWorkspaceName } = useWorkspaceContext();
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

  // M17.1: Job counter-based presence state management
  const [activeJobs, setActiveJobs] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [presenceState, setPresenceState] = useState<AssistantPresenceState>('idle');

  // M17.1: Input energy for listening state reactivity
  const inputEnergy = Math.max(0, Math.min(1, inputMessage.length / 120));

  // M20: Detect first-run session
  const hasAnyArtifacts =
    artifacts.processes.length > 0 ||
    artifacts.opportunities.length > 0 ||
    artifacts.blueprints.length > 0 ||
    artifacts.aiUseCases.length > 0;

  const isFirstRun = isFirstRunSession(
    messages.length > 0,
    hasAnyArtifacts,
    sessionData?.contextSummary
  );

  // M17.1: Error recovery timeout ref
  const errorRecoveryTimeout = useRef<NodeJS.Timeout | null>(null);

  // M17.1: Centralized async job wrapper
  const runJob = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setActiveJobs(n => n + 1);
    try {
      return await fn();
    } finally {
      setActiveJobs(n => Math.max(0, n - 1));
    }
  }, []);

  // M17.1: Derive presence state from job counter and input focus
  useEffect(() => {
    // Clear any pending error recovery
    if (errorRecoveryTimeout.current) {
      clearTimeout(errorRecoveryTimeout.current);
      errorRecoveryTimeout.current = null;
    }

    if (activeJobs > 0) {
      // If we're applying updates, show updating state
      if (isUpdating) {
        setPresenceState('updating');
      } else {
        // Otherwise, AI is thinking
        setPresenceState('thinking');
      }
    } else if (isInputFocused) {
      setPresenceState('listening');
    } else {
      setPresenceState('idle');
    }
  }, [activeJobs, isInputFocused, isUpdating]);

  // M17.1: Handle error state with parent-controlled recovery
  const handleError = useCallback((error: Error, description: string) => {
    console.error(description, error);
    setPresenceState('error');
    toast({
      title: 'Error',
      description,
      variant: 'destructive',
    });

    // M17.1: Error recovery after 1200ms
    errorRecoveryTimeout.current = setTimeout(() => {
      setPresenceState('idle');
    }, 1200);
  }, [toast]);

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

  // M17.1: Scan for opportunities with job tracking
  const scanForOpportunities = async () => {
    const selectedProcess = artifacts.processes[selectedProcessIndex];
    if (!selectedProcess) return;

    setIsScanning(true);

    await runJob(async () => {
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

        // M17.1: Trigger updating state
        setIsUpdating(true);
        await loadArtifacts();
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error('Unknown error'),
          'Failed to scan for opportunities'
        );
      } finally {
        setIsScanning(false);
      }
    });
  };

  // M17.1: Callback fired when artifacts finish rendering
  const handleArtifactsRendered = useCallback(() => {
    setIsUpdating(false);
  }, []);

  // M17.1: Send message with job tracking
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

    await runJob(async () => {
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

        // M17.1: Transition to 'updating' when artifacts are being applied
        setIsUpdating(true);

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

        // M17.1: isUpdating will be cleared by handleArtifactsRendered callback
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error('Unknown error'),
          error instanceof Error ? error.message : 'Failed to send message'
        );
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setIsUpdating(false);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* M19: Document-style File Cover Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Back link */}
          <Link
            href="/sessions"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Sessions
          </Link>

          {/* Document title and metadata */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-slate-400 flex-shrink-0" />
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {sessionTitle}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Active working session</span>
                {sessionData?.updatedAt && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>Last updated {formatDistanceToNow(new Date(sessionData.updatedAt), { addSuffix: true })}</span>
                  </>
                )}
                {currentWorkspaceName && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">{currentWorkspaceName}</span>
                  </>
                )}
              </div>
            </div>

            {/* M19: Single primary action + assistant presence */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <AssistantPresence state={presenceState} inputEnergy={inputEnergy} />
              <Button
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  textarea?.focus();
                }}
                className="bg-brand-600 hover:bg-brand-700"
              >
                Continue Work
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* M17.1 Verification: Debug display (dev-only) */}
      {DEBUG_PRESENCE && (
        <div className="border-b border-border bg-slate-50 px-4 py-1.5">
          <div className="text-xs text-muted-foreground font-mono space-x-4">
            <span>state: <span className="font-semibold">{presenceState}</span></span>
            <span>jobs: {activeJobs}</span>
            <span>updating: {isUpdating ? 'true' : 'false'}</span>
            <span>focused: {isInputFocused ? 'true' : 'false'}</span>
            <span>highlight: {highlightedArtifactId || 'none'}</span>
          </div>
        </div>
      )}

      {/* M19: Document Body - Session Brief + Three-panel workspace */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
          {/* M19: Session Brief Section */}
          <div className="bg-white border-b border-slate-200 px-8 py-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Session Brief
            </h2>
            {sessionData?.contextSummary ? (
              <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                {sessionData.contextSummary}
              </p>
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                {isFirstRun
                  ? 'Use this working session to describe a process or decision. As work progresses, this brief will summarize what was decided.'
                  : 'This session will summarize itself as decisions are made.'}
              </p>
            )}
          </div>

          {/* Main Workspace - Three-panel layout: Working Notes (30%) | Graph (45%) | Outputs (25%) */}
          <div className="flex-1 flex overflow-hidden">
            {/* M19: Working Notes Pane (formerly Chat) - 30% */}
            <div className="w-[30%] border-r border-slate-200 bg-white">
              <SessionChatPane
                messages={messages}
                inputMessage={inputMessage}
                isLoading={isLoading}
                onInputChange={setInputMessage}
                onSendMessage={sendMessage}
                hasProcesses={artifacts.processes.length > 0}
                onInputFocus={() => setIsInputFocused(true)}
                onInputBlur={() => setIsInputFocused(false)}
                isFirstRun={isFirstRun}
              />
            </div>

            {/* Graph Pane - 45% */}
            <div className="w-[45%] border-r border-slate-200">
              <SessionGraphPane
                processes={artifacts.processes}
                opportunities={artifacts.opportunities}
                selectedProcessIndex={selectedProcessIndex}
                highlightedStepId={highlightedArtifactId}
                onProcessSelect={setSelectedProcessIndex}
                onStepClick={handleStepClick}
              />
            </div>

            {/* M19: Outputs Pane (formerly Artifacts) - 25% */}
            <div className="w-[25%] bg-white">
              <SessionArtifactPane
                artifacts={artifacts}
                highlightedArtifactId={highlightedArtifactId}
                onScanForOpportunities={scanForOpportunities}
                onArtifactsRendered={handleArtifactsRendered}
                shouldConfirmRender={isUpdating || highlightedArtifactId !== null}
                isFirstRun={isFirstRun}
              />
            </div>
          </div>
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
