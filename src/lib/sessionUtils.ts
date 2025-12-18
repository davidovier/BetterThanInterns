// M18: Session state derivation utilities (frontend-only, no DB changes)
// M20: First-run detection utilities

export type SessionState = 'active' | 'in-progress' | 'decided' | 'archived';

export interface SessionWithState {
  id: string;
  title: string;
  contextSummary: string;
  workspaceId: string;
  metadata: any;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  // Derived state (frontend only)
  state?: SessionState;
}

/**
 * Derive session state from existing data
 * No backend changes required - pure heuristic
 */
export function deriveSessionState(session: SessionWithState): SessionState {
  const now = new Date();
  const updatedAt = new Date(session.updatedAt);
  const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

  const metadata = session.metadata || {};
  const hasProcesses = (metadata.processIds?.length || 0) > 0;
  const hasOpportunities = (metadata.opportunityIds?.length || 0) > 0;
  const hasBlueprints = (metadata.blueprintIds?.length || 0) > 0;
  const hasGovernance = (metadata.aiUseCaseIds?.length || 0) > 0;

  // Archived: Not updated in 30+ days
  if (hoursSinceUpdate > 30 * 24) {
    return 'archived';
  }

  // Decided: Has governance or blueprints (final artifacts)
  if (hasGovernance || hasBlueprints) {
    return 'decided';
  }

  // Active: Updated in last 48 hours
  if (hoursSinceUpdate < 48) {
    return 'active';
  }

  // In Progress: Has artifacts but not decided
  if (hasProcesses || hasOpportunities) {
    return 'in-progress';
  }

  // Default to in-progress for sessions with no artifacts yet
  return 'in-progress';
}

/**
 * Get state label for display
 */
export function getStateLabel(state: SessionState): string {
  const labels: Record<SessionState, string> = {
    active: 'ACTIVE',
    'in-progress': 'IN PROGRESS',
    decided: 'DECIDED',
    archived: 'ARCHIVED',
  };
  return labels[state];
}

/**
 * Get state color classes (subtle, executive-appropriate)
 */
export function getStateStyles(state: SessionState): {
  borderColor: string;
  textColor: string;
  bgColor: string;
} {
  const styles: Record<SessionState, { borderColor: string; textColor: string; bgColor: string }> = {
    active: {
      borderColor: 'border-l-brand-500',
      textColor: 'text-brand-700',
      bgColor: 'bg-brand-50',
    },
    'in-progress': {
      borderColor: 'border-l-amber-400',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    decided: {
      borderColor: 'border-l-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    archived: {
      borderColor: 'border-l-slate-300',
      textColor: 'text-slate-500',
      bgColor: 'bg-slate-50',
    },
  };
  return styles[state];
}

/**
 * M20: Detect if this is a first-run session
 * A session is "first-run" if:
 * - No messages
 * - No artifacts (processes, opportunities, blueprints, aiUseCases)
 * - No contextSummary
 */
export function isFirstRunSession(
  hasMessages: boolean,
  hasArtifacts: boolean,
  contextSummary?: string
): boolean {
  return !hasMessages && !hasArtifacts && !contextSummary;
}
