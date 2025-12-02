import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ok, CommonErrors } from '@/lib/api-response';
import { logError } from '@/lib/logging';
import { z } from 'zod';
import { verifyWorkspaceAccess } from '@/lib/access-control';

/**
 * GET /api/workspaces/[workspaceId]/billing
 *
 * Get workspace billing information (plan, trial status)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const { workspaceId } = params;

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden();
    }

    // Get workspace billing info
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        plan: true,
        trialEndsAt: true,
        billingNotes: true,
      },
    });

    if (!workspace) {
      return CommonErrors.notFound('Workspace');
    }

    // Compute derived flags
    const now = new Date();
    const isOnTrial = workspace.trialEndsAt ? workspace.trialEndsAt > now : false;
    const isTrialExpired = workspace.trialEndsAt
      ? workspace.trialEndsAt <= now
      : false;

    return ok({
      billing: {
        plan: workspace.plan as 'starter' | 'pro' | 'enterprise',
        trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
        isOnTrial,
        isTrialExpired,
      },
    });
  } catch (err) {
    logError('Failed to fetch workspace billing', err);
    return CommonErrors.internalError();
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/billing
 *
 * Update workspace billing metadata (plan, trial)
 * For internal use - no Stripe integration yet
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return CommonErrors.unauthorized();
    }

    const { workspaceId } = params;

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(workspaceId, session.user.id);
    if (!hasAccess) {
      return CommonErrors.forbidden();
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      plan: z
        .enum(['starter', 'pro', 'enterprise'])
        .optional(),
      trialEndsAt: z
        .string()
        .datetime()
        .nullable()
        .optional()
        .transform((val) => (val ? new Date(val) : null)),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return CommonErrors.invalidInput(
        validation.error.errors.map((e) => e.message).join(', ')
      );
    }

    const { plan, trialEndsAt } = validation.data;

    // Update workspace
    const workspace = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(plan && { plan }),
        ...(trialEndsAt !== undefined && { trialEndsAt }),
      },
      select: {
        id: true,
        name: true,
        plan: true,
        trialEndsAt: true,
      },
    });

    // Compute derived flags
    const now = new Date();
    const isOnTrial = workspace.trialEndsAt ? workspace.trialEndsAt > now : false;
    const isTrialExpired = workspace.trialEndsAt
      ? workspace.trialEndsAt <= now
      : false;

    return ok({
      billing: {
        plan: workspace.plan as 'starter' | 'pro' | 'enterprise',
        trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
        isOnTrial,
        isTrialExpired,
      },
    });
  } catch (err) {
    logError('Failed to update workspace billing', err);
    return CommonErrors.internalError();
  }
}
