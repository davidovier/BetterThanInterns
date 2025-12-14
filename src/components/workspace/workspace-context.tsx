'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type WorkspaceUsage = {
  plan: string;
  baseLimit: number;
  baseUsed: number;
  baseRemaining: number;
  basePercentage: number;
  paygEnabled: boolean;
  paygCap: number;
  paygUsed: number;
  paygRemaining: number;
  paygPercentage: number;
  totalUsed: number;
  resetAt: Date;
  daysUntilReset: number;
};

type WorkspaceContextValue = {
  currentWorkspaceId: string | null;
  currentWorkspaceName: string | null;
  currentWorkspacePlan: 'starter' | 'pro' | 'enterprise';
  trialEndsAt: string | null;
  isOnTrial: boolean;
  isTrialExpired: boolean;
  usage: WorkspaceUsage | null; // M24.1: Billing usage
  loading: boolean;
  error: string | null;
  refetchUsage: () => Promise<void>; // M24.1: Manual refetch
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceContextProvider');
  }
  return context;
}

type WorkspaceContextProviderProps = {
  children: ReactNode;
};

export function WorkspaceContextProvider({ children }: WorkspaceContextProviderProps) {
  const [workspaceData, setWorkspaceData] = useState<Omit<WorkspaceContextValue, 'refetchUsage'>>({
    currentWorkspaceId: null,
    currentWorkspaceName: null,
    currentWorkspacePlan: 'starter',
    trialEndsAt: null,
    isOnTrial: false,
    isTrialExpired: false,
    usage: null, // M24.1
    loading: true,
    error: null,
  });

  // M24.1: Fetch usage data
  const fetchUsage = async (workspaceId: string): Promise<WorkspaceUsage | null> => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/usage`);
      if (!res.ok) {
        console.error('Failed to fetch usage');
        return null;
      }

      const data = await res.json();
      if (data.ok && data.data) {
        return data.data as WorkspaceUsage;
      }
      return null;
    } catch (err) {
      console.error('Error fetching usage:', err);
      return null;
    }
  };

  // M24.1: Manual refetch function
  const refetchUsage = async () => {
    if (workspaceData.currentWorkspaceId) {
      const usage = await fetchUsage(workspaceData.currentWorkspaceId);
      setWorkspaceData((prev) => ({ ...prev, usage }));
    }
  };

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch('/api/workspaces');
        if (!res.ok) {
          throw new Error('Failed to fetch workspace');
        }

        const data = await res.json();
        const workspaces = data.ok && data.data
          ? data.data.workspaces
          : data.workspaces;

        if (workspaces && workspaces.length > 0) {
          const workspace = workspaces[0];
          const trialEndsAt = workspace.trialEndsAt || null;
          const now = new Date();
          const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null;
          const isOnTrial = !!trialEndDate && trialEndDate > now;
          const isTrialExpired = !!trialEndDate && trialEndDate <= now;

          // M24.1: Fetch usage data
          const usage = await fetchUsage(workspace.id);

          setWorkspaceData({
            currentWorkspaceId: workspace.id,
            currentWorkspaceName: workspace.name,
            currentWorkspacePlan: workspace.plan || 'starter',
            trialEndsAt,
            isOnTrial,
            isTrialExpired,
            usage, // M24.1
            loading: false,
            error: null,
          });
        } else {
          setWorkspaceData({
            currentWorkspaceId: null,
            currentWorkspaceName: null,
            currentWorkspacePlan: 'starter',
            trialEndsAt: null,
            isOnTrial: false,
            isTrialExpired: false,
            usage: null, // M24.1
            loading: false,
            error: 'No workspace found',
          });
        }
      } catch (err) {
        setWorkspaceData({
          currentWorkspaceId: null,
          currentWorkspaceName: null,
          currentWorkspacePlan: 'starter',
          trialEndsAt: null,
          isOnTrial: false,
          isTrialExpired: false,
          usage: null, // M24.1
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    fetchWorkspace();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ ...workspaceData, refetchUsage }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
