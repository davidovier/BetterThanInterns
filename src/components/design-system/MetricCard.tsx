import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  // M18: Directional trend (optional)
  direction?: 'up' | 'down' | 'neutral';
  directionLabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
};

/**
 * M18: Enhanced MetricCard with subtle directional hints
 * Direction > precision
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  direction,
  directionLabel,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantClasses = {
    default: 'border-border/50',
    primary: 'border-primary/30 bg-primary/[0.02]',
    success: 'border-emerald-200/60 bg-emerald-50/30',
    warning: 'border-amber-200/60 bg-amber-50/30',
  };

  // M18: Directional indicator
  const DirectionIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const directionColor = direction === 'up' ? 'text-emerald-600' : direction === 'down' ? 'text-slate-400' : 'text-slate-400';

  return (
    <Card className={cn('rounded-xl shadow-sm hover:shadow-md transition-all', variantClasses[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
              {label}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {/* M18: Directional hint */}
            {direction && directionLabel && (
              <div className="flex items-center gap-1.5 mt-1">
                <DirectionIcon className={cn("h-3 w-3", directionColor)} />
                <p className="text-xs text-slate-500">{directionLabel}</p>
              </div>
            )}
            {trend && !direction && (
              <p className="text-xs text-muted-foreground truncate">{trend}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-slate-100/60 p-2.5 shrink-0">
              <Icon className="h-4 w-4 text-slate-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
