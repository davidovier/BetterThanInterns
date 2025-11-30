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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/projects/${params.projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
        <Button onClick={exportMarkdown}>
          <Download className="h-4 w-4 mr-2" />
          Export Markdown
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8" />
          <h1 className="text-4xl font-bold">{content.title}</h1>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{content.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Current State & Target State */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{content.currentState}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Target State</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{content.targetState}</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities & Selected Tools */}
      {content.opportunities && content.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunities & Selected Tools</CardTitle>
            <CardDescription>
              Automation opportunities identified for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.opportunities.map((opp, index) => (
              <div key={opp.id || index} className="space-y-2">
                <h3 className="font-semibold text-lg">{opp.title}</h3>
                <p className="text-muted-foreground">{opp.summary}</p>
                {opp.selectedTools && opp.selectedTools.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {opp.selectedTools.map((tool, toolIndex) => (
                      <Badge key={toolIndex} variant="secondary">
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
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Implementation Phases</h2>
          {content.phases.map((phase, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{phase.name}</CardTitle>
                <CardDescription>Duration: {phase.duration}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {phase.objectives && phase.objectives.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Objectives</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.objectives.map((obj, i) => (
                        <li key={i} className="text-muted-foreground">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.activities && phase.activities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Activities</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.activities.map((activity, i) => (
                        <li key={i} className="text-muted-foreground">
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.tools && phase.tools.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.tools.map((tool, i) => (
                        <Badge key={i} variant="outline">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {phase.dependencies && phase.dependencies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Dependencies</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.dependencies.map((dep, i) => (
                        <li key={i} className="text-muted-foreground">
                          {dep}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase.deliverables && phase.deliverables.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {phase.deliverables.map((deliverable, i) => (
                        <li key={i} className="text-muted-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle>Risks & Mitigations</CardTitle>
            <CardDescription>
              Potential challenges and how to address them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.risks.map((risk, index) => (
              <div key={index} className="space-y-1">
                <h4 className="font-semibold">{risk.name}</h4>
                <p className="text-muted-foreground">
                  <span className="font-medium">Mitigation:</span>{' '}
                  {risk.mitigation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      {content.kpis && content.kpis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>
              Metrics to track implementation success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">KPI</th>
                    <th className="text-left py-2 px-4">Baseline</th>
                    <th className="text-left py-2 px-4">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {content.kpis.map((kpi, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 font-medium">{kpi.name}</td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {kpi.baseline}
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">
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

      <div className="text-center text-sm text-muted-foreground pb-8">
        Generated with Better Than Interns
      </div>
    </div>
  );
}
