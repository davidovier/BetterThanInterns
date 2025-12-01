import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
};

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="border-b bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {breadcrumb && <div className="mb-4">{breadcrumb}</div>}

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-[32px] font-semibold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
