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
import { Shield, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
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

type AiUseCase = {
  id: string;
  title: string;
  description: string;
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
  riskAssessment?: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } | null;
};

const STATUS_COLORS = {
  planned: 'bg-blue-100 border-blue-300 text-blue-800',
  pilot: 'bg-purple-100 border-purple-300 text-purple-800',
  production: 'bg-green-100 border-green-300 text-green-800',
  paused: 'bg-gray-100 border-gray-300 text-gray-800',
};

const RISK_COLORS = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-green-100 border-green-300 text-green-800',
};

export default function GovernanceLibraryPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { currentWorkspaceId, loading: workspaceLoading } = useWorkspaceContext();
  const [aiUseCases, setAiUseCases] = useState<AiUseCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    if (currentWorkspaceId && !workspaceLoading) {
      loadUseCases();
    }
  }, [currentWorkspaceId, workspaceLoading, statusFilter]);

  const loadUseCases = async () => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const url = statusFilter === 'all'
        ? `/api/workspaces/${currentWorkspaceId}/ai-use-cases`
        : `/api/workspaces/${currentWorkspaceId}/ai-use-cases?status=${statusFilter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load AI use cases');

      const result = await response.json();
      const useCasesData = result.ok && result.data
        ? result.data.aiUseCases
        : result.aiUseCases;

      // Fetch risk assessments for each use case
      const useCasesWithRisk = await Promise.all(
        (useCasesData || []).map(async (useCase: any) => {
          try {
            const riskResponse = await fetch(`/api/ai-use-cases/${useCase.id}/risk-assessment`);
            if (riskResponse.ok) {
              const riskResult = await riskResponse.json();
              const riskData = riskResult.ok && riskResult.data
                ? riskResult.data.riskAssessment
                : riskResult.riskAssessment;
              return {
                ...useCase,
                riskAssessment: riskData ? { riskLevel: riskData.riskLevel } : null,
              };
            }
          } catch (error) {
            // Ignore risk assessment errors for individual use cases
          }
          return { ...useCase, riskAssessment: null };
        })
      );

      setAiUseCases(useCasesWithRisk);
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

  // Apply risk filter client-side
  const filteredUseCases = riskFilter === 'all'
    ? aiUseCases
    : aiUseCases.filter((uc) => uc.riskAssessment?.riskLevel === riskFilter);

  // Calculate metrics
  const totalUseCases = filteredUseCases.length;
  const highRiskCount = aiUseCases.filter(
    (uc) => uc.riskAssessment?.riskLevel === 'high' || uc.riskAssessment?.riskLevel === 'critical'
  ).length;
  const compliantCount = aiUseCases.filter(
    (uc) => uc.status === 'production' && uc.riskAssessment?.riskLevel === 'low'
  ).length;

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
        title="Governance Library"
        description="AI use case registry and compliance tracking"
        icon={Shield}
      />

      {aiUseCases.length === 0 && statusFilter === 'all' ? (
        <EmptyState
          icon={Shield}
          title="No use cases yet"
          description="Register governance in a session to track AI implementations, risk assessments, and policy compliance."
        />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Use Cases"
              value={totalUseCases}
              icon={Shield}
              variant="default"
            />
            <MetricCard
              label="High Risk"
              value={highRiskCount}
              icon={AlertTriangle}
              variant="warning"
            />
            <MetricCard
              label="Compliant"
              value={compliantCount}
              icon={CheckCircle2}
              variant="success"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold">All Use Cases</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk:</span>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Use Cases Table */}
          {filteredUseCases.length === 0 ? (
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardContent className="p-12">
                <EmptyState
                  icon={Shield}
                  title="No use cases match your filters"
                  description="Try adjusting your filters to see more use cases."
                  variant="compact"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {totalUseCases} {totalUseCases === 1 ? 'Use Case' : 'Use Cases'}
                </CardTitle>
                <CardDescription>
                  Track governance, risk, and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUseCases.map((useCase) => (
                    <Link
                      key={useCase.id}
                      href={`/ai-use-cases/${useCase.id}`}
                      prefetch={true}
                    >
                      <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 hover:border-primary/40 hover:-translate-y-[1px] transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-base">{useCase.title}</h3>
                              <Badge
                                variant="outline"
                                className={STATUS_COLORS[useCase.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.planned}
                              >
                                {useCase.status}
                              </Badge>
                              {useCase.riskAssessment && (
                                <Badge
                                  variant="outline"
                                  className={RISK_COLORS[useCase.riskAssessment.riskLevel]}
                                >
                                  {useCase.riskAssessment.riskLevel} risk
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {useCase.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Project: {useCase.projectName}</span>
                              <span>•</span>
                              <span>{useCase.metadata.processCount} processes</span>
                              <span>•</span>
                              <span>{useCase.metadata.toolCount} tools</span>
                              <span>•</span>
                              <span>Source: {useCase.source}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {new Date(useCase.createdAt).toLocaleDateString('en-US', {
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
