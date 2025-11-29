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
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { StepDetailsDialog } from '@/components/step-details-dialog';
import { ChatMessageType, ProcessStep as ProcessStepType } from '@/types/process';

type Process = {
  id: string;
  name: string;
  description?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProcess();
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
        const flowNodes: Node[] = data.process.steps.map((step: any) => ({
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
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
        {/* Chat Panel - Left */}
        <div className="col-span-2 flex flex-col border rounded-lg bg-card overflow-hidden">
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

        {/* Graph Panel - Right */}
        <div className="col-span-3 border rounded-lg bg-card overflow-hidden">
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
