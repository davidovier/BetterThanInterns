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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, FolderOpen, Shield, AlertCircle, Sparkles, Save } from 'lucide-react';
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

type RiskItem = {
  title: string;
  description: string;
  mitigation: string;
};

type AiRiskAssessment = {
  id: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impactAreas: string[];
  dataSensitivity: string | null;
  regulatoryRelevance: string[];
  summaryText: string;
  risksJson: RiskItem[];
  assumptionsJson: string[];
  residualRiskText: string | null;
  draftedByAi: boolean;
  lastDraftedAt: string | null;
  lastReviewedAt: string | null;
  lastReviewedBy: string | null;
} | null;

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  pilot: 'bg-yellow-100 text-yellow-800',
  production: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
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

  // Risk assessment state
  const [riskAssessment, setRiskAssessment] = useState<AiRiskAssessment>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Risk form fields
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [impactAreas, setImpactAreas] = useState<string>('');
  const [dataSensitivity, setDataSensitivity] = useState<string>('');
  const [regulatoryRelevance, setRegulatoryRelevance] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  const [risksJson, setRisksJson] = useState<string>('');
  const [assumptionsJson, setAssumptionsJson] = useState<string>('');
  const [residualRiskText, setResidualRiskText] = useState<string>('');

  useEffect(() => {
    loadUseCase();
    loadRiskAssessment();
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

  const loadRiskAssessment = async () => {
    setIsLoadingRisk(true);
    try {
      const response = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/risk-assessment`
      );
      if (!response.ok) throw new Error('Failed to load risk assessment');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      if (data.riskAssessment) {
        setRiskAssessment(data.riskAssessment);
        populateForm(data.riskAssessment);
      }
    } catch (error) {
      // Silent fail - risk assessment may not exist yet
      console.log('No risk assessment found');
    } finally {
      setIsLoadingRisk(false);
    }
  };

  const populateForm = (assessment: any) => {
    setRiskLevel(assessment.riskLevel);
    setImpactAreas(assessment.impactAreas.join(', '));
    setDataSensitivity(assessment.dataSensitivity || '');
    setRegulatoryRelevance(assessment.regulatoryRelevance.join(', '));
    setSummaryText(assessment.summaryText);
    setRisksJson(JSON.stringify(assessment.risksJson, null, 2));
    setAssumptionsJson(assessment.assumptionsJson.join('\n'));
    setResidualRiskText(assessment.residualRiskText || '');
  };

  const draftRiskAssessment = async () => {
    setIsDrafting(true);
    try {
      const response = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/risk-assessment/draft`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to draft risk assessment');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      setRiskAssessment(data.riskAssessment);
      populateForm(data.riskAssessment);
      setIsEditing(true);

      toast({
        title: 'Risk assessment drafted',
        description: 'Review and edit the AI-generated assessment before saving.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to draft risk assessment. Try again or fill manually.',
        variant: 'destructive',
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const saveRiskAssessment = async () => {
    setIsSaving(true);
    try {
      // Parse and validate form data
      let risks: RiskItem[] = [];
      try {
        risks = JSON.parse(risksJson || '[]');
      } catch {
        throw new Error('Invalid risks JSON format');
      }

      const assumptions = assumptionsJson
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const body = {
        riskLevel,
        impactAreas: impactAreas
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
        dataSensitivity: dataSensitivity || null,
        regulatoryRelevance: regulatoryRelevance
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
        summaryText,
        risks,
        assumptions,
        residualRiskText: residualRiskText || null,
      };

      const response = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/risk-assessment`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error('Failed to save risk assessment');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      setRiskAssessment(data.riskAssessment);
      setIsEditing(false);

      toast({
        title: 'Risk assessment saved',
        description: 'Your review has been recorded.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save risk assessment',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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

      {/* Risk & Impact Assessment (G2) */}
      <Card>
        <CardHeader>
          <CardTitle>Risk & Impact Assessment</CardTitle>
          <CardDescription>
            {!riskAssessment
              ? 'Governance isn\'t sexy, but fines are even less sexy.'
              : 'Conservative assessment reviewed by humans.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRisk ? (
            <p className="text-sm text-muted-foreground">Loading risk assessment...</p>
          ) : !riskAssessment && !isEditing ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No risk assessment yet. Use the AI helper to draft one, then tweak it so your lawyer sleeps at night.
              </p>
              <Button onClick={draftRiskAssessment} disabled={isDrafting}>
                <Sparkles className="h-4 w-4 mr-2" />
                {isDrafting ? 'Drafting...' : 'Draft with AI'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  setSummaryText('Enter risk summary...');
                }}
                className="ml-2"
              >
                Fill Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {!isEditing && riskAssessment ? (
                <>
                  {/* View Mode */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label>Risk Level</Label>
                      <Badge className={RISK_LEVEL_COLORS[riskAssessment.riskLevel] || ''}>
                        {riskAssessment.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <Label>Impact Areas</Label>
                      <p className="text-sm">{riskAssessment.impactAreas.join(', ')}</p>
                    </div>
                    {riskAssessment.dataSensitivity && (
                      <div>
                        <Label>Data Sensitivity</Label>
                        <p className="text-sm">{riskAssessment.dataSensitivity}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Summary</Label>
                    <p className="text-sm whitespace-pre-wrap mt-1">{riskAssessment.summaryText}</p>
                  </div>

                  {riskAssessment.risksJson.length > 0 && (
                    <div>
                      <Label>Identified Risks</Label>
                      <div className="space-y-3 mt-2">
                        {riskAssessment.risksJson.map((risk, idx) => (
                          <div key={idx} className="border-l-2 border-orange-500 pl-3">
                            <p className="font-medium text-sm">{risk.title}</p>
                            <p className="text-sm text-muted-foreground">{risk.description}</p>
                            <p className="text-sm text-green-700 mt-1">
                              <span className="font-medium">Mitigation:</span> {risk.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {riskAssessment.assumptionsJson.length > 0 && (
                    <div>
                      <Label>Assumptions</Label>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {riskAssessment.assumptionsJson.map((assumption, idx) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {riskAssessment.residualRiskText && (
                    <div>
                      <Label>Residual Risk</Label>
                      <p className="text-sm whitespace-pre-wrap mt-1">
                        {riskAssessment.residualRiskText}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      {riskAssessment.draftedByAi && riskAssessment.lastDraftedAt && (
                        <p>
                          Drafted by AI on{' '}
                          {new Date(riskAssessment.lastDraftedAt).toLocaleDateString()}
                        </p>
                      )}
                      {riskAssessment.lastReviewedBy && riskAssessment.lastReviewedAt && (
                        <p>
                          Last reviewed by {riskAssessment.lastReviewedBy} on{' '}
                          {new Date(riskAssessment.lastReviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={draftRiskAssessment}
                        disabled={isDrafting}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isDrafting ? 'Re-drafting...' : 'Re-draft with AI'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="riskLevel">Risk Level</Label>
                      <Select value={riskLevel} onValueChange={(v: any) => setRiskLevel(v)}>
                        <SelectTrigger id="riskLevel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dataSensitivity">Data Sensitivity</Label>
                      <Select
                        value={dataSensitivity}
                        onValueChange={(v) => setDataSensitivity(v)}
                      >
                        <SelectTrigger id="dataSensitivity">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="impactAreas">Impact Areas (comma-separated)</Label>
                    <Input
                      id="impactAreas"
                      value={impactAreas}
                      onChange={(e) => setImpactAreas(e.target.value)}
                      placeholder="e.g., customers, employees, compliance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="regulatoryRelevance">
                      Regulatory Relevance (comma-separated)
                    </Label>
                    <Input
                      id="regulatoryRelevance"
                      value={regulatoryRelevance}
                      onChange={(e) => setRegulatoryRelevance(e.target.value)}
                      placeholder="e.g., GDPR, HIPAA, SOC2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="summaryText">Summary</Label>
                    <Textarea
                      id="summaryText"
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      rows={4}
                      placeholder="Plain-language summary of the risk profile..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="risksJson">
                      Risks (JSON: [{`{title, description, mitigation}`}])
                    </Label>
                    <Textarea
                      id="risksJson"
                      value={risksJson}
                      onChange={(e) => setRisksJson(e.target.value)}
                      rows={8}
                      placeholder='[{"title": "...", "description": "...", "mitigation": "..."}]'
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="assumptionsJson">Assumptions (one per line)</Label>
                    <Textarea
                      id="assumptionsJson"
                      value={assumptionsJson}
                      onChange={(e) => setAssumptionsJson(e.target.value)}
                      rows={4}
                      placeholder="Assumption 1&#10;Assumption 2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="residualRiskText">Residual Risk</Label>
                    <Textarea
                      id="residualRiskText"
                      value={residualRiskText}
                      onChange={(e) => setResidualRiskText(e.target.value)}
                      rows={3}
                      placeholder="Remaining risk after mitigations..."
                    />
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <Button onClick={saveRiskAssessment} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (riskAssessment) {
                          populateForm(riskAssessment);
                          setIsEditing(false);
                        } else {
                          setIsEditing(false);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
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
