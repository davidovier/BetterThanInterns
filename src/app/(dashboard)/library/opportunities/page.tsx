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
import { Zap, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { EmptyState } from '@/components/design-system/EmptyState';
import { MetricCard } from '@/components/design-system/MetricCard';
import { PageHeader } from '@/components/design-system/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Opportunity = {
  id: string;
  title: string;
  description: string;
  opportunityType: string;
  impactLevel: string;
  effortLevel: string;
  impactScore: number;
  feasibilityScore: number;
  processId: string;
  processName: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

const IMPACT_COLORS = {
  high: 'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-green-100 border-green-300 text-green-800',
};

export default function OpportunityLibraryPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { currentWorkspaceId, loading: workspaceLoading } = useWorkspaceContext();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [impactFilter, setImpactFilter] = useState<string>('all');

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadOpportunities();
    }
  }, [currentWorkspaceId, workspaceLoading, impactFilter]);

  const loadOpportunities = async () => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const url = impactFilter === 'all'
        ? `/api/workspaces/${currentWorkspaceId}/opportunities`
        : `/api/workspaces/${currentWorkspaceId}/opportunities?impactLevel=${impactFilter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load opportunities');

      const result = await response.json();
      const opportunitiesData = result.ok && result.data
        ? result.data.opportunities
        : result.opportunities;

      setOpportunities(opportunitiesData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalOpportunities = opportunities.length;
  const highImpactCount = opportunities.filter((o) => o.impactLevel === 'high').length;
  const averageImpactScore = totalOpportunities > 0
    ? Math.round(opportunities.reduce((sum, o) => sum + o.impactScore, 0) / totalOpportunities)
    : 0;

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
        title="Opportunity Library"
        description="Automation opportunities identified across all processes"
        icon={Zap}
      />

      {opportunities.length === 0 && impactFilter === 'all' ? (
        <EmptyState
          icon={Zap}
          title="No opportunities yet"
          description="Map processes and scan for automation opportunities. The AI will identify high-impact automation candidates for you."
        />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Opportunities"
              value={totalOpportunities}
              icon={Zap}
              variant="default"
            />
            <MetricCard
              label="High Impact"
              value={highImpactCount}
              icon={Target}
              variant="warning"
            />
            <MetricCard
              label="Avg Impact Score"
              value={averageImpactScore}
              icon={TrendingUp}
              variant="primary"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Opportunities</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by impact:</span>
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opportunities Table */}
          {opportunities.length === 0 ? (
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardContent className="p-12">
                <EmptyState
                  icon={Zap}
                  title={`No ${impactFilter} impact opportunities`}
                  description="Try adjusting your filter to see more opportunities."
                  variant="compact"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {totalOpportunities} {totalOpportunities === 1 ? 'Opportunity' : 'Opportunities'}
                </CardTitle>
                <CardDescription>
                  Sorted by impact score (highest first)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map((opportunity) => (
                    <Link
                      key={opportunity.id}
                      href={`/projects/${opportunity.projectId}/processes/${opportunity.processId}`}
                      prefetch={true}
                    >
                      <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 hover:border-primary/40 hover:-translate-y-[1px] transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-base">{opportunity.title}</h3>
                              <Badge
                                variant="outline"
                                className={IMPACT_COLORS[opportunity.impactLevel as keyof typeof IMPACT_COLORS] || IMPACT_COLORS.low}
                              >
                                {opportunity.impactLevel} impact
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Score: {opportunity.impactScore}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {opportunity.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Process: {opportunity.processName}</span>
                              <span>•</span>
                              <span>Type: {opportunity.opportunityType.replace(/_/g, ' ')}</span>
                              <span>•</span>
                              <span>Effort: {opportunity.effortLevel}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {new Date(opportunity.createdAt).toLocaleDateString('en-US', {
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
          )}
        </>
      )}
    </div>
  );
}
