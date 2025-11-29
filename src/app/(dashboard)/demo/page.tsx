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
import { Sparkles } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Demo - Walking Skeleton</h1>
        <p className="text-muted-foreground mt-2">
          Testing all the pieces: auth, graph, and LLM integration
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Process Graph Demo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hardcoded Process Graph</CardTitle>
            <CardDescription>
              Demo invoice processing workflow using React Flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '500px' }} className="border rounded-lg">
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
            <p className="text-sm text-muted-foreground mt-4">
              This is a hardcoded demo graph showing an invoice processing
              workflow. In Milestone 1, this will be dynamically generated from
              chat conversations.
            </p>
          </CardContent>
        </Card>

        {/* LLM Test */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Test LLM Integration
            </CardTitle>
            <CardDescription>
              Send a test prompt to verify OpenAI integration is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="llm-prompt">Test Prompt</Label>
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
              />
            </div>
            <Button onClick={testLLM} disabled={isLoadingLLM}>
              {isLoadingLLM ? 'Calling LLM...' : 'Test LLM Call'}
            </Button>

            {llmResponse && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">LLM Response:</p>
                <p className="text-sm">{llmResponse}</p>
              </div>
            )}

            {!llmResponse && !isLoadingLLM && (
              <p className="text-sm text-muted-foreground">
                Enter a prompt and click the button to test the LLM integration.
                Make sure you have set your OPENAI_API_KEY in the .env file.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone 0 Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone 0 - Walking Skeleton ✓</CardTitle>
          <CardDescription>All components verified</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Next.js app running with TypeScript
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Authentication working (you're signed in!)
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Workspace and project creation
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Hardcoded demo process graph rendering
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              LLM integration test available
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Database connected with Prisma
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Ready to proceed to Milestone 1: Process Mapping MVP
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
