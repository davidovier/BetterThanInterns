'use client';

import { useEffect, useState } from 'react';
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
import { ArrowLeft, FileText, FolderOpen, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type AiUseCase = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  linkedProcessIds: string[];
  linkedOpportunityIds: string[];
  linkedToolIds: string[];
  metadata: {
    processCount: number;
    opportunityCount: number;
    toolCount: number;
  };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
};

type Blueprint = {
  id: string;
  title: string;
  version: number;
  createdAt: string;
} | null;

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  pilot: 'bg-yellow-100 text-yellow-800',
  production: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
};

export default function AiUseCaseDetailPage({
  params,
}: {
  params: { aiUseCaseId: string };
}) {
  const { toast } = useToast();
  const [useCase, setUseCase] = useState<AiUseCase | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUseCase();
  }, [params.aiUseCaseId]);

  const loadUseCase = async () => {
    try {
      const response = await fetch(`/api/ai-use-cases/${params.aiUseCaseId}`);
      if (!response.ok) throw new Error('Failed to load AI use case');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      setUseCase(data.aiUseCase);
      setProject(data.project);
      setBlueprint(data.blueprint);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load AI use case',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading AI use case...</p>
      </div>
    );
  }

  if (!useCase || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">AI use case not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/governance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Governance
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <h1 className="text-4xl font-bold">{useCase.title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={STATUS_COLORS[useCase.status] || 'bg-gray-100'}>
            {useCase.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {useCase.source === 'blueprint' ? 'Created from Blueprint' : 'Manually Created'}
          </span>
          {useCase.owner && (
            <>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">Owner: {useCase.owner}</span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{useCase.description}</p>
        </CardContent>
      </Card>

      {/* Project & Blueprint Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{project.name}</p>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {blueprint && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blueprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{blueprint.title}</p>
                <p className="text-sm text-muted-foreground">
                  Version {blueprint.version} • {new Date(blueprint.createdAt).toLocaleDateString()}
                </p>
                <Link href={`/projects/${project.id}/blueprints/${blueprint.id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    <FileText className="h-4 w-4 mr-2" />
                    View Blueprint
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Linked Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Resources</CardTitle>
          <CardDescription>
            Processes, opportunities, and tools associated with this AI use case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Processes</p>
            <p className="text-muted-foreground">{useCase.metadata.processCount} process{useCase.metadata.processCount !== 1 ? 'es' : ''} linked</p>
          </div>
          <div>
            <p className="font-medium mb-2">Opportunities</p>
            <p className="text-muted-foreground">{useCase.metadata.opportunityCount} automation opportunit{useCase.metadata.opportunityCount !== 1 ? 'ies' : 'y'} identified</p>
          </div>
          <div>
            <p className="font-medium mb-2">Tools</p>
            <p className="text-muted-foreground">{useCase.metadata.toolCount} tool{useCase.metadata.toolCount !== 1 ? 's' : ''} recommended</p>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Sections (G2+) */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span>Risk & Impact Assessment</span>
          </CardTitle>
          <CardDescription>Coming soon in Governance Milestone G2</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Assess business impact, technical risks, and regulatory considerations for this AI implementation.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span>Policies & Controls</span>
          </CardTitle>
          <CardDescription>Coming soon in Governance Milestone G2</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Map applicable policies and implement controls for responsible AI deployment.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span>Monitoring & Reviews</span>
          </CardTitle>
          <CardDescription>Coming soon in Governance Milestone G3</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track performance, conduct reviews, and manage ongoing compliance for deployed AI systems.
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pb-8">
        Created {new Date(useCase.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
