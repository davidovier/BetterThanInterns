'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Briefcase, GitBranch, Target, Plus, ArrowRight } from 'lucide-react';
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
import { FeaturedSession } from '@/components/sessions/FeaturedSession';
import { SessionWithState, deriveSessionState } from '@/lib/sessionUtils';

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
        title: 'Session Created',
        description: 'Your new session is ready.',
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
        title: 'Session Updated',
        description: 'Changes saved.',
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
        title: 'Session Deleted',
        description: 'Session removed.',
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

  // M18: Derive session states from existing data
  const sessionsWithStates = useMemo(() => {
    return sessions.map(session => ({
      ...session,
      state: deriveSessionState(session as SessionWithState)
    }));
  }, [sessions]);

  // M18: Featured session (most recently updated)
  const featuredSession = sessionsWithStates.length > 0
    ? sessionsWithStates[0]  // Already sorted by updatedAt
    : null;

  // Filter & Sort Logic
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessionsWithStates];

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
  }, [sessionsWithStates, activeFilter, sortBy]);

  // M18: Compute metrics with directional trends
  const recentSessionsCount = sessions.filter((s) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(s.updatedAt) > weekAgo;
  }).length;

  const previousWeekSessionsCount = sessions.filter((s) => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(s.updatedAt);
    return updatedAt > twoWeeksAgo && updatedAt <= weekAgo;
  }).length;

  const activeDirection = recentSessionsCount > previousWeekSessionsCount
    ? 'up' as const
    : recentSessionsCount < previousWeekSessionsCount
    ? 'down' as const
    : 'neutral' as const;

  const activeDelta = Math.abs(recentSessionsCount - previousWeekSessionsCount);
  const activeDirectionLabel = activeDirection === 'neutral'
    ? 'No change vs last week'
    : `${activeDelta} ${activeDirection === 'up' ? 'more' : 'fewer'} than last week`;

  const sessionsWithProcesses = sessions.filter((s) => s.metadata?.processIds?.length > 0).length;
  const sessionsWithOpportunities = sessions.filter((s) => s.metadata?.opportunityIds?.length > 0).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-subtle to-background">
        <AnimatedBackground />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-3 rounded-lg" />
            <Skeleton className="h-5 w-96 rounded-lg" />
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="flat" className="rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="flat" className="rounded-xl">
                <CardContent className="p-5">
                  <Skeleton className="h-40 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-subtle to-background">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-8">
        {/* Header */}
        <SessionsHeader
          workspaceName={currentWorkspaceName}
          workspacePlan={currentWorkspacePlan}
          onNewSession={() => setShowNewSession(true)}
        />

        {/* M18: Featured Session - "Where to go next" */}
        {featuredSession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FeaturedSession session={featuredSession} />
          </motion.div>
        )}

        {/* M18: Metrics Row with directional hints */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
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
              direction={activeDirection}
              directionLabel={activeDirectionLabel}
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
            className="flex flex-col items-center justify-center py-20"
          >
            <EmptyState
              icon={Briefcase}
              title="No sessions yet."
              description="Start a session to map a process with the assistant, turn it into a visual workflow, and spot automation opportunities."
            />
            <Button
              onClick={() => setShowNewSession(true)}
              variant="brand"
              size="lg"
              className="mt-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first session
            </Button>
          </motion.div>
        ) : filteredAndSortedSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Card variant="flat" className="max-w-md text-center p-8">
              <p className="text-muted-foreground">
                No sessions match your current filter. Try a different filter or create a new session.
              </p>
              <Button
                onClick={() => setActiveFilter('all')}
                variant="outline"
                className="mt-4"
              >
                Clear filters
              </Button>
            </Card>
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl">New working session</DialogTitle>
            <DialogDescription className="text-base">
              Name your session. The assistant will help you map processes and identify opportunities.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createSession} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="session-title" className="text-sm font-medium">Session title</Label>
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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowNewSession(false);
                  setNewSessionTitle('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create session
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Rename session</DialogTitle>
            <DialogDescription>Update the session title.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">Session title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter session name"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingSession(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleUpdate} disabled={isUpdating || !editTitle.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSession} onOpenChange={(open) => !open && setDeletingSession(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete session</DialogTitle>
            <DialogDescription className="text-base">
              This will permanently delete &ldquo;{deletingSession?.title}&rdquo; and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" onClick={() => setDeletingSession(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
