'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

type Blueprint = {
  id: string;
  projectId?: string;
  title: string;
  renderedMarkdown: string;
  contentJson: any;
  metadataJson?: any;
  createdAt: string;
  updatedAt: string;
};

type BlueprintModalProps = {
  blueprint: Blueprint;
  isOpen: boolean;
  onClose: () => void;
};

export function BlueprintModal({ blueprint, isOpen, onClose }: BlueprintModalProps) {
  const handleDownload = () => {
    const blob = new Blob([blueprint.renderedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{blueprint.title}</DialogTitle>
          <DialogDescription>
            AI Transformation Blueprint — Generated{' '}
            {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold mt-6 mb-3 text-brand-700" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                code: ({ node, ...props }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                ),
              }}
            >
              {blueprint.renderedMarkdown}
            </ReactMarkdown>
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Markdown
            </Button>
            {blueprint.projectId && (
              <Link href={`/projects/${blueprint.projectId}/blueprints/${blueprint.id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Full Page
                </Button>
              </Link>
            )}
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
