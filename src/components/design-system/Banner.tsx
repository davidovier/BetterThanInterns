import { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle2, XCircle, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BannerVariant = 'info' | 'warning' | 'success' | 'danger';

type BannerProps = {
  variant: BannerVariant;
  title?: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

const variantConfig: Record<BannerVariant, {
  icon: LucideIcon;
  className: string;
  iconClassName: string;
}> = {
  info: {
    icon: Info,
    className: 'bg-brand-50 border-brand-200',
    iconClassName: 'text-brand-600',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200',
    iconClassName: 'text-amber-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'bg-green-50 border-green-200',
    iconClassName: 'text-green-600',
  },
  danger: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200',
    iconClassName: 'text-red-600',
  },
};

export function Banner({
  variant,
  title,
  children,
  icon: CustomIcon,
  className,
}: BannerProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <Card className={cn('rounded-2xl border shadow-soft', config.className, className)}>
      <CardContent className="flex items-start space-x-3 py-4">
        <div className={cn('flex-shrink-0 mt-0.5', config.iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          {title && (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}
