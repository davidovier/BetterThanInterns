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
import { Plus, FolderOpen } from 'lucide-react';
import Link from 'next/link';

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
      const data = await response.json();
      setWorkspaces(data.workspaces);
      if (data.workspaces.length > 0) {
        setSelectedWorkspace(data.workspaces[0].id);
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
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects`
      );
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
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

      const data = await response.json();
      setProjects([data.project, ...projects]);
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
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No projects yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
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
