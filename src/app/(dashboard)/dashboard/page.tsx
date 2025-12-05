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
import { Plus, FolderOpen, Sparkles, CheckCircle2, Circle, FileText, Zap, GitBranch, Target, Shield } from 'lucide-react';
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

type AssistantSession = {
  id: string;
  title: string;
  contextSummary: string;
  isDemo: boolean;
  updatedAt: string;
  metadata?: any;
  project?: {
    id: string;
    name: string;
  };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadSessions(selectedWorkspace);
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

  const loadSessions = async (workspaceId: string) => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(
        `/api/sessions?workspaceId=${workspaceId}`
      );
      if (!response.ok) throw new Error('Failed to load sessions');
      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const sessionsData = result.ok && result.data ? result.data.sessions : result.sessions;

      setSessions(sessionsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessionTitle,
          workspaceId: selectedWorkspace,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const sessionData = result.ok && result.data ? result.data.session : result.session;

      toast({
        title: 'Session created',
        description: 'Your new session is ready',
      });

      // Redirect to the new session
      window.location.href = `/sessions/${sessionData.id}`;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground mt-2">
              Start a conversation. The AI extracts processes, identifies opportunities, and generates blueprints automatically.
            </p>
          </div>
          <Button
            onClick={() => setShowNewSession(!showNewSession)}
            className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Metrics Row - Only show when there are sessions */}
        {!isLoadingSessions && sessions.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Sessions"
              value={sessions.length}
              icon={Sparkles}
              variant="default"
            />
            <MetricCard
              label="With Projects"
              value={sessions.filter(s => s.project).length}
              icon={FolderOpen}
              variant="primary"
            />
            <MetricCard
              label="Recent Sessions"
              value={sessions.filter(s => {
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return new Date(s.updatedAt) > dayAgo;
              }).length}
              icon={CheckCircle2}
              variant="success"
            />
          </div>
        )}

        {/* New Session Form */}
        {showNewSession && (
          <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Create New Session</CardTitle>
              <CardDescription>
                Start a conversation with the AI assistant to explore your workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createSession} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-title">Session Title</Label>
                  <Input
                    id="session-title"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="e.g., Exploring Invoice Processing"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all"
                  >
                    {isLoading ? 'Creating...' : 'Create Session'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowNewSession(false)}
                    className="hover:-translate-y-[1px] transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sessions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingSessions ? (
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
          ) : sessions.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Sparkles}
                title="Start your first session"
                description="Create a new session to chat with the AI assistant. Map processes, find automation opportunities, and build implementation blueprints."
                action={{
                  label: 'Create Your First Session',
                  onClick: () => setShowNewSession(true),
                }}
              />
            </div>
          ) : (
            sessions.map((sessionItem) => {
              const metadata = sessionItem.metadata || {};
              const processCount = metadata.processIds?.length || 0;
              const opportunityCount = metadata.opportunityIds?.length || 0;
              const blueprintCount = metadata.blueprintIds?.length || 0;
              const useCaseCount = metadata.aiUseCaseIds?.length || 0;
              const totalArtifacts = processCount + opportunityCount + blueprintCount + useCaseCount;

              return (
                <Link key={sessionItem.id} href={`/sessions/${sessionItem.id}`} prefetch={true}>
                  <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-[2px] transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl font-semibold">{sessionItem.title}</CardTitle>
                        {sessionItem.isDemo && (
                          <Badge variant="outline" className="text-xs">
                            Demo
                          </Badge>
                        )}
                      </div>
                      {sessionItem.contextSummary && (
                        <CardDescription className="text-base line-clamp-2">
                          {sessionItem.contextSummary}
                        </CardDescription>
                      )}
                      {sessionItem.project && (
                        <div className="flex items-center gap-2 mt-2">
                          <FolderOpen className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {sessionItem.project.name}
                          </span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {totalArtifacts > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {processCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <GitBranch className="h-3 w-3 mr-1" />
                              {processCount} {processCount === 1 ? 'Process' : 'Processes'}
                            </Badge>
                          )}
                          {opportunityCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              {opportunityCount}
                            </Badge>
                          )}
                          {blueprintCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {blueprintCount}
                            </Badge>
                          )}
                          {useCaseCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {useCaseCount}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Sparkles className="h-4 w-4 mr-2" />
                          <span>Session</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(sessionItem.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
  );
}
