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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, FolderOpen, Shield, AlertCircle, Sparkles, Save, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type AiUseCase = {
  id: string;
  workspaceId: string;
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

type AiPolicy = {
  id: string;
  key: string;
  name: string;
  category: 'privacy' | 'security' | 'ethics' | 'governance';
  description: string;
  isActive: boolean;
};

type PolicyMapping = {
  id: string;
  status: 'not_assessed' | 'not_applicable' | 'in_progress' | 'compliant' | 'non_compliant';
  notes: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  policy: AiPolicy;
};

type PolicySuggestion = {
  policyId: string;
  reason: string;
};

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

const POLICY_STATUS_COLORS: Record<string, string> = {
  not_assessed: 'bg-gray-100 text-gray-800',
  not_applicable: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-800',
  compliant: 'bg-green-100 text-green-800',
  non_compliant: 'bg-red-100 text-red-800',
};

const POLICY_CATEGORY_COLORS: Record<string, string> = {
  privacy: 'bg-purple-100 text-purple-800',
  security: 'bg-blue-100 text-blue-800',
  ethics: 'bg-green-100 text-green-800',
  governance: 'bg-orange-100 text-orange-800',
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

  // Policies & Controls state
  const [policies, setPolicies] = useState<AiPolicy[]>([]);
  const [mappings, setMappings] = useState<PolicyMapping[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<PolicySuggestion[]>([]);
  const [suggestedPolicyIds, setSuggestedPolicyIds] = useState<string[]>([]);

  // Policy creation dialog
  const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false);
  const [newPolicyKey, setNewPolicyKey] = useState('');
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState<'privacy' | 'security' | 'ethics' | 'governance'>('privacy');
  const [newPolicyDescription, setNewPolicyDescription] = useState('');
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);

  // Policy mapping edits
  const [editedMappings, setEditedMappings] = useState<Record<string, { status: string; notes: string }>>({});

  useEffect(() => {
    loadUseCase();
    loadRiskAssessment();
    loadPolicies();
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

  const loadPolicies = async () => {
    if (!useCase) return;

    setIsLoadingPolicies(true);
    try {
      // Load workspace policies
      const policiesResponse = await fetch(
        `/api/workspaces/${useCase.workspaceId}/policies`
      );
      if (policiesResponse.ok) {
        const policiesResult = await policiesResponse.json();
        const policiesData = policiesResult.ok && policiesResult.data ? policiesResult.data : policiesResult;
        setPolicies(policiesData.policies || []);
      }

      // Load policy mappings
      const mappingsResponse = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/policies`
      );
      if (mappingsResponse.ok) {
        const mappingsResult = await mappingsResponse.json();
        const mappingsData = mappingsResult.ok && mappingsResult.data ? mappingsResult.data : mappingsResult;
        setMappings(mappingsData.mappings || []);
      }
    } catch (error) {
      console.error('Failed to load policies', error);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  // Reload policies when useCase is loaded
  useEffect(() => {
    if (useCase) {
      loadPolicies();
    }
  }, [useCase?.id]);

  const createPolicy = async () => {
    if (!useCase) return;

    setIsCreatingPolicy(true);
    try {
      const response = await fetch(
        `/api/workspaces/${useCase.workspaceId}/policies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: newPolicyKey,
            name: newPolicyName,
            category: newPolicyCategory,
            description: newPolicyDescription,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create policy');
      }

      toast({
        title: 'Policy created',
        description: `${newPolicyName} has been added to your policy library.`,
      });

      // Reset form and close dialog
      setNewPolicyKey('');
      setNewPolicyName('');
      setNewPolicyCategory('privacy');
      setNewPolicyDescription('');
      setShowCreatePolicyDialog(false);

      // Reload policies
      await loadPolicies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create policy',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  const suggestPolicies = async () => {
    setIsSuggesting(true);
    try {
      const response = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/policies/suggest`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to get policy suggestions');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      setSuggestions(data.rationales || []);
      setSuggestedPolicyIds(data.suggestedPolicyIds || []);

      toast({
        title: 'AI suggestions ready',
        description: `Found ${data.suggestedPolicyIds?.length || 0} relevant policies. Review and select which ones to apply.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions. Try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const updateMappingEdit = (policyId: string, field: 'status' | 'notes', value: string) => {
    setEditedMappings((prev) => ({
      ...prev,
      [policyId]: {
        ...(prev[policyId] || { status: 'not_assessed', notes: '' }),
        [field]: value,
      },
    }));
  };

  const savePolicyMappings = async () => {
    setIsSavingPolicies(true);
    try {
      const mappingsToSave = Object.entries(editedMappings).map(([policyId, data]) => ({
        policyId,
        status: data.status as any,
        notes: data.notes || undefined,
      }));

      const response = await fetch(
        `/api/ai-use-cases/${params.aiUseCaseId}/policies`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mappings: mappingsToSave }),
        }
      );

      if (!response.ok) throw new Error('Failed to save policy mappings');

      const result = await response.json();
      const data = result.ok && result.data ? result.data : result;

      setMappings(data.mappings || []);
      setEditedMappings({});

      toast({
        title: 'Policy mappings saved',
        description: 'Your control status has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save policy mappings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPolicies(false);
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
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-6">
        <Link href="/governance">
          <Button variant="ghost" size="sm" className="hover:-translate-y-[1px] transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Governance
          </Button>
        </Link>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-gradient-to-br from-muted to-muted/40 p-3 shadow-soft">
            <Shield className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{useCase.title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-xs font-medium">
            {useCase.status}
          </Badge>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {useCase.source === 'blueprint' ? 'From Blueprint' : 'Manual'}
          </span>
          {useCase.owner && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Owner: {useCase.owner}</span>
            </>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid md:grid-cols-5 gap-8">
        {/* Left Column: Summary (2/5) */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{useCase.description}</p>
            </CardContent>
          </Card>

          {/* Project Link */}
          <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-base">{project.name}</p>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" size="sm" className="hover:-translate-y-[1px] transition-all">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Project
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Blueprint Link (if exists) */}
          {blueprint && (
            <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Blueprint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium text-base">{blueprint.title}</p>
                <p className="text-xs text-muted-foreground">
                  Version {blueprint.version} • {new Date(blueprint.createdAt).toLocaleDateString()}
                </p>
                <Link href={`/projects/${project.id}/blueprints/${blueprint.id}`}>
                  <Button variant="outline" size="sm" className="hover:-translate-y-[1px] transition-all">
                    <FileText className="h-4 w-4 mr-2" />
                    View Blueprint
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Linked Resources */}
          <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Linked Resources</CardTitle>
              <CardDescription className="text-xs">
                Associated processes, opportunities, and tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Processes</span>
                <span className="font-semibold">{useCase.metadata.processCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opportunities</span>
                <span className="font-semibold">{useCase.metadata.opportunityCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tools</span>
                <span className="font-semibold">{useCase.metadata.toolCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Risk & Policies (3/5) */}
        <div className="md:col-span-3 space-y-6">

          {/* Risk & Impact Assessment (G2) */}
          <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Risk & Impact Assessment</CardTitle>
              <CardDescription className="text-xs">
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
              <Button onClick={draftRiskAssessment} disabled={isDrafting} className="hover:-translate-y-[1px] transition-all">
                <Sparkles className="h-4 w-4 mr-2" />
                {isDrafting ? 'Drafting...' : 'Draft with AI'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  setSummaryText('Enter risk summary...');
                }}
                className="ml-2 hover:-translate-y-[1px] transition-all"
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

          {/* Policies & Controls (G3) */}
          <Card className="rounded-2xl border-border/60 bg-card shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Policies & Controls</CardTitle>
                  <CardDescription className="text-xs">
                    This is where your AI ideas meet your legal reality.
                  </CardDescription>
                </div>
            {policies.length > 0 && (
              <div className="flex items-center space-x-2">
                {mappings.length > 0 && (
                  <Button
                    onClick={suggestPolicies}
                    disabled={isSuggesting}
                    variant="outline"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isSuggesting ? 'Suggesting...' : 'Ask AI'}
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreatePolicyDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPolicies ? (
            <p className="text-sm text-muted-foreground">Loading policies...</p>
          ) : policies.length === 0 ? (
            /* State A: No policies in workspace */
            <div className="space-y-4 text-center py-8">
              <p className="text-sm text-muted-foreground">
                No policies yet. Add your first policy to start tracking compliance.
              </p>
              <Button onClick={() => setShowCreatePolicyDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Policy
              </Button>
            </div>
          ) : mappings.length === 0 ? (
            /* State B: Policies exist but no mappings yet */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <p className="text-sm text-muted-foreground">
                  {policies.length} {policies.length === 1 ? 'policy' : 'policies'} available. Map which ones apply to this use case.
                </p>
                <Button onClick={suggestPolicies} disabled={isSuggesting} size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isSuggesting ? 'Suggesting...' : 'Ask AI which are relevant'}
                </Button>
              </div>

              <div className="space-y-2">
                {policies.map((policy) => {
                  const isSuggested = suggestedPolicyIds.includes(policy.id);
                  const suggestion = suggestions.find((s) => s.policyId === policy.id);
                  const currentEdit = editedMappings[policy.id] || { status: 'not_assessed', notes: '' };

                  return (
                    <div
                      key={policy.id}
                      className={`p-3 border rounded-md ${isSuggested ? 'border-blue-300 bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm">{policy.name}</p>
                            <Badge className={POLICY_CATEGORY_COLORS[policy.category]}>
                              {policy.category}
                            </Badge>
                            {isSuggested && (
                              <Badge variant="outline" className="text-blue-700 border-blue-300">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Suggested by AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{policy.description}</p>
                          {suggestion && (
                            <p className="text-xs text-blue-700 italic mb-2">
                              AI rationale: {suggestion.reason}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <Label htmlFor={`status-${policy.id}`} className="text-xs">Status</Label>
                              <Select
                                value={currentEdit.status}
                                onValueChange={(v) => updateMappingEdit(policy.id, 'status', v)}
                              >
                                <SelectTrigger id={`status-${policy.id}`} className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_assessed">Not Assessed</SelectItem>
                                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="compliant">Compliant</SelectItem>
                                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`notes-${policy.id}`} className="text-xs">Notes</Label>
                              <Input
                                id={`notes-${policy.id}`}
                                value={currentEdit.notes}
                                onChange={(e) => updateMappingEdit(policy.id, 'notes', e.target.value)}
                                placeholder="Optional notes..."
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(editedMappings).length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={savePolicyMappings} disabled={isSavingPolicies}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingPolicies ? 'Saving...' : 'Save Mappings'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* State C: Existing mappings */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <p className="text-sm text-muted-foreground">
                  {mappings.length} {mappings.length === 1 ? 'policy' : 'policies'} mapped
                </p>
              </div>

              <div className="space-y-2">
                {mappings.map((mapping) => {
                  const currentEdit = editedMappings[mapping.policy.id] || {
                    status: mapping.status,
                    notes: mapping.notes || '',
                  };

                  return (
                    <div key={mapping.id} className="p-3 border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm">{mapping.policy.name}</p>
                            <Badge className={POLICY_CATEGORY_COLORS[mapping.policy.category]}>
                              {mapping.policy.category}
                            </Badge>
                            <Badge className={POLICY_STATUS_COLORS[currentEdit.status]}>
                              {currentEdit.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {mapping.policy.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`status-edit-${mapping.policy.id}`} className="text-xs">
                                Status
                              </Label>
                              <Select
                                value={currentEdit.status}
                                onValueChange={(v) => updateMappingEdit(mapping.policy.id, 'status', v)}
                              >
                                <SelectTrigger id={`status-edit-${mapping.policy.id}`} className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_assessed">Not Assessed</SelectItem>
                                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="compliant">Compliant</SelectItem>
                                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`notes-edit-${mapping.policy.id}`} className="text-xs">
                                Notes
                              </Label>
                              <Input
                                id={`notes-edit-${mapping.policy.id}`}
                                value={currentEdit.notes}
                                onChange={(e) => updateMappingEdit(mapping.policy.id, 'notes', e.target.value)}
                                placeholder="Optional notes..."
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          {mapping.lastUpdatedBy && mapping.lastUpdatedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Last updated by {mapping.lastUpdatedBy} on{' '}
                              {new Date(mapping.lastUpdatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Unmapped policies */}
                {policies.filter((p) => !mappings.some((m) => m.policy.id === p.id)).length > 0 && (
                  <>
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Available Policies (Not Yet Mapped)</p>
                      {policies
                        .filter((p) => !mappings.some((m) => m.policy.id === p.id))
                        .map((policy) => {
                          const currentEdit = editedMappings[policy.id] || { status: 'not_assessed', notes: '' };

                          return (
                            <div key={policy.id} className="p-3 border rounded-md mb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <p className="font-medium text-sm">{policy.name}</p>
                                    <Badge className={POLICY_CATEGORY_COLORS[policy.category]}>
                                      {policy.category}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{policy.description}</p>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor={`status-new-${policy.id}`} className="text-xs">Status</Label>
                                      <Select
                                        value={currentEdit.status}
                                        onValueChange={(v) => updateMappingEdit(policy.id, 'status', v)}
                                      >
                                        <SelectTrigger id={`status-new-${policy.id}`} className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="not_assessed">Not Assessed</SelectItem>
                                          <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="compliant">Compliant</SelectItem>
                                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`notes-new-${policy.id}`} className="text-xs">Notes</Label>
                                      <Input
                                        id={`notes-new-${policy.id}`}
                                        value={currentEdit.notes}
                                        onChange={(e) => updateMappingEdit(policy.id, 'notes', e.target.value)}
                                        placeholder="Optional notes..."
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>

              {Object.keys(editedMappings).length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={savePolicyMappings} disabled={isSavingPolicies}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingPolicies ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

        </div>
      </div>

      {/* Future: Monitoring & Reviews */}
      <Card className="rounded-2xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/20 to-muted/10 shadow-soft mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span>Monitoring & Reviews</span>
          </CardTitle>
          <CardDescription className="text-xs">Coming soon in Governance Milestone G3</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track performance, conduct reviews, and manage ongoing compliance for deployed AI systems.
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground pb-8 mt-8 uppercase tracking-wide">
        Created {new Date(useCase.createdAt).toLocaleDateString()}
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicyDialog} onOpenChange={setShowCreatePolicyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Policy</DialogTitle>
            <DialogDescription>
              Add a new policy to your workspace library. It will be available for all AI use cases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-policy-key">
                Key <span className="text-xs text-muted-foreground">(uppercase, numbers, underscores only)</span>
              </Label>
              <Input
                id="new-policy-key"
                value={newPolicyKey}
                onChange={(e) => setNewPolicyKey(e.target.value.toUpperCase())}
                placeholder="e.g., GDPR_DATA_MINIMIZATION"
              />
            </div>

            <div>
              <Label htmlFor="new-policy-name">Name</Label>
              <Input
                id="new-policy-name"
                value={newPolicyName}
                onChange={(e) => setNewPolicyName(e.target.value)}
                placeholder="e.g., GDPR – Data Minimization"
              />
            </div>

            <div>
              <Label htmlFor="new-policy-category">Category</Label>
              <Select
                value={newPolicyCategory}
                onValueChange={(v: any) => setNewPolicyCategory(v)}
              >
                <SelectTrigger id="new-policy-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privacy">Privacy</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="ethics">Ethics</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="new-policy-description">Description</Label>
              <Textarea
                id="new-policy-description"
                value={newPolicyDescription}
                onChange={(e) => setNewPolicyDescription(e.target.value)}
                rows={4}
                placeholder="Describe the policy requirements..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePolicyDialog(false);
                setNewPolicyKey('');
                setNewPolicyName('');
                setNewPolicyCategory('privacy');
                setNewPolicyDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createPolicy}
              disabled={
                isCreatingPolicy ||
                !newPolicyKey ||
                !newPolicyName ||
                !newPolicyDescription
              }
            >
              {isCreatingPolicy ? 'Creating...' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
