/**
 * M24 - ICU (Intelligence Cost Unit) Accounting
 *
 * Billing model based on billing.md:
 * - 1 ICU = €0.01 real OpenAI cost
 * - Base plans: 3.3× markup, PAYG: 4.0× markup
 * - Monthly reset on calendar boundary (UTC)
 * - Explicit PAYG opt-in with monthly cap
 */

import { db as prisma } from '@/lib/db';

// ============================================
// ICU Cost Mapping (Static estimates per action)
// ============================================

export const ICU_COSTS = {
  // Light actions
  LIGHT_CLARIFICATION: 20, // Average 10-30

  // Process mapping
  PROCESS_EXTRACTION: 60, // Average 40-80

  // Analysis actions
  OPPORTUNITY_SCAN: 115, // Average 80-150
  TOOL_MATCHING: 60, // Average 40-80

  // Heavy actions
  BLUEPRINT_GENERATION: 160, // Average 120-200
  GOVERNANCE_REASONING: 90, // Average 60-120
} as const;

// ============================================
// Plan Limits (from billing.md)
// ============================================

const PLAN_LIMITS = {
  starter: 900,
  pro: 3500,
  enterprise: 10000, // Placeholder, enterprise gets custom
} as const;

// ============================================
// Billing Error Types
// ============================================

export class BillingLimitError extends Error {
  constructor(
    public readonly code: 'BILLING_LIMIT_REACHED' | 'PAYG_CAP_REACHED',
    public readonly message: string,
    public readonly workspaceId: string,
    public readonly suggestedActions: string[]
  ) {
    super(message);
    this.name = 'BillingLimitError';
  }
}

// ============================================
// Monthly Reset Logic
// ============================================

/**
 * Check if workspace needs monthly ICU reset (calendar month boundary, UTC)
 * Returns true if current month is different from icuResetAt month
 */
export function needsMonthlyReset(icuResetAt: Date): boolean {
  const now = new Date();
  const resetDate = new Date(icuResetAt);

  // Compare UTC year and month
  return (
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth()
  );
}

/**
 * Reset workspace ICU counters for new month
 */
export async function resetMonthlyIcu(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      monthlyIcuUsed: 0,
      paygIcuUsed: 0,
      icuResetAt: new Date(),
    },
  });
}

// ============================================
// Usage Check & Enforcement
// ============================================

export type UsageCheckResult = {
  allowed: boolean;
  source: 'base' | 'payg' | null;
  remaining: number;
  error?: BillingLimitError;
};

/**
 * Check if workspace can consume the specified ICUs
 * DOES NOT deduct - this is a pre-check before AI call
 */
export async function checkIcuAvailability(
  workspaceId: string,
  icuCost: number
): Promise<UsageCheckResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      monthlyIcuLimit: true,
      monthlyIcuUsed: true,
      icuResetAt: true,
      paygEnabled: true,
      paygMonthlyCap: true,
      paygIcuUsed: true,
    },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  // Check if monthly reset needed
  if (needsMonthlyReset(workspace.icuResetAt)) {
    await resetMonthlyIcu(workspaceId);
    // Re-fetch after reset
    const refreshed = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: {
        monthlyIcuLimit: true,
        monthlyIcuUsed: true,
        paygEnabled: true,
        paygMonthlyCap: true,
        paygIcuUsed: true,
      },
    });
    workspace.monthlyIcuUsed = refreshed.monthlyIcuUsed;
    workspace.paygIcuUsed = refreshed.paygIcuUsed;
  }

  // Check base ICU allowance
  const baseRemaining = workspace.monthlyIcuLimit - workspace.monthlyIcuUsed;

  if (baseRemaining >= icuCost) {
    return {
      allowed: true,
      source: 'base',
      remaining: baseRemaining,
    };
  }

  // Base exhausted - check if PAYG is enabled
  if (!workspace.paygEnabled) {
    const error = new BillingLimitError(
      'BILLING_LIMIT_REACHED',
      'Monthly intelligence usage limit reached.',
      workspaceId,
      ['Wait for monthly reset', 'Enable Pay-As-You-Go', 'Upgrade plan']
    );

    return {
      allowed: false,
      source: null,
      remaining: 0,
      error,
    };
  }

  // PAYG enabled - check cap
  const paygRemaining = workspace.paygMonthlyCap - workspace.paygIcuUsed;

  if (paygRemaining >= icuCost) {
    return {
      allowed: true,
      source: 'payg',
      remaining: paygRemaining,
    };
  }

  // PAYG cap reached
  const error = new BillingLimitError(
    'PAYG_CAP_REACHED',
    'Pay-as-you-go monthly cap reached.',
    workspaceId,
    ['Wait for monthly reset', 'Increase PAYG cap', 'Upgrade plan']
  );

  return {
    allowed: false,
    source: null,
    remaining: 0,
    error,
  };
}

