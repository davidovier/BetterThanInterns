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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-full bg-muted/40 p-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
