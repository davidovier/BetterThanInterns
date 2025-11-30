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
import { Plus, FolderOpen, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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

      if (!response.ok) throw new Error('Failed to create demo project');

      const result = await response.json();
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Your workflows are a mess. We fix them with AI.
          </p>
        </div>
        <Button onClick={() => setShowNewProject(!showNewProject)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {showNewProject && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
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
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewProject(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoadingProjects ? (
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
        ) : projects.length === 0 ? (
          <Card className="col-span-full border-2 border-dashed">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Let's make you better than interns</CardTitle>
              <CardDescription className="text-base pt-2">
                3 steps to your first AI implementation plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Create your first project</p>
                    <p className="text-sm text-muted-foreground">
                      Start with something real. Pick a messy process that needs fixing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Map one real process</p>
                    <p className="text-sm text-muted-foreground">
                      Chat with our AI assistant to build a visual workflow. Takes 10-15 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Scan for AI opportunities & generate a blueprint</p>
                    <p className="text-sm text-muted-foreground">
                      We analyze each step, match tools, and export a professional plan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button size="lg" onClick={() => setShowNewProject(true)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Create a project
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={createDemoProject}
                  disabled={isCreatingDemo}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {isCreatingDemo ? 'Creating demo...' : 'Spin up a demo project'}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-4">
                Demo project comes pre-populated with a sample workflow you can explore
              </p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} prefetch={true}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">{project.status}</span>
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString()}
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
