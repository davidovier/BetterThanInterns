'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';
import { GovernanceModal } from './GovernanceModal';

type AiUseCase = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner?: string | null;
  riskAssessment?: {
    id: string;
    riskLevel: string;
    impactAreas: string[];
    dataSensitivity?: string | null;
    summaryText: string;
  } | null;
  policyMappings?: Array<{
    id: string;
    status: string;
    notes?: string | null;
    aiPolicy: {
      id: string;
      name: string;
      category: string;
      description: string;
    };
  }>;
};

type GovernanceCardProps = {
  aiUseCase: AiUseCase;
};

export function GovernanceCard({ aiUseCase }: GovernanceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const riskLevel = aiUseCase.riskAssessment?.riskLevel || 'medium';
  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const policiesApplied = aiUseCase.policyMappings?.slice(0, 3) || [];
  const totalPolicies = aiUseCase.policyMappings?.length || 0;

  return (
    <>
      <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {aiUseCase.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {aiUseCase.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant="outline"
              className={`text-xs ${riskColors[riskLevel as keyof typeof riskColors] || riskColors.medium}`}
            >
              Risk: {riskLevel}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {aiUseCase.status.replace('_', ' ')}
            </Badge>
            {totalPolicies > 0 && (
              <Badge variant="outline" className="text-xs">
                {totalPolicies} {totalPolicies === 1 ? 'policy' : 'policies'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {policiesApplied.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Applied Policies:</p>
              <div className="flex flex-wrap gap-2">
                {policiesApplied.map((mapping) => (
                  <Badge key={mapping.id} variant="outline" className="text-xs">
                    {mapping.aiPolicy.name}
                  </Badge>
                ))}
                {totalPolicies > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{totalPolicies - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Governance Panel
          </Button>
        </CardContent>
      </Card>

      <GovernanceModal
        aiUseCase={aiUseCase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
