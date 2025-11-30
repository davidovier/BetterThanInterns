'use client';

import { IS_DEBUG } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

type DebugPanelProps = {
  title?: string;
  data: any | null;
};

export function DebugPanel({
  title = 'Debug – Last API Response',
  data,
}: DebugPanelProps) {
  const [copied, setCopied] = useState(false);

  // Only render in debug mode AND when data exists
  if (!IS_DEBUG || !data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy debug JSON', err);
    }
  };

  return (
    <Card className="mt-4 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono text-yellow-800 dark:text-yellow-200">
            🔧 {title}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 gap-2 text-xs"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy JSON
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
