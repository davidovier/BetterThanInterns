'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UnifiedSessionWorkspace } from '@/components/session/UnifiedSessionWorkspace';
import { Loader2 } from 'lucide-react';

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

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<AssistantSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const result = await response.json();

      if (!result.ok || !result.data?.session) {
        throw new Error('Session not found');
      }

      setSession(result.data.session);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
        <p className="text-muted-foreground mb-4">{error || 'Could not load session'}</p>
        <a href="/sessions" className="text-brand-600 hover:underline">
          Back to Sessions
        </a>
      </div>
    );
  }

  return (
    <UnifiedSessionWorkspace
      sessionId={sessionId}
      sessionTitle={session.title}
      sessionData={{
        contextSummary: session.contextSummary,
        updatedAt: session.updatedAt,
      }}
    />
  );
}
