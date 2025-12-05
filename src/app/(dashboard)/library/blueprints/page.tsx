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
import { FileText, Code, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';
import { PageHeader } from '@/components/design-system/PageHeader';

type Blueprint = {
  id: string;
  title: string;
  preview: string;
  version: number;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
};

export default function BlueprintLibraryPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { currentWorkspaceId, loading: workspaceLoading } = useWorkspaceContext();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadBlueprints();
    }
  }, [currentWorkspaceId, workspaceLoading]);

  const loadBlueprints = async () => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspaceId}/blueprints`);
      if (!response.ok) throw new Error('Failed to load blueprints');

      const result = await response.json();
      const blueprintsData = result.ok && result.data
        ? result.data.blueprints
        : result.blueprints;

      setBlueprints(blueprintsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blueprints',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalBlueprints = blueprints.length;
  const latestVersion = blueprints.length > 0
    ? Math.max(...blueprints.map((b) => b.version))
    : 0;
  const blueprintsThisMonth = blueprints.filter((b) => {
    const createdDate = new Date(b.createdAt);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return createdDate > monthAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <PageHeader
        title="Blueprint Library"
        description="Implementation blueprints generated from your processes"
        icon={FileText}
      />

      {blueprints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No blueprints yet"
          description="Request a blueprint in a session to generate one. Blueprints provide detailed implementation plans for your automation opportunities."
        />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Blueprints"
              value={totalBlueprints}
              icon={FileText}
              variant="default"
            />
            <MetricCard
              label="Latest Version"
              value={latestVersion}
              icon={Code}
              variant="primary"
            />
            <MetricCard
              label="Blueprints This Month"
              value={blueprintsThisMonth}
              icon={TrendingUp}
              variant="success"
            />
          </div>

          {/* Blueprints Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Blueprints</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blueprints.map((blueprint) => (
                <Link
                  key={blueprint.id}
                  href={`/projects/${blueprint.projectId}/blueprints/${blueprint.id}`}
                  prefetch={true}
                >
                  <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft hover:shadow-medium hover:border-primary/40 hover:-translate-y-[2px] transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                          {blueprint.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          v{blueprint.version}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-1">
                        {blueprint.projectName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {blueprint.preview && (
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {blueprint.preview}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>Blueprint</span>
                          </div>
                          <span>
                            {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
