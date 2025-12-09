import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantClasses = {
    default: 'border-border/60',
    primary: 'border-primary/40 bg-primary/5',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
  };

  return (
    <Card className={cn('rounded-2xl shadow-soft hover:shadow-medium transition-all', variantClasses[variant], className)}>
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium truncate">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground truncate">{trend}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-full bg-muted/40 p-2 sm:p-2.5 lg:p-3 shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
