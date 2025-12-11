'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Plus, Clock, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/design-system/EmptyState';
import { PageHeader } from '@/components/design-system/PageHeader';
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
  const [isCreating, setIsCreating] = useState(false);

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

  const createNewSession = async () => {
    if (!currentWorkspaceId) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleDateString()}`,
          workspaceId: currentWorkspaceId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const result = await response.json();
      const newSession = result.ok && result.data
        ? result.data.session
        : result.session;

      if (newSession?.id) {
        router.push(`/sessions/${newSession.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
          <div>
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-4 sm:h-5 w-72 sm:w-96" />
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
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
    <div className="w-full h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Sessions"
            description="Map processes, discover opportunities, and automate workflows"
            icon={MessageSquare}
          />
          <Button onClick={createNewSession} disabled={isCreating}>
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </>
            )}
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="space-y-6">
            <EmptyState
              icon={MessageSquare}
              title="No sessions yet"
              description="Create your first session to start mapping processes and discovering automation opportunities."
            />
            <div className="flex justify-center">
              <Button onClick={createNewSession} disabled={isCreating} size="lg">
                {isCreating ? (
                  'Creating...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Session
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {sessions.map((s) => (
              <Link key={s.id} href={`/sessions/${s.id}`}>
                <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all cursor-pointer group h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{s.title}</span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </CardTitle>
                    {s.contextSummary && (
                      <CardDescription className="line-clamp-2">
                        {s.contextSummary}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Updated {new Date(s.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
