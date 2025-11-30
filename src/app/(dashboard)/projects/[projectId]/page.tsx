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
import { Plus, Workflow, ArrowLeft, FileText, Sparkles, Shield, Info, X } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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

type Blueprint = {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  metadataJson: any;
};

type AiUseCase = {
  id: string;
  title: string;
  status: string;
  source: string;
  createdAt: string;
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
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [aiUseCases, setAiUseCases] = useState<AiUseCase[]>([]);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessDescription, setNewProcessDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(true);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(true);
  const [isLoadingAiUseCases, setIsLoadingAiUseCases] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const isDemoProject = project?.name?.startsWith('Demo – ');

  useEffect(() => {
    loadProject();
    loadProcesses();
    loadBlueprints();
    loadAiUseCases();
  }, [params.projectId]);

  const loadProject = async () => {
    try {
      const data = await apiFetch<{ project: Project }>(
        `/api/projects/${params.projectId}`
      );
      setProject(data.project);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const loadProcesses = async () => {
    setIsLoadingProcesses(true);
    try {
      const data = await apiFetch<{ processes: Process[] }>(
        `/api/projects/${params.projectId}/processes`
      );
      setProcesses(data.processes);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const loadBlueprints = async () => {
    setIsLoadingBlueprints(true);
    try {
      const data = await apiFetch<{ blueprints: Blueprint[] }>(
        `/api/projects/${params.projectId}/blueprints`
      );
      setBlueprints(data.blueprints);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBlueprints(false);
    }
  };

  const loadAiUseCases = async () => {
    setIsLoadingAiUseCases(true);
    try {
      // Get workspace first
      const workspacesRes = await fetch('/api/workspaces');
      const workspacesData = await workspacesRes.json();
      const workspaces = workspacesData.ok && workspacesData.data
        ? workspacesData.data.workspaces
        : workspacesData.workspaces;

      if (workspaces && workspaces.length > 0) {
        const wsId = workspaces[0].id;
        const response = await fetch(`/api/workspaces/${wsId}/ai-use-cases?projectId=${params.projectId}`);
        const result = await response.json();
        const useCases = result.ok && result.data
          ? result.data.aiUseCases
          : result.aiUseCases;
        setAiUseCases(useCases || []);
      }
    } catch (error) {
      // Silently fail - AI use cases section is optional
      console.log('Could not load AI use cases');
    } finally {
      setIsLoadingAiUseCases(false);
    }
  };

  const createAiUseCase = async (mode: 'manual' | 'from_blueprint') => {
    try {
      let body;
      if (mode === 'from_blueprint' && blueprints.length > 0) {
        body = JSON.stringify({
          mode: 'from_blueprint',
          blueprintId: blueprints[0].id,
        });
      } else {
        body = JSON.stringify({
          mode: 'manual',
          title: `AI Implementation - ${project?.name || 'Untitled'}`,
          description: 'Automated business process implementation.',
          status: 'planned',
        });
      }

      const response = await fetch(`/api/projects/${params.projectId}/ai-use-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) throw new Error('Failed to create AI use case');

      const result = await response.json();
      const aiUseCase = result.ok && result.data ? result.data.aiUseCase : result.aiUseCase;

      toast({
        title: 'AI use case created',
        description: 'Navigate to Governance to view and manage it.',
      });

      // Reload AI use cases
      await loadAiUseCases();

      // Navigate to detail page
      router.push(`/ai-use-cases/${aiUseCase.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create AI use case',
        variant: 'destructive',
      });
    }
  };

  const createProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiFetch<{ process: Process }>(
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
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBlueprint = async () => {
    if (processes.length === 0) {
      toast({
        title: 'No processes mapped',
        description: 'Map at least one process before generating a blueprint.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingBlueprint(true);

    try {
      const data = await apiFetch<{ blueprint: Blueprint }>(
        `/api/projects/${params.projectId}/blueprints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      toast({
        title: 'Blueprint generated',
        description: 'Your implementation blueprint is ready.',
      });

      // Navigate to blueprint view
      router.push(
        `/projects/${params.projectId}/blueprints/${data.blueprint.id}`
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBlueprint(false);
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
        <div className="flex space-x-2">
          <Button onClick={() => setShowNewProcess(!showNewProcess)}>
            <Plus className="h-4 w-4 mr-2" />
            New Process
          </Button>
          <Button
            onClick={generateBlueprint}
            disabled={isGeneratingBlueprint || processes.length === 0}
            variant="default"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingBlueprint ? 'Generating...' : 'Generate Blueprint'}
          </Button>
        </div>
      </div>

      {/* Demo Project Banner */}
      {isDemoProject && showDemoBanner && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      You're exploring a demo project
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This is sample data so you can click around without breaking anything.
                      When you're ready, create a real project for your own process.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard">
                      <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create a real project
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDemoBanner(false)}
                    >
                      Keep exploring demo
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDemoBanner(false)}
                className="ml-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Next Steps Nudge */}
      {!isLoadingProcesses && processes.length === 0 && !showNewProcess && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Next Step: Map a process
            </CardTitle>
            <CardDescription>
              Start by mapping one workflow with the chat assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The AI assistant will interview you about a process and build a visual workflow map as you chat.
              Takes 10-15 minutes.
            </p>
            <Button onClick={() => setShowNewProcess(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start mapping
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoadingProcesses && !isLoadingBlueprints && processes.length > 0 && blueprints.length === 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Next Step: Scan for opportunities & generate blueprint
            </CardTitle>
            <CardDescription>
              You've mapped {processes.length} {processes.length === 1 ? 'process' : 'processes'}. Time to find automation opportunities!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a blueprint to analyze your processes, identify AI opportunities, match tools, and export a professional implementation plan.
            </p>
            <div className="flex space-x-2">
              {processes.length > 0 && (
                <Link href={`/projects/${params.projectId}/processes/${processes[0].id}`}>
                  <Button variant="outline">
                    <Workflow className="h-4 w-4 mr-2" />
                    Open first process
                  </Button>
                </Link>
              )}
              <Button onClick={generateBlueprint} disabled={isGeneratingBlueprint}>
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingBlueprint ? 'Generating...' : 'Generate Blueprint'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingBlueprints ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Implementation Blueprints</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : blueprints.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Implementation Blueprints</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {blueprints.map((blueprint) => (
              <Link
                key={blueprint.id}
                href={`/projects/${params.projectId}/blueprints/${blueprint.id}`}
                prefetch={true}
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {blueprint.title}
                    </CardTitle>
                    <CardDescription>
                      Version {blueprint.version} •{' '}
                      {new Date(blueprint.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {blueprint.metadataJson?.processCount || 0} processes •{' '}
                      {blueprint.metadataJson?.opportunityCount || 0}{' '}
                      opportunities •{' '}
                      {blueprint.metadataJson?.selectedToolCount || 0} tools
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* AI Use Cases Section (Governance MVP) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>AI Use Cases (Governance)</span>
          </h2>
          <Button
            onClick={() => createAiUseCase(blueprints.length > 0 ? 'from_blueprint' : 'manual')}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create AI Use Case
          </Button>
        </div>

        {isLoadingAiUseCases ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">Loading AI use cases...</p>
            </CardContent>
          </Card>
        ) : aiUseCases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {aiUseCases.map((uc) => (
              <Link key={uc.id} href={`/ai-use-cases/${uc.id}`} prefetch={true}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{uc.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="secondary">{uc.status}</Badge>
                      <span className="text-xs">• {uc.source === 'blueprint' ? 'From Blueprint' : 'Manual'}</span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                No AI use cases yet. Create one to track governance and deployment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <h2 className="text-2xl font-bold">Processes</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoadingProcesses ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : processes.length === 0 ? (
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
              prefetch={true}
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
