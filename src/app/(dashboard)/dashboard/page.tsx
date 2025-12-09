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
import { Plus, FolderOpen, Sparkles, CheckCircle2, Circle, FileText, Zap, GitBranch, Target, Shield, Clock, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';

type Workspace = {
  id: string;
  name: string;
};

type AssistantSession = {
  id: string;
  title: string;
  contextSummary: string;
  isDemo: boolean;
  updatedAt: string;
  metadata?: any;
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
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 sm:p-10 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  AI Sessions
                </h1>
              </div>
              <p className="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed">
                Your AI-powered workspace for mapping processes, discovering opportunities, and building automation strategies.
              </p>
              {!isLoadingSessions && sessions.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <TrendingUp className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">{sessions.length} Total Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">
                      {sessions.filter(s => {
                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return new Date(s.updatedAt) > dayAgo;
                      }).length} Active Today
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowNewSession(!showNewSession)}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-white/90 hover:scale-105 transition-all shadow-xl font-semibold shrink-0"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* New Session Form */}
        {showNewSession && (
          <Card className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50 shadow-xl">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">Create New Session</CardTitle>
              </div>
              <CardDescription className="text-sm text-slate-600">
                Give your session a descriptive name. The AI will help you map processes and discover opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createSession} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="session-title" className="text-sm font-semibold text-slate-700">Session Title</Label>
                  <Input
                    id="session-title"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="e.g., Invoice Processing Automation"
                    required
                    className="rounded-xl h-12 border-2 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold hover:scale-105 transition-all shadow-lg w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create Session
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowNewSession(false)}
                    className="border-2 hover:bg-slate-50 font-medium w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sessions Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
            sessions.map((sessionItem, index) => {
              const metadata = sessionItem.metadata || {};
              const processCount = metadata.processIds?.length || 0;
              const opportunityCount = metadata.opportunityIds?.length || 0;
              const blueprintCount = metadata.blueprintIds?.length || 0;
              const useCaseCount = metadata.aiUseCaseIds?.length || 0;
              const totalArtifacts = processCount + opportunityCount + blueprintCount + useCaseCount;

              // Vibrant gradient colors for cards
              const gradients = [
                'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
                'from-blue-500/10 via-cyan-500/10 to-teal-500/10',
                'from-orange-500/10 via-amber-500/10 to-yellow-500/10',
                'from-rose-500/10 via-pink-500/10 to-red-500/10',
                'from-green-500/10 via-emerald-500/10 to-teal-500/10',
                'from-indigo-500/10 via-blue-500/10 to-sky-500/10',
              ];

              const borderGradients = [
                'hover:border-violet-300',
                'hover:border-cyan-300',
                'hover:border-amber-300',
                'hover:border-pink-300',
                'hover:border-emerald-300',
                'hover:border-blue-300',
              ];

              return (
                <Link key={sessionItem.id} href={`/sessions/${sessionItem.id}`} prefetch={true}>
                  <Card className={`group relative rounded-3xl border-2 bg-gradient-to-br ${gradients[index % gradients.length]} shadow-lg hover:shadow-2xl ${borderGradients[index % borderGradients.length]} hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden`}>
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[index % gradients.length].replace(/\/10/g, '')}`}></div>

                    <CardHeader className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length].replace(/\/10/g, '/20')} shrink-0`}>
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                          </div>
                          <CardTitle className="text-lg sm:text-xl font-bold line-clamp-2 flex-1 text-slate-900">
                            {sessionItem.title}
                          </CardTitle>
                        </div>
                        {sessionItem.isDemo && (
                          <Badge className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                            Demo
                          </Badge>
                        )}
                      </div>
                      {sessionItem.contextSummary && (
                        <CardDescription className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {sessionItem.contextSummary}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Streamlined artifact counts - only show if there are artifacts */}
                      {totalArtifacts > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {processCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                              <GitBranch className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm font-semibold text-indigo-700">{processCount}</span>
                              <span className="text-xs text-indigo-600">Process{processCount !== 1 ? 'es' : ''}</span>
                            </div>
                          )}
                          {opportunityCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                              <Target className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-700">{opportunityCount}</span>
                              <span className="text-xs text-emerald-600">Opp{opportunityCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {blueprintCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                              <FileText className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-semibold text-amber-700">{blueprintCount}</span>
                              <span className="text-xs text-amber-600">Blueprint{blueprintCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {useCaseCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-100">
                              <Shield className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-700">{useCaseCount}</span>
                              <span className="text-xs text-purple-600">Use Case{useCaseCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Updated timestamp with better styling */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-500">Last updated</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(sessionItem.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>

                    {/* Hover overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
