'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Tool = {
  toolId: string;
  name: string;
  vendor: string | null;
  category: string;
  description: string;
  pricingTier: string;
  integrationComplexity: string;
  websiteUrl: string | null;
  matchScore: number;
  rationale: string;
  userSelected: boolean;
};

type ToolRecommendationsDialogProps = {
  opportunityId: string;
  opportunityTitle: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ToolRecommendationsDialog({
  opportunityId,
  opportunityTitle,
  isOpen,
  onClose,
}: ToolRecommendationsDialogProps) {
  const { toast } = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen, opportunityId]);

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/tools`);
      if (!response.ok) throw new Error('Failed to load tools');

      const data = await response.json();
      setTools(data.tools || []);

      // Set initially selected tools
      const selected = new Set<string>();
      data.tools?.forEach((tool: Tool) => {
        if (tool.userSelected) {
          selected.add(tool.toolId);
        }
      });
      setSelectedToolIds(selected);
    } catch (error) {
      toast({
        title: 'Error loading tools',
        description: 'Could not load tool recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleToolSelection = async (toolId: string) => {
    const isCurrentlySelected = selectedToolIds.has(toolId);
    const newSelected = !isCurrentlySelected;

    // Optimistic update
    const newSelectedIds = new Set(selectedToolIds);
    if (newSelected) {
      newSelectedIds.add(toolId);
    } else {
      newSelectedIds.delete(toolId);
    }
    setSelectedToolIds(newSelectedIds);

    try {
      const response = await fetch(
        `/api/opportunities/${opportunityId}/tools/${toolId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userSelected: newSelected }),
        }
      );

      if (!response.ok) throw new Error('Failed to update selection');

      toast({
        title: newSelected ? 'Tool added to blueprint' : 'Tool removed',
        description: newSelected
          ? 'This tool will be included in the automation blueprint'
          : 'This tool was removed from the blueprint',
      });
    } catch (error) {
      // Revert optimistic update
      setSelectedToolIds(selectedToolIds);
      toast({
        title: 'Error',
        description: 'Failed to update tool selection',
        variant: 'destructive',
      });
    }
  };

  const getPricingBadgeVariant = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free':
        return 'default';
      case 'freemium':
        return 'secondary';
      case 'paid':
        return 'outline';
      case 'enterprise':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-amber-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tools that won't waste your time</DialogTitle>
          <DialogDescription>
            Picked based on how your process actually works: {opportunityTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium mb-2">
                We don't have great tools to suggest for this one yet.
              </p>
              <p className="text-sm">
                Either it's very niche, or we need to drink more coffee.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tools.map((tool) => {
                const isSelected = selectedToolIds.has(tool.toolId);
                return (
                  <div
                    key={tool.toolId}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{tool.name}</h3>
                          {tool.vendor && (
                            <span className="text-sm text-muted-foreground">
                              by {tool.vendor}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={getPricingBadgeVariant(tool.pricingTier)}>
                            {tool.pricingTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Category: {tool.category}
                          </span>
                          <span
                            className={`text-xs font-medium ${getComplexityColor(
                              tool.integrationComplexity
                            )}`}
                          >
                            {tool.integrationComplexity} complexity
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Match: {Math.round(tool.matchScore * 100)}%
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => toggleToolSelection(tool.toolId)}
                        className="shrink-0"
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Included
                          </>
                        ) : (
                          'Include in blueprint'
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {tool.description}
                    </p>

                    <div className="bg-muted/50 rounded p-3 mb-3">
                      <p className="text-sm font-medium mb-1">Why this tool?</p>
                      <p className="text-sm text-muted-foreground">{tool.rationale}</p>
                    </div>

                    {tool.websiteUrl && (
                      <a
                        href={tool.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Learn more
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
