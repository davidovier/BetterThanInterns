'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProcessCard } from '@/components/process/ProcessCard';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Process = {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  steps: Array<{
    id: string;
    title: string;
    owner?: string | null;
    positionX: number;
    positionY: number;
  }>;
  links: Array<{
    id: string;
    fromStepId: string;
    toStepId: string;
    label?: string | null;
  }>;
  updatedAt?: string;
};

type Opportunity = {
  id: string;
  stepId: string | null;
  impactLevel: 'low' | 'medium' | 'high';
  title: string;
  description: string;
};

export default function ProcessDetailPage({
  params,
}: {
  params: { processId: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [process, setProcess] = useState<Process | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadProcess();
      loadOpportunities();
    }
  }, [session, params.processId]);

  const loadProcess = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/processes/${params.processId}?includeGraph=true`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Process not found',
            description: 'This process may have been deleted',
            variant: 'destructive',
          });
          router.push('/library/processes');
          return;
        }
        throw new Error('Failed to load process');
      }

      const result = await response.json();
      const processData = result.ok && result.data
        ? result.data.process
        : result.process;

      setProcess(processData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load process',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOpportunities = async () => {
    try {
      const response = await fetch(`/api/processes/${params.processId}/opportunities`);
      if (!response.ok) return;

      const result = await response.json();
      const oppsData = result.ok && result.data
        ? result.data.opportunities
        : result.opportunities || [];

      setOpportunities(oppsData);
    } catch (error) {
      // Silently fail - opportunities are optional
      console.error('Failed to load opportunities:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Process not found</h2>
            <p className="text-muted-foreground mt-2">
              This process may have been deleted or you may not have access to it.
            </p>
            <Link href="/library/processes">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Process Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
        {/* Back Button */}
        <Link href="/library/processes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        {/* Process Card */}
        <ProcessCard process={process} opportunities={opportunities} />
      </div>
    </div>
  );
}
