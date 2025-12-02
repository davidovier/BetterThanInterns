'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type WorkspaceContextValue = {
  currentWorkspaceId: string | null;
  currentWorkspaceName: string | null;
  currentWorkspacePlan: 'starter' | 'pro' | 'enterprise';
  trialEndsAt: string | null;
  isOnTrial: boolean;
  isTrialExpired: boolean;
  loading: boolean;
  error: string | null;
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
  const [workspaceData, setWorkspaceData] = useState<WorkspaceContextValue>({
    currentWorkspaceId: null,
    currentWorkspaceName: null,
    currentWorkspacePlan: 'starter',
    trialEndsAt: null,
    isOnTrial: false,
    isTrialExpired: false,
    loading: true,
    error: null,
  });

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

          setWorkspaceData({
            currentWorkspaceId: workspace.id,
            currentWorkspaceName: workspace.name,
            currentWorkspacePlan: workspace.plan || 'starter',
            trialEndsAt,
            isOnTrial,
            isTrialExpired,
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
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    fetchWorkspace();
  }, []);

  return (
    <WorkspaceContext.Provider value={workspaceData}>
      {children}
    </WorkspaceContext.Provider>
  );
}
