import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { designTokens } from './tokens';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?: 'default' | 'primary' | 'success' | 'warning';
  };
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const badgeVariants = {
    default: designTokens.colors.muted,
    primary: designTokens.colors.accentSoft,
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={cn('space-y-4 pb-6 border-b border-border/40', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center shadow-soft">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <h1 className={designTokens.typography.pageTitle}>{title}</h1>
            {badge && (
              <Badge
                variant="outline"
                className={cn(
                  'border',
                  badgeVariants[badge.variant || 'default']
                )}
              >
                {badge.label}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
