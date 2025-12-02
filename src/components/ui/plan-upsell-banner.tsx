'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

type PlanUpsellBannerProps = {
  currentPlan: 'starter' | 'pro' | 'enterprise';
  from: string;
  message?: string;
};

export function PlanUpsellBanner({ currentPlan, from, message }: PlanUpsellBannerProps) {
  const router = useRouter();

  // Only show for starter plan
  if (currentPlan !== 'starter') {
    return null;
  }

  const defaultMessage = from === 'governance'
    ? 'Governance nerd? Pro plan was made for you.'
    : 'Serious about risk and compliance? Pro unlocks more governance depth.';

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-soft">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {message || defaultMessage}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40"
          onClick={() => router.push(`/pricing?from=${from}`)}
        >
          View plans
        </Button>
      </CardContent>
    </Card>
  );
}
