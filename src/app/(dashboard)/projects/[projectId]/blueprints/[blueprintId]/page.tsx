'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';
import { PlanUpsellBanner } from '@/components/ui/plan-upsell-banner';

type BlueprintContent = {
  title: string;
  executiveSummary: string;
  currentState: string;
  targetState: string;
  opportunities: Array<{
    id: string;
    title: string;
    summary: string;
    selectedTools: string[];
  }>;
  phases: Array<{
    name: string;
    duration: string;
    objectives: string[];
    activities: string[];
    tools: string[];
    dependencies: string[];
    deliverables: string[];
  }>;
  risks: Array<{
    name: string;
    mitigation: string;
  }>;
  kpis: Array<{
    name: string;
    baseline: string;
    target: string;
  }>;
};

type Blueprint = {
  id: string;
  projectId: string;
  title: string;
  contentJson: BlueprintContent;
  renderedMarkdown: string;
  version: number;
  metadataJson: any;
  createdAt: string;
  updatedAt: string;
};

export default function BlueprintViewPage({
  params,
}: {
  params: { projectId: string; blueprintId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspacePlan } = useWorkspaceContext();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlueprint();
  }, [params.blueprintId]);

  const loadBlueprint = async () => {
    try {
      const response = await fetch(`/api/blueprints/${params.blueprintId}`);
      if (!response.ok) throw new Error('Failed to load blueprint');
      const result = await response.json();

      // Handle new API response format { ok: true, data: {...} }
      const blueprintData = result.ok && result.data ? result.data.blueprint : result.blueprint;

      setBlueprint(blueprintData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blueprint',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportMarkdown = () => {
    window.open(
      `/api/blueprints/${params.blueprintId}/export?format=markdown`,
      '_blank'
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading blueprint...</p>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Blueprint not found</p>
      </div>
    );
  }

  const content = blueprint.contentJson;

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/projects/${params.projectId}`}>
          <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
        <Button onClick={exportMarkdown} className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all">
          <Download className="h-4 w-4 mr-2" />
          Export Markdown
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-gradient-to-br from-muted to-muted/40 p-3 shadow-soft">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{content.title}</h1>
        </div>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground uppercase tracking-wide">
          <span>Version {blueprint.version}</span>
          <span>•</span>
          <span>{new Date(blueprint.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>
            {blueprint.metadataJson?.processCount || 0} processes,{' '}
            {blueprint.metadataJson?.opportunityCount || 0} opportunities
          </span>
        </div>
      </div>

      <PlanUpsellBanner
        currentPlan={currentWorkspacePlan}
        from="blueprint"
        message="Want blueprints that actually ship? Pro gets you governance tracking and risk assessments."
      />

      {/* Executive Summary */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Current State & Target State */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.currentState}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Target State</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.targetState}</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities & Selected Tools */}
      {content.opportunities && content.opportunities.length > 0 && (
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Opportunities & Selected Tools</CardTitle>
            <CardDescription className="text-xs">
              Automation opportunities identified for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.opportunities.map((opp, index) => (
              <div key={opp.id || index} className="space-y-2 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <h3 className="font-semibold text-base">{opp.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{opp.summary}</p>
                {opp.selectedTools && opp.selectedTools.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {opp.selectedTools.map((tool, toolIndex) => (
                      <Badge key={toolIndex} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Implementation Phases */}
      {content.phases && content.phases.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">Implementation Phases</h2>
          {content.phases.map((phase, index) => (
            <Card key={index} className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <CardTitle className="text-base font-semibold">{phase.name}</CardTitle>
                <CardDescription className="text-xs">Duration: {phase.duration}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {phase.objectives && phase.objectives.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Objectives</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.objectives.map((obj, i) => (
                        <li key={i} className="text-muted-foreground text-sm">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.activities && phase.activities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Key Activities</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.activities.map((activity, i) => (
                        <li key={i} className="text-muted-foreground text-sm">
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.tools && phase.tools.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.tools.map((tool, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {phase.dependencies && phase.dependencies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Dependencies</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.dependencies.map((dep, i) => (
                        <li key={i} className="text-muted-foreground text-sm">
                          {dep}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.deliverables && phase.deliverables.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.deliverables.map((deliverable, i) => (
                        <li key={i} className="text-muted-foreground text-sm">
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Risks & Mitigations */}
      {content.risks && content.risks.length > 0 && (
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Risks & Mitigations</CardTitle>
            <CardDescription className="text-xs">
              Potential challenges and how to address them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.risks.map((risk, index) => (
              <div key={index} className="space-y-1 p-3 rounded-lg bg-muted/20">
                <h4 className="font-semibold text-sm">{risk.name}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <span className="font-medium text-xs uppercase tracking-wide">Mitigation:</span>{' '}
                  {risk.mitigation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      {content.kpis && content.kpis.length > 0 && (
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key Performance Indicators</CardTitle>
            <CardDescription className="text-xs">
              Metrics to track implementation success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">KPI</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Baseline</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {content.kpis.map((kpi, index) => (
                    <tr key={index} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-sm">{kpi.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {kpi.baseline}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {kpi.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground pb-8 pt-4">
        Generated with Better Than Interns
      </div>
    </div>
  );
}