// ============================================
// ICU Deduction (after successful AI call)
// ============================================

/**
 * Deduct ICUs after successful AI call
 * Uses base ICUs first, then PAYG if enabled
 */
export async function deductIcus(
  workspaceId: string,
  icuCost: number
): Promise<void> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: {
      monthlyIcuLimit: true,
      monthlyIcuUsed: true,
      paygEnabled: true,
      paygMonthlyCap: true,
      paygIcuUsed: true,
    },
  });

  const baseRemaining = workspace.monthlyIcuLimit - workspace.monthlyIcuUsed;

  if (baseRemaining >= icuCost) {
    // Deduct from base allowance
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        monthlyIcuUsed: { increment: icuCost },
      },
    });
  } else {
    // Deduct remaining from base, rest from PAYG
    const baseDeduction = Math.max(0, baseRemaining);
    const paygDeduction = icuCost - baseDeduction;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        monthlyIcuUsed: { increment: baseDeduction },
        paygIcuUsed: { increment: paygDeduction },
      },
    });
  }
}

// ============================================
// Workspace Usage Summary
// ============================================

export type WorkspaceUsage = {
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

/**
 * Get comprehensive usage summary for workspace
 * Used for frontend display and admin monitoring
 */
export async function getWorkspaceUsage(
  workspaceId: string
): Promise<WorkspaceUsage> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: {
      plan: true,
      monthlyIcuLimit: true,
      monthlyIcuUsed: true,
      icuResetAt: true,
      paygEnabled: true,
      paygMonthlyCap: true,
      paygIcuUsed: true,
    },
  });

  // Check if reset needed
  if (needsMonthlyReset(workspace.icuResetAt)) {
    await resetMonthlyIcu(workspaceId);
    workspace.monthlyIcuUsed = 0;
    workspace.paygIcuUsed = 0;
    workspace.icuResetAt = new Date();
  }

  const baseRemaining = workspace.monthlyIcuLimit - workspace.monthlyIcuUsed;
  const basePercentage = Math.min(
    100,
    (workspace.monthlyIcuUsed / workspace.monthlyIcuLimit) * 100
  );

  const paygRemaining = workspace.paygMonthlyCap - workspace.paygIcuUsed;
  const paygPercentage = workspace.paygEnabled
    ? Math.min(100, (workspace.paygIcuUsed / workspace.paygMonthlyCap) * 100)
    : 0;

  // Calculate days until next reset (first day of next month)
  const now = new Date();
  const nextReset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  const daysUntilReset = Math.ceil(
    (nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    plan: workspace.plan,
    baseLimit: workspace.monthlyIcuLimit,
    baseUsed: workspace.monthlyIcuUsed,
    baseRemaining,
    basePercentage,
    paygEnabled: workspace.paygEnabled,
    paygCap: workspace.paygMonthlyCap,
    paygUsed: workspace.paygIcuUsed,
    paygRemaining,
    paygPercentage,
    totalUsed: workspace.monthlyIcuUsed + workspace.paygIcuUsed,
    resetAt: workspace.icuResetAt,
    daysUntilReset,
  };
}

// ============================================
// Plan Configuration Helpers
// ============================================

/**
 * Update workspace plan and reset ICU limit
 */
export async function updateWorkspacePlan(
  workspaceId: string,
  newPlan: 'starter' | 'pro' | 'enterprise',
  customLimit?: number
): Promise<void> {
  const newLimit = customLimit ?? PLAN_LIMITS[newPlan];

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: newPlan,
      monthlyIcuLimit: newLimit,
    },
  });
}

/**
 * Enable PAYG for workspace (Pro+ only)
 * Requires explicit cap setting for legal compliance
 */
export async function enablePayg(
  workspaceId: string,
  monthlyCap: number
): Promise<void> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true },
  });

  // PAYG only available on Pro+
  if (workspace.plan === 'starter') {
    throw new Error('Pay-as-you-go is only available on Pro and Enterprise plans');
  }

  // Monthly cap required for legal compliance
  if (monthlyCap <= 0) {
    throw new Error('Pay-as-you-go requires a monthly cap');
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      paygEnabled: true,
      paygMonthlyCap: monthlyCap,
    },
  });
}

/**
 * Disable PAYG for workspace
 */
export async function disablePayg(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      paygEnabled: false,
    },
  });
}
