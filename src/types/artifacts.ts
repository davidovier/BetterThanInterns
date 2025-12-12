/**
 * Artifact type definitions for M15.2 Unified Session Workspace
 */

export type ProcessArtifact = {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  steps: ProcessStepArtifact[];
  links: ProcessLinkArtifact[];
  _count: {
    steps: number;
    opportunities: number;
  };
};

export type ProcessStepArtifact = {
  id: string;
  processId: string;
  title: string;
  description: string | null;
  owner: string | null;
  inputs: any; // JSON
  outputs: any; // JSON
  frequency: string | null;
  duration: string | null;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
};

export type ProcessLinkArtifact = {
  id: string;
  processId: string;
  fromStepId: string;
  toStepId: string;
  label: string | null;
  linkType: string;
  createdAt: string;
};

export type OpportunityArtifact = {
  id: string;
  processId: string;
  stepId: string | null;
  title: string;
  description: string;
  opportunityType: string;
  impactLevel: 'low' | 'medium' | 'high';
  effortLevel: 'low' | 'medium' | 'high';
  impactScore: number;
  feasibilityScore: number;
  rationaleText: string;
  createdAt: string;
  updatedAt: string;
  process: {
    id: string;
    name: string;
  } | null;
  step: {
    id: string;
    title: string;
  } | null;
};

export type BlueprintArtifact = {
  id: string;
  title: string;
  summary?: string | null; // M16B
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type AiUseCaseArtifact = {
  id: string;
  title: string;
  description: string;
  riskSummary?: string | null; // M16B
  status: 'idea' | 'planned' | 'approved' | 'shipped' | 'pilot' | 'production' | 'paused'; // M16B: added 'idea', 'approved', 'shipped'
  owner: string | null;
  linkedProcessIds: any; // JSON
  linkedOpportunityIds: any; // JSON
};

export type SessionArtifacts = {
  processes: ProcessArtifact[];
  opportunities: OpportunityArtifact[];
  blueprints: BlueprintArtifact[];
  aiUseCases: AiUseCaseArtifact[];
};
