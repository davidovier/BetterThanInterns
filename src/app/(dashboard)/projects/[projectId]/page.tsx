'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Workflow, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Process = {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
};

export default function ProjectProcessesPage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessDescription, setNewProcessDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProject();
    loadProcesses();
  }, [params.projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
    }
  };

  const loadProcesses = async () => {
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/processes`
      );
      if (!response.ok) throw new Error('Failed to load processes');
      const data = await response.json();
      setProcesses(data.processes);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load processes',
        variant: 'destructive',
      });
    }
  };

  const createProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/processes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProcessName,
            description: newProcessDescription,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create process');

      const data = await response.json();
      toast({
        title: 'Process created',
        description: "Let's map one process you secretly hate.",
      });

      // Navigate to process mapping page
      router.push(
        `/projects/${params.projectId}/processes/${data.process.id}`
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create process',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project?.name || 'Project'}</h1>
          {project?.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
        <Button onClick={() => setShowNewProcess(!showNewProcess)}>
          <Plus className="h-4 w-4 mr-2" />
          New Process
        </Button>
      </div>

      {showNewProcess && (
        <Card>
          <CardHeader>
            <CardTitle>Start Mapping</CardTitle>
            <CardDescription>
              Start with something ugly. That's where the value is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProcess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="process-name">Process Name</Label>
                <Input
                  id="process-name"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  placeholder="e.g., Invoice Approval Process"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="process-description">
                  Description (optional)
                </Label>
                <Input
                  id="process-description"
                  value={newProcessDescription}
                  onChange={(e) => setNewProcessDescription(e.target.value)}
                  placeholder="What does this process do?"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Start Mapping'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewProcess(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {processes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-2">
                No processes mapped yet. That's normal.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Click "New Process" to start mapping a workflow.
              </p>
            </CardContent>
          </Card>
        ) : (
          processes.map((process) => (
            <Link
              key={process.id}
              href={`/projects/${params.projectId}/processes/${process.id}`}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Workflow className="h-4 w-4 mr-2" />
                    {process.name}
                  </CardTitle>
                  {process.description && (
                    <CardDescription>{process.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {process.owner && <span>{process.owner}</span>}
                    <span>
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
