import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  direction?: 'up' | 'down' | 'neutral';
  directionLabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
};

/**
 * MetricCard with refined styling and directional hints.
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
  const variantStyles = {
    default: {
      card: 'border-border/60',
      icon: 'bg-muted/50 text-muted-foreground',
    },
    primary: {
      card: 'border-brand-200/60 bg-brand-50/20',
      icon: 'bg-brand-100 text-brand-600',
    },
    success: {
      card: 'border-emerald-200/60 bg-emerald-50/20',
      icon: 'bg-emerald-100 text-emerald-600',
    },
    warning: {
      card: 'border-amber-200/60 bg-amber-50/20',
      icon: 'bg-amber-100 text-amber-600',
    },
  };

  const styles = variantStyles[variant];

  // Directional indicator
  const DirectionIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const directionColor = direction === 'up' ? 'text-emerald-600' : direction === 'down' ? 'text-muted-foreground' : 'text-muted-foreground';

  return (
    <Card className={cn('shadow-soft hover:shadow-medium transition-all duration-200', styles.card, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {/* Directional hint */}
            {direction && directionLabel && (
              <div className="flex items-center gap-1.5 mt-2">
                <DirectionIcon className={cn("h-3.5 w-3.5", directionColor)} />
                <p className="text-xs text-muted-foreground">{directionLabel}</p>
              </div>
            )}
            {trend && !direction && (
              <p className="text-xs text-muted-foreground truncate mt-1">{trend}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("rounded-xl p-3 shrink-0", styles.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
