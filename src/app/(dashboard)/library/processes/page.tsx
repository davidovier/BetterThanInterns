'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Network, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';
import { PageHeader } from '@/components/design-system/PageHeader';

type Process = {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  projectId: string;
  projectName: string;
  stepCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProcessLibraryPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { currentWorkspaceId, loading: workspaceLoading } = useWorkspaceContext();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadProcesses();
    }
  }, [currentWorkspaceId, workspaceLoading]);

  const loadProcesses = async () => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspaceId}/processes`);
      if (!response.ok) throw new Error('Failed to load processes');

      const result = await response.json();
      const processesData = result.ok && result.data
        ? result.data.processes
        : result.processes;

      setProcesses(processesData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load processes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalProcesses = processes.length;
  const averageSteps = totalProcesses > 0
    ? Math.round(processes.reduce((sum, p) => sum + p.stepCount, 0) / totalProcesses)
    : 0;
  const processesThisWeek = processes.filter((p) => {
    const createdDate = new Date(p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
          <div>
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-4 sm:h-5 w-72 sm:w-96" />
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <PageHeader
          title="Process Library"
          description="All mapped processes across your sessions"
          icon={Network}
        />

        {processes.length === 0 ? (
          <EmptyState
            icon={Network}
            title="No processes yet"
            description="Start a session to map your first process. Processes capture your workflows and identify automation opportunities."
          />
        ) : (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <MetricCard
                label="Total Processes"
                value={totalProcesses}
                icon={Network}
                variant="default"
              />
              <MetricCard
                label="Average Steps"
                value={averageSteps}
                icon={FileText}
                variant="primary"
              />
              <MetricCard
                label="Processes This Week"
                value={processesThisWeek}
                icon={TrendingUp}
                variant="success"
              />
            </div>

            {/* Processes Table */}
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg sm:text-xl font-semibold">All Processes</CardTitle>
                <CardDescription className="text-sm">
                  {totalProcesses} {totalProcesses === 1 ? 'process' : 'processes'} mapped
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {processes.map((process) => (
                    <Link
                      key={process.id}
                      href={`/processes/${process.id}`}
                      prefetch={true}
                    >
                      <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 hover:border-primary/40 hover:-translate-y-[1px] transition-all cursor-pointer">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{process.name}</h3>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {process.stepCount} {process.stepCount === 1 ? 'step' : 'steps'}
                              </Badge>
                            </div>
                            {process.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {process.description}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                              <span className="truncate">Project: {process.projectName}</span>
                              {process.owner && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="truncate">Owner: {process.owner}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-left sm:text-right shrink-0">
                            {new Date(process.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
