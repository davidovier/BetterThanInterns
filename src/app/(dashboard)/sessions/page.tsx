'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Sparkles, GitBranch, Target, Loader2, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';

type AssistantSession = {
  id: string;
  title: string;
  contextSummary: string;
  workspaceId: string;
  metadata: any;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function SessionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspaceId, loading: workspaceLoading } = useWorkspaceContext();
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingSession, setEditingSession] = useState<AssistantSession | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deletingSession, setDeletingSession] = useState<AssistantSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadSessions();
    }
  }, [currentWorkspaceId, workspaceLoading]);

  const loadSessions = async () => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?workspaceId=${currentWorkspaceId}`);
      if (!response.ok) throw new Error('Failed to load sessions');

      const result = await response.json();
      const sessionsData = result.ok && result.data
        ? result.data.sessions
        : result.sessions;

      setSessions(sessionsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId || !newSessionTitle.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessionTitle,
          workspaceId: currentWorkspaceId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const result = await response.json();
      const newSession = result.ok && result.data
        ? result.data.session
        : result.session;

      toast({
        title: 'Session created',
        description: 'Your new session is ready',
      });

      router.push(`/sessions/${newSession.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  };

  const handleEdit = (sessionItem: AssistantSession) => {
    setEditingSession(sessionItem);
    setEditTitle(sessionItem.title);
  };

  const handleUpdate = async () => {
    if (!editingSession || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sessions/${editingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle }),
      });

      if (!response.ok) throw new Error('Failed to update session');

      toast({
        title: 'Session updated',
        description: 'Session name has been changed',
      });

      setEditingSession(null);
      setEditTitle('');
      await loadSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update session',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSession) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sessions/${deletingSession.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete session');

      toast({
        title: 'Session deleted',
        description: 'Session has been removed',
      });

      setDeletingSession(null);
      await loadSessions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const recentSessionsCount = sessions.filter(s => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(s.updatedAt) > dayAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <div>
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-72 sm:w-96" />
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Start a conversation. The AI extracts processes, identifies opportunities, and generates blueprints automatically.
          </p>
        </div>
        <Button
          onClick={() => setShowNewSession(!showNewSession)}
          className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all w-full sm:w-auto"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Metrics Row - Only show when there are sessions */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <MetricCard
            label="Total Sessions"
            value={sessions.length}
            icon={Sparkles}
            variant="default"
          />
          <MetricCard
            label="With Processes"
            value={sessions.filter(s => s.metadata?.processIds?.length > 0).length}
            icon={GitBranch}
            variant="primary"
          />
          <MetricCard
            label="Recent Sessions"
            value={recentSessionsCount}
            icon={Target}
            variant="success"
          />
        </div>
      )}

      {/* New Session Form */}
      {showNewSession && (
        <Card className="rounded-3xl border-2 shadow-soft bg-gradient-to-br from-brand-50/30 to-brand-50/10">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create New Session</CardTitle>
            <CardDescription className="text-sm">
              Give your session a descriptive name. The AI will help you map processes and discover opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSession} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="session-title" className="text-sm font-semibold">Session Title</Label>
                <Input
                  id="session-title"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="e.g., Invoice Processing Automation"
                  required
                  className="rounded-xl h-12 border-2 focus:border-brand-400 focus:ring-brand-400 text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isCreating}
                  size="lg"
                  className="bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white font-semibold hover:scale-105 transition-all shadow-lg w-full sm:w-auto"
                >
                  {isCreating ? (
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
                  onClick={() => {
                    setShowNewSession(false);
                    setNewSessionTitle('');
                  }}
                  className="border-2 hover:bg-muted/50 font-medium w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="col-span-full">
          <EmptyState
            icon={Sparkles}
            title="Start your first session"
            description="Create a new session to chat with the AI assistant. Map processes, find automation opportunities, and build implementation blueprints."
          />
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowNewSession(true)}
              size="lg"
              className="bg-brand-500 hover:bg-brand-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Session
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((sessionItem, index) => {
            const metadata = sessionItem.metadata || {};
            const processCount = metadata.processIds?.length || 0;
            const opportunityCount = metadata.opportunityIds?.length || 0;
            const totalArtifacts = processCount + opportunityCount;

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
              <Card key={sessionItem.id} className={`group relative rounded-3xl border-2 bg-gradient-to-br ${gradients[index % gradients.length]} shadow-lg hover:shadow-2xl ${borderGradients[index % borderGradients.length]} hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden`}>
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[index % gradients.length].replace(/\/10/g, '')}`}></div>

                <CardHeader className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Link href={`/sessions/${sessionItem.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length].replace(/\/10/g, '/20')} shrink-0`}>
                        <Sparkles className="h-5 w-5 text-brand-600" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl font-bold line-clamp-2 flex-1">
                        {sessionItem.title}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {sessionItem.isDemo && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          Demo
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            handleEdit(sessionItem);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingSession(sessionItem);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {sessionItem.contextSummary && (
                    <Link href={`/sessions/${sessionItem.id}`}>
                      <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                        {sessionItem.contextSummary}
                      </CardDescription>
                    </Link>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <Link href={`/sessions/${sessionItem.id}`}>
                    {/* Artifact counts */}
                    {totalArtifacts > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {processCount > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-100">
                            <GitBranch className="h-4 w-4 text-brand-600" />
                            <span className="text-sm font-semibold text-brand-700">{processCount}</span>
                            <span className="text-xs text-brand-600">Process{processCount !== 1 ? 'es' : ''}</span>
                          </div>
                        )}
                        {opportunityCount > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <Target className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">{opportunityCount}</span>
                            <span className="text-xs text-emerald-600">Opp{opportunityCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Updated timestamp */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-xs font-medium text-muted-foreground">Last updated</span>
                      <span className="text-xs font-semibold">
                        {new Date(sessionItem.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </Link>
                </CardContent>

                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>
              Change the name of your session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Session Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter session name"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !editTitle.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSession} onOpenChange={(open) => !open && setDeletingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingSession?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSession(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
