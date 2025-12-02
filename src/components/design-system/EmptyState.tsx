import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const content = (
    <>
      <div className={cn(
        'w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center mx-auto shadow-soft',
        variant === 'compact' && 'w-16 h-16'
      )}>
        <Icon className={cn('text-muted-foreground/40', variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10')} />
      </div>
      <div className="space-y-2 text-center">
        <p className={cn('font-semibold', variant === 'compact' ? 'text-base' : 'text-lg')}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
        >
          {action.label}
        </Button>
      )}
    </>
  );

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 space-y-4', className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={cn('rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-br from-card via-muted/20 to-muted/40 shadow-medium', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
        {content}
      </CardContent>
    </Card>
  );
}
