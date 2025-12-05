'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Shield, AlertTriangle, FileCheck } from 'lucide-react';
import Link from 'next/link';

type AiUseCase = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner?: string | null;
  linkedProcessIds?: any;
  linkedOpportunityIds?: any;
  riskAssessment?: {
    id: string;
    riskLevel: string;
    impactAreas: string[];
    dataSensitivity?: string | null;
    summaryText: string;
    risksJson?: any;
    assumptionsJson?: any;
    residualRiskText?: string | null;
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

type GovernanceModalProps = {
  aiUseCase: AiUseCase;
  isOpen: boolean;
  onClose: () => void;
};

export function GovernanceModal({ aiUseCase, isOpen, onClose }: GovernanceModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const riskLevel = aiUseCase.riskAssessment?.riskLevel || 'medium';
  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const processCount = Array.isArray(aiUseCase.linkedProcessIds) ? aiUseCase.linkedProcessIds.length : 0;
  const opportunityCount = Array.isArray(aiUseCase.linkedOpportunityIds) ? aiUseCase.linkedOpportunityIds.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-600" />
            {aiUseCase.title}
          </DialogTitle>
          <DialogDescription>{aiUseCase.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`${riskColors[riskLevel as keyof typeof riskColors]}`}>
                  Risk: {riskLevel}
                </Badge>
                <Badge variant="secondary">{aiUseCase.status.replace('_', ' ')}</Badge>
                {processCount > 0 && <Badge variant="outline">{processCount} processes</Badge>}
                {opportunityCount > 0 && <Badge variant="outline">{opportunityCount} opportunities</Badge>}
              </div>

              {aiUseCase.owner && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Owner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{aiUseCase.owner}</p>
                  </CardContent>
                </Card>
              )}

              {aiUseCase.riskAssessment && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Risk Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {aiUseCase.riskAssessment.summaryText}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="risk" className="space-y-4 mt-0">
              {aiUseCase.riskAssessment ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Risk Level: {riskLevel.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Impact Areas:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiUseCase.riskAssessment.impactAreas.map((area: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {aiUseCase.riskAssessment.dataSensitivity && (
                        <div>
                          <p className="text-sm font-medium">Data Sensitivity:</p>
                          <p className="text-sm text-muted-foreground">
                            {aiUseCase.riskAssessment.dataSensitivity}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">Summary:</p>
                        <p className="text-sm text-muted-foreground">
                          {aiUseCase.riskAssessment.summaryText}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No risk assessment available yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="policies" className="space-y-4 mt-0">
              {aiUseCase.policyMappings && aiUseCase.policyMappings.length > 0 ? (
                <div className="space-y-3">
                  {aiUseCase.policyMappings.map((mapping) => (
                    <Card key={mapping.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileCheck className="h-4 w-4 text-brand-600" />
                              {mapping.aiPolicy.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {mapping.aiPolicy.category}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={mapping.status === 'compliant' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {mapping.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {mapping.aiPolicy.description}
                        </p>
                        {mapping.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            Notes: {mapping.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No policies mapped yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Link href={`/ai-use-cases/${aiUseCase.id}`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Full Page
            </Button>
          </Link>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
