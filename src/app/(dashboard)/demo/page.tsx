'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

// Hardcoded demo process graph
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Receive Invoice by Email' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'default',
    data: { label: 'Download PDF Attachment' },
    position: { x: 100, y: 200 },
  },
  {
    id: '3',
    type: 'default',
    data: { label: 'Manual Data Entry to Spreadsheet' },
    position: { x: 100, y: 300 },
  },
  {
    id: '4',
    type: 'default',
    data: { label: 'Manager Approval' },
    position: { x: 100, y: 400 },
  },
  {
    id: '5',
    type: 'default',
    data: { label: 'Payment Processing' },
    position: { x: 100, y: 500 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-5', source: '4', target: '5', animated: true },
];

export default function DemoPage() {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const testLLM = async () => {
    if (!llmPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingLLM(true);
    setLlmResponse('');

    try {
      const response = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: llmPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to call LLM');
      }

      const data = await response.json();
      setLlmResponse(data.response);
      toast({
        title: 'LLM Response Received',
        description: 'Check the response below',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to call LLM. Check your API key.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLLM(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <PageHeader
        title="Demo - Walking Skeleton"
        description="Testing all the pieces: auth, graph, and LLM integration"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Process Graph Demo */}
        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-base">Hardcoded Process Graph</CardTitle>
            <CardDescription className="text-xs">
              Demo invoice processing workflow using React Flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '500px' }} className="border border-border/60 rounded-xl overflow-hidden">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              This is a hardcoded demo graph showing an invoice processing
              workflow. In Milestone 1, this will be dynamically generated from
              chat conversations.
            </p>
          </CardContent>
        </Card>

        {/* LLM Test */}
        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Sparkles className="h-5 w-5 mr-2 text-brand-500" />
              Test LLM Integration
            </CardTitle>
            <CardDescription className="text-xs">
              Send a test prompt to verify OpenAI integration is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="llm-prompt" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Test Prompt</Label>
              <Input
                id="llm-prompt"
                value={llmPrompt}
                onChange={(e) => setLlmPrompt(e.target.value)}
                placeholder="e.g., What is Better Than Interns?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    testLLM();
                  }
                }}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={testLLM}
              disabled={isLoadingLLM}
              className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
            >
              {isLoadingLLM ? 'Calling LLM...' : 'Test LLM Call'}
            </Button>

            {llmResponse && (
              <div className="mt-4 p-4 bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl border border-brand-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-brand-700">LLM Response:</p>
                <p className="text-sm leading-relaxed">{llmResponse}</p>
              </div>
            )}

            {!llmResponse && !isLoadingLLM && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter a prompt and click the button to test the LLM integration.
                Make sure you have set your OPENAI_API_KEY in the .env file.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone 0 Checklist */}
      <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Milestone 0 - Walking Skeleton
          </CardTitle>
          <CardDescription className="text-xs">All components verified</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>Next.js app running with TypeScript</span>
            </li>
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>Authentication working (you're signed in!)</span>
            </li>
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>Workspace and project creation</span>
            </li>
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>Hardcoded demo process graph rendering</span>
            </li>
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>LLM integration test available</span>
            </li>
            <li className="flex items-center p-2 rounded-lg bg-card/60 hover:bg-card transition-colors">
              <span className="text-green-600 mr-3 text-lg">✓</span>
              <span>Database connected with Prisma</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-6 p-3 rounded-lg bg-brand-50/50 border border-brand-200/50">
            Ready to proceed to Milestone 1: Process Mapping MVP
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
