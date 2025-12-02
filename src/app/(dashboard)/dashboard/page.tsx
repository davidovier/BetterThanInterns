'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
import { Plus, FolderOpen, Sparkles, CheckCircle2, Circle, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';

type Workspace = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadProjects(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Failed to load workspaces');
      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const workspacesData = result.ok && result.data ? result.data.workspaces : result.workspaces;

      setWorkspaces(workspacesData || []);
      if (workspacesData && workspacesData.length > 0) {
        setSelectedWorkspace(workspacesData[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workspaces',
        variant: 'destructive',
      });
    }
  };

  const loadProjects = async (workspaceId: string) => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects`
      );
      if (!response.ok) throw new Error('Failed to load projects');
      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const projectsData = result.ok && result.data ? result.data.projects : result.projects;

      setProjects(projectsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${selectedWorkspace}/projects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProjectName,
            description: newProjectDescription,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create project');

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const project = result.ok && result.data ? result.data.project : result.project;

      setProjects([project, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProject(false);
      toast({
        title: 'Project created',
        description: 'Your new project is ready',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoProject = async () => {
    if (!selectedWorkspace) return;

    setIsCreatingDemo(true);
    try {
      const response = await fetch('/api/demo-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: selectedWorkspace }),
      });

      const result = await response.json();

      // Check for rate limit error
      if (!response.ok) {
        if (result.error?.code === 'DEMO_RATE_LIMIT') {
          toast({
            title: 'You already have a demo project',
            description: 'You can reuse or delete it from your dashboard.',
            variant: 'destructive',
          });
          setIsCreatingDemo(false);
          return;
        }
        throw new Error('Failed to create demo project');
      }

      const projectId = result.ok && result.data ? result.data.projectId : result.projectId;

      toast({
        title: 'Demo project created!',
        description: 'Opening your demo project...',
      });

      // Redirect to the demo project
      window.location.href = `/projects/${projectId}`;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create demo project',
        variant: 'destructive',
      });
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Your workflows are a mess. We fix them with AI.
            </p>
          </div>
          <Button
            onClick={() => setShowNewProject(!showNewProject)}
            className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Metrics Row - Only show when there are projects */}
        {!isLoadingProjects && projects.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Projects"
              value={projects.length}
              icon={FolderOpen}
              variant="default"
            />
            <MetricCard
              label="Active Projects"
              value={projects.filter(p => p.status === 'active').length}
              icon={Zap}
              variant="primary"
            />
            <MetricCard
              label="Completed"
              value={projects.filter(p => p.status === 'completed').length}
              icon={CheckCircle2}
              variant="success"
            />
          </div>
        )}

        {/* New Project Form */}
        {showNewProject && (
          <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Create New Project</CardTitle>
              <CardDescription>
                Start with something ugly. That's where the value is.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Invoice Processing Automation"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">
                    Description (optional)
                  </Label>
                  <Input
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="What's this project about?"
                    className="rounded-lg"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
                  >
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowNewProject(false)}
                    className="hover:-translate-y-[1px] transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingProjects ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl">
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
          ) : projects.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Sparkles}
                title="Let's make you better than interns"
                description="Create your first project to map processes, find automation opportunities, and generate implementation blueprints. Try the demo project to see how it works."
                action={{
                  label: 'Create Your First Project',
                  onClick: () => setShowNewProject(true),
                }}
              />
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={createDemoProject}
                  disabled={isCreatingDemo}
                  className="hover:-translate-y-[1px] transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isCreatingDemo ? 'Creating demo...' : 'Or try a demo project'}
                </Button>
              </div>
            </div>
          ) : (
            projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} prefetch={true}>
                <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[2px] transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl font-semibold">{project.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className="capitalize text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="text-base line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        <span>Project</span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
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
