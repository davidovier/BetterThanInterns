import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'muted' | 'highlight';
  className?: string;
};

export function PageSection({
  title,
  description,
  children,
  variant = 'default',
  className,
}: PageSectionProps) {
  const variantClasses = {
    default: '',
    muted: 'bg-muted/20 rounded-2xl p-6',
    highlight: 'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20',
  };

  return (
    <section className={cn('space-y-4', variantClasses[variant], className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
