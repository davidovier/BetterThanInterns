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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Shield, FileText } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type AiUseCase = {
  id: string;
  title: string;
  status: string;
  source: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  metadata: {
    processCount: number;
    opportunityCount: number;
    toolCount: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  pilot: 'bg-yellow-100 text-yellow-800',
  production: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
};

export default function GovernancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [aiUseCases, setAiUseCases] = useState<AiUseCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceAndUseCases();
  }, []);

  const loadWorkspaceAndUseCases = async () => {
    try {
      // Get first workspace
      const workspacesRes = await fetch('/api/workspaces');
      if (!workspacesRes.ok) throw new Error('Failed to load workspaces');
      const workspacesData = await workspacesRes.json();
      const workspaces = workspacesData.ok && workspacesData.data
        ? workspacesData.data.workspaces
        : workspacesData.workspaces;

      if (workspaces && workspaces.length > 0) {
        const wsId = workspaces[0].id;
        setWorkspaceId(wsId);

        // Load AI use cases
        const response = await fetch(`/api/workspaces/${wsId}/ai-use-cases`);
        if (!response.ok) throw new Error('Failed to load AI use cases');

        const result = await response.json();
        const useCases = result.ok && result.data
          ? result.data.aiUseCases
          : result.aiUseCases;

        setAiUseCases(useCases || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load AI use cases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your AI implementations
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Governance</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Track and manage your AI implementations. Because someone has to.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {aiUseCases.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-2">
                No AI use cases yet.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Once you decide which automations to actually ship, they'll show up here instead of your notebook.
              </p>
            </CardContent>
          </Card>
        ) : (
          aiUseCases.map((useCase) => (
            <Link key={useCase.id} href={`/ai-use-cases/${useCase.id}`} prefetch={true}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={STATUS_COLORS[useCase.status] || 'bg-gray-100'}>
                      {useCase.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {useCase.source === 'blueprint' ? 'From Blueprint' : 'Manual'}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {useCase.projectName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span>{useCase.metadata.processCount} processes</span>
                    <span>•</span>
                    <span>{useCase.metadata.opportunityCount} opportunities</span>
                    <span>•</span>
                    <span>{useCase.metadata.toolCount} tools</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created {new Date(useCase.createdAt).toLocaleDateString()}
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
