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
import { Shield, FileText, Activity, CheckCircle2, Clock, Pause } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PlanUpsellBanner } from '@/components/ui/plan-upsell-banner';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';

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

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any, label: string }> = {
  planned: { variant: 'secondary', icon: Clock, label: 'Planned' },
  pilot: { variant: 'default', icon: Activity, label: 'Pilot' },
  production: { variant: 'outline', icon: CheckCircle2, label: 'Production' },
  paused: { variant: 'secondary', icon: Pause, label: 'Paused' },
};

export default function GovernancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { currentWorkspaceId, currentWorkspacePlan, loading: workspaceLoading } = useWorkspaceContext();
  const [aiUseCases, setAiUseCases] = useState<AiUseCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadUseCases();
    }
  }, [currentWorkspaceId, workspaceLoading]);

  const loadUseCases = async () => {
    if (!currentWorkspaceId) return;

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspaceId}/ai-use-cases`);
      if (!response.ok) throw new Error('Failed to load AI use cases');

      const result = await response.json();
      const useCases = result.ok && result.data
        ? result.data.aiUseCases
        : result.aiUseCases;

      setAiUseCases(useCases || []);
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

  // Group by status
  const groupedByStatus = aiUseCases.reduce((acc, useCase) => {
    const status = useCase.status || 'planned';
    if (!acc[status]) acc[status] = [];
    acc[status].push(useCase);
    return acc;
  }, {} as Record<string, AiUseCase[]>);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl">
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
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <PageHeader
        title="AI Governance"
        description="Track and manage your AI implementations. Because someone has to."
        actions={
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-muted/60 px-4 py-1.5">
              <span className="text-sm font-medium">{aiUseCases.length} use {aiUseCases.length === 1 ? 'case' : 'cases'}</span>
            </div>
          </div>
        }
      />

      <PlanUpsellBanner currentPlan={currentWorkspacePlan} from="governance" />

      {aiUseCases.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No AI use cases yet"
          description="Once you decide which automations to actually ship, create an AI use case from your project to track governance, risk assessments, and policy compliance. Your compliance team will thank you."
        />
      ) : (
        <div className="space-y-8">
          {/* Group by status */}
          {Object.entries(groupedByStatus).map(([status, cases]) => {
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.planned;
            const StatusIcon = config.icon;

            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-muted/60 p-2">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {config.label}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{cases.length}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cases.map((useCase) => (
                    <Link key={useCase.id} href={`/ai-use-cases/${useCase.id}`} prefetch={true}>
                      <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium hover:border-primary/40 hover:-translate-y-[1px] transition-all h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={config.variant} className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {useCase.source === 'blueprint' ? 'Blueprint' : 'Manual'}
                            </span>
                          </div>
                          <CardTitle className="text-base font-semibold leading-tight">
                            {useCase.title}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {useCase.projectName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{useCase.metadata.processCount}</span>
                              <span>processes</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{useCase.metadata.toolCount}</span>
                              <span>tools</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(useCase.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
