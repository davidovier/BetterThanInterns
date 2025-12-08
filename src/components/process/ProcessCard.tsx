'use client';

import { useState } from 'react';
import { ProcessMiniMap } from './ProcessMiniMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Process = {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  steps: Array<{
    id: string;
    title: string;
    owner?: string | null;
    positionX: number;
    positionY: number;
  }>;
  links: Array<{
    id: string;
    fromStepId: string;
    toStepId: string;
    label?: string | null;
  }>;
  updatedAt?: string;
};

type ProcessCardProps = {
  process: Process;
  opportunities?: Array<{ stepId: string | null; impactLevel: 'low' | 'medium' | 'high' }>;
};

export function ProcessCard({ process, opportunities = [] }: ProcessCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stepCount = process.steps?.length || 0;
  const lastUpdated = process.updatedAt
    ? new Date(process.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined;

  return (
    <>
      <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-lg">{process.name}</CardTitle>
            {process.description && (
              <CardDescription className="line-clamp-2">
                {process.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              {stepCount} {stepCount === 1 ? 'step' : 'steps'}
            </Badge>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lastUpdated}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepCount >= 2 ? (
            <ProcessMiniMap
              steps={process.steps}
              links={process.links}
              height={250}
              readOnly={true}
              opportunities={opportunities.filter((opp) => opp.stepId)}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Add more steps to see the process map
              </p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            Open Full Editor
          </Button>
        </CardContent>
      </Card>

      {/* Full Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{process.name}</DialogTitle>
            {process.description && (
              <DialogDescription>{process.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {stepCount >= 2 ? (
              <ProcessMiniMap
                steps={process.steps}
                links={process.links}
                height={600}
                readOnly={false}
                opportunities={opportunities.filter((opp) => opp.stepId)}
              />
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  This process needs at least 2 steps to display a workflow map
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
