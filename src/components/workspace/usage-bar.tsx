'use client';

import { useWorkspaceContext } from './workspace-context';
import { cn } from '@/lib/utils';

/**
 * M24.1 - UsageBar Component
 *
 * Minimal, executive-focused display of ICU usage.
 * Shows percentage only (no numbers) with color-coded indicator.
 */
export function UsageBar() {
  const { usage, loading } = useWorkspaceContext();

  if (loading || !usage) {
    return null;
  }

  const percentage = usage.basePercentage;
  const isWarning = percentage >= 75 && percentage < 90;
  const isDanger = percentage >= 90;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Intelligence Usage</span>
        <span
          className={cn(
            'font-semibold',
            isDanger && 'text-red-600',
            isWarning && 'text-amber-600',
            !isWarning && !isDanger && 'text-muted-foreground'
          )}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            isDanger && 'bg-red-500',
            isWarning && 'bg-amber-500',
            !isWarning && !isDanger && 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
