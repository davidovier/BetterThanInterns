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
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';

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
    <>
      <PageHeader
        title={project?.name || 'Project'}
        description={project?.description}
        breadcrumb={
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        }
        actions={
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowNewProcess(!showNewProcess)}
              className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Process
            </Button>
            <Button
              onClick={generateBlueprint}
              disabled={isGeneratingBlueprint || processes.length === 0}
              variant="outline"
              className="hover:-translate-y-[1px] transition-all"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGeneratingBlueprint ? 'Generating...' : 'Generate Blueprint'}
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Demo Project Banner */}
        {isDemoProject && showDemoBanner && (
          <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-soft dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="rounded-full bg-blue-100 p-2 mt-0.5 dark:bg-blue-900/50">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
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
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 hover:-translate-y-[1px] transition-all"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create a real project
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDemoBanner(false)}
                        className="hover:-translate-y-[1px] transition-all"
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

        {/* New Process Form */}
        {showNewProcess && (
          <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Start Mapping</CardTitle>
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
                    className="rounded-lg"
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
                    className="rounded-lg"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
                  >
                    {isLoading ? 'Creating...' : 'Start Mapping'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowNewProcess(false)}
                    className="hover:-translate-y-[1px] transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Next Steps Nudge - Map Process */}
        {!isLoadingProcesses && processes.length === 0 && !showNewProcess && (
          <Card className="rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border-brand-200 shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-brand-600" />
                Next Step: Map a process
              </CardTitle>
              <CardDescription className="text-brand-700">
                Start by mapping one workflow with the chat assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-brand-600">
                The AI assistant will interview you about a process and build a visual workflow map as you chat.
                Takes 10-15 minutes.
              </p>
              <Button
                onClick={() => setShowNewProcess(true)}
                className="bg-brand-600 hover:bg-brand-700 hover:-translate-y-[1px] transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start mapping
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Next Steps Nudge - Generate Blueprint */}
        {!isLoadingProcesses && !isLoadingBlueprints && processes.length > 0 && blueprints.length === 0 && (
          <Card className="rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border-brand-200 shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-brand-600" />
                Next Step: Scan for opportunities & generate blueprint
              </CardTitle>
              <CardDescription className="text-brand-700">
                You've mapped {processes.length} {processes.length === 1 ? 'process' : 'processes'}. Time to find automation opportunities!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-brand-600">
                Generate a blueprint to analyze your processes, identify AI opportunities, match tools, and export a professional implementation plan.
              </p>
              <div className="flex space-x-2">
                {processes.length > 0 && (
                  <Link href={`/projects/${params.projectId}/processes/${processes[0].id}`}>
                    <Button variant="outline" className="hover:-translate-y-[1px] transition-all">
                      <Workflow className="h-4 w-4 mr-2" />
                      Open first process
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={generateBlueprint}
                  disabled={isGeneratingBlueprint}
                  className="bg-brand-600 hover:bg-brand-700 hover:-translate-y-[1px] transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingBlueprint ? 'Generating...' : 'Generate Blueprint'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processes Section */}
        <SectionCard
          title="Processes"
          description="Workflows mapped with the AI assistant"
          action={
            processes.length > 0 && (
              <Button
                onClick={() => setShowNewProcess(true)}
                variant="outline"
                size="sm"
                className="hover:-translate-y-[1px] transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )
          }
          isEmpty={!isLoadingProcesses && processes.length === 0 && showNewProcess === false}
          emptyState={
            <>
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                No processes mapped yet. That's normal.
              </p>
              <p className="text-sm text-muted-foreground">
                Click "New Process" to start mapping a workflow.
              </p>
            </>
          }
        >
          {isLoadingProcesses ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="rounded-xl">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {processes.map((process) => (
                <Link
                  key={process.id}
                  href={`/projects/${params.projectId}/processes/${process.id}`}
                  prefetch={true}
                >
                  <Card className="rounded-xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[1px] transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center font-semibold">
                        <Workflow className="h-4 w-4 mr-2 text-brand-500" />
                        {process.name}
                      </CardTitle>
                      {process.description && (
                        <CardDescription className="line-clamp-2">
                          {process.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {process.owner && <span>{process.owner}</span>}
                        <span>
                          {new Date(process.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Blueprints Section */}
        {(isLoadingBlueprints || blueprints.length > 0) && (
          <SectionCard
            title="Implementation Blueprints"
            description="Generated AI implementation plans"
            isEmpty={!isLoadingBlueprints && blueprints.length === 0}
            emptyState={
              <>
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No blueprints yet.</p>
              </>
            }
          >
            {isLoadingBlueprints ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="rounded-xl">
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
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {blueprints.map((blueprint) => (
                  <Link
                    key={blueprint.id}
                    href={`/projects/${params.projectId}/blueprints/${blueprint.id}`}
                    prefetch={true}
                  >
                    <Card className="rounded-xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[1px] transition-all cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center font-semibold">
                          <FileText className="h-4 w-4 mr-2 text-brand-500" />
                          {blueprint.title}
                        </CardTitle>
                        <CardDescription>
                          Version {blueprint.version} •{' '}
                          {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{blueprint.metadataJson?.processCount || 0} processes</span>
                          <span>•</span>
                          <span>{blueprint.metadataJson?.opportunityCount || 0} opportunities</span>
                          <span>•</span>
                          <span>{blueprint.metadataJson?.selectedToolCount || 0} tools</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* AI Use Cases Section */}
        <SectionCard
          title="AI Use Cases (Governance)"
          description="Track governance and deployment"
          action={
            <Button
              onClick={() => createAiUseCase(blueprints.length > 0 ? 'from_blueprint' : 'manual')}
              variant="outline"
              size="sm"
              className="hover:-translate-y-[1px] transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          }
          isEmpty={!isLoadingAiUseCases && aiUseCases.length === 0}
          emptyState={
            <>
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No AI use cases yet. Create one to track governance and deployment.
              </p>
            </>
          }
        >
          {isLoadingAiUseCases ? (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Loading AI use cases...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {aiUseCases.map((uc) => (
                <Link key={uc.id} href={`/ai-use-cases/${uc.id}`} prefetch={true}>
                  <Card className="rounded-xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[1px] transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center font-semibold">
                        <Shield className="h-4 w-4 mr-2 text-brand-500" />
                        {uc.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {uc.status}
                        </Badge>
                        <span className="text-xs">• {uc.source === 'blueprint' ? 'From Blueprint' : 'Manual'}</span>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
