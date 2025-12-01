import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  emptyState?: ReactNode;
  isEmpty?: boolean;
};

export function SectionCard({
  title,
  description,
  children,
  action,
  emptyState,
  isEmpty = false,
}: SectionCardProps) {
  return (
    <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty && emptyState ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyState}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
