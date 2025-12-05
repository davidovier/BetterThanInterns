'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { BlueprintModal } from './BlueprintModal';
import ReactMarkdown from 'react-markdown';

type Blueprint = {
  id: string;
  title: string;
  renderedMarkdown: string;
  contentJson: any;
  metadataJson?: any;
  createdAt: string;
  updatedAt: string;
};

type BlueprintPreviewProps = {
  blueprint: Blueprint;
  onRegenerate?: () => void;
};

export function BlueprintPreview({ blueprint, onRegenerate }: BlueprintPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract first 3 sections for preview
  const lines = blueprint.renderedMarkdown.split('\n');
  const summaryLines = lines.slice(0, 10).join('\n');

  // Count key metrics
  const opportunityCount = blueprint.metadataJson?.opportunityCount || 0;
  const processCount = blueprint.metadataJson?.processCount || 0;

  return (
    <>
      <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <CardTitle className="text-lg">{blueprint.title}</CardTitle>
              <CardDescription>
                AI Transformation Blueprint
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {processCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {processCount} {processCount === 1 ? 'process' : 'processes'}
              </Badge>
            )}
            {opportunityCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {opportunityCount} {opportunityCount === 1 ? 'opportunity' : 'opportunities'}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Generated {new Date(blueprint.createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>
              {summaryLines}
            </ReactMarkdown>
            <p className="text-sm text-muted-foreground">...</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Full Blueprint
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                title="Regenerate blueprint"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <BlueprintModal
        blueprint={blueprint}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
