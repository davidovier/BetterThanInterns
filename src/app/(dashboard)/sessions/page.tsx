'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Briefcase, GitBranch, Target } from 'lucide-react';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

// Premium session components
import { AnimatedBackground } from '@/components/sessions/AnimatedBackground';
import { SessionsHeader } from '@/components/sessions/SessionsHeader';
import { SessionsFilterBar, FilterType, SortType, ViewType } from '@/components/sessions/SessionsFilterBar';
import { SessionCard } from '@/components/sessions/SessionCard';

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
  const {
    currentWorkspaceId,
    currentWorkspaceName,
    currentWorkspacePlan,
    loading: workspaceLoading,
  } = useWorkspaceContext();

  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filter & Sort state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('updated');
  const [viewType, setViewType] = useState<ViewType>('grid');

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
      const sessionsData = result.ok && result.data ? result.data.sessions : result.sessions;

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
      const newSession = result.ok && result.data ? result.data.session : result.session;

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

  // Filter & Sort Logic
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply filter
    switch (activeFilter) {
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((s) => new Date(s.updatedAt) > weekAgo);
        break;
      case 'with-processes':
        filtered = filtered.filter((s) => s.metadata?.processIds?.length > 0);
        break;
      case 'with-opportunities':
        filtered = filtered.filter((s) => s.metadata?.opportunityIds?.length > 0);
        break;
      case 'all':
      default:
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'updated':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'created':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [sessions, activeFilter, sortBy]);

  // Compute metrics
  const recentSessionsCount = sessions.filter((s) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(s.updatedAt) > weekAgo;
  }).length;

  const sessionsWithProcesses = sessions.filter((s) => s.metadata?.processIds?.length > 0).length;
  const sessionsWithOpportunities = sessions.filter((s) => s.metadata?.opportunityIds?.length > 0).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <AnimatedBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <SessionsHeader
          workspaceName={currentWorkspaceName}
          workspacePlan={currentWorkspacePlan}
          onNewSession={() => setShowNewSession(true)}
        />

        {/* Metrics Row */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <MetricCard label="Total Sessions" value={sessions.length} icon={Briefcase} variant="default" />
            <MetricCard
              label="With Processes"
              value={sessionsWithProcesses}
              icon={GitBranch}
              variant="primary"
            />
            <MetricCard
              label="Active This Week"
              value={recentSessionsCount}
              icon={Target}
              variant="success"
            />
          </motion.div>
        )}

        {/* Filter & Sort Bar */}
        {sessions.length > 0 && (
          <SessionsFilterBar
            activeFilter={activeFilter}
            sortBy={sortBy}
            viewType={viewType}
            onFilterChange={setActiveFilter}
            onSortChange={setSortBy}
            onViewChange={setViewType}
          />
        )}

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <EmptyState
              icon={Briefcase}
              title="No sessions yet"
              description="Start a session to map a process with the assistant, turn it into a visual workflow, and spot automation opportunities."
            />
            <Button
              onClick={() => setShowNewSession(true)}
              size="lg"
              className="mt-6 bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md"
            >
              Create Your First Session
            </Button>
          </motion.div>
        ) : filteredAndSortedSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <p className="text-slate-600 text-center">
              No sessions match your current filter. Try a different filter or create a new session.
            </p>
          </motion.div>
        ) : (
          <div className={viewType === 'grid' ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredAndSortedSessions.map((sessionItem, index) => (
              <SessionCard
                key={sessionItem.id}
                session={sessionItem}
                index={index}
                onEdit={() => handleEdit(sessionItem)}
                onDelete={() => setDeletingSession(sessionItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Give your session a descriptive name. The AI will help you map processes and discover opportunities.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createSession} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="e.g., Invoice Processing Automation"
                required
                className="h-11"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewSession(false);
                  setNewSessionTitle('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-brand-600 hover:bg-brand-700">
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>Change the name of your session</DialogDescription>
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
