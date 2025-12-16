/**
 * PATCH /api/workspaces/[workspaceId]/usage-settings
 *
 * M25: Update PAYG (Pay-As-You-Go) settings for workspace
 * - Owner-only access
 * - Pro+ plans only for PAYG enablement
 * - Requires explicit cap when enabling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { enablePayg, disablePayg } from '@/lib/icuAccounting';
import { logError } from '@/lib/logging';

// EUR to ICU conversion: €0.04 per ICU (per billing.md PAYG markup)
const EUR_PER_ICU = 0.04;
const MIN_CAP_EUR = 10; // €10 minimum
const MAX_CAP_EUR = 500; // €500 maximum

type RouteParams = {
  params: {
    workspaceId: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { workspaceId } = params;

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(workspaceId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if user is owner (only owners can modify billing settings)
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (member?.role !== 'owner') {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Only workspace owners can modify billing settings.' } },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { paygEnabled, paygMonthlyCapEur } = body;

    // Validate paygEnabled is boolean
    if (typeof paygEnabled !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_REQUEST', message: 'paygEnabled must be a boolean.' } },
        { status: 400 }
      );
    }

    // Get workspace to check plan
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true, paygEnabled: true, paygMonthlyCap: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    // If enabling PAYG, validate plan and cap
    if (paygEnabled) {
      // PAYG only available on Pro+
      if (workspace.plan === 'starter') {
        return NextResponse.json(
          { ok: false, error: { code: 'PLAN_REQUIRED', message: 'Pay-as-you-go is available on Pro and Enterprise plans.' } },
          { status: 403 }
        );
      }

      // Cap is required when enabling
      if (typeof paygMonthlyCapEur !== 'number' || paygMonthlyCapEur <= 0) {
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_REQUEST', message: 'Monthly cap is required when enabling pay-as-you-go.' } },
          { status: 400 }
        );
      }

      // Validate cap bounds
      if (paygMonthlyCapEur < MIN_CAP_EUR) {
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_REQUEST', message: `Minimum monthly cap is €${MIN_CAP_EUR}.` } },
          { status: 400 }
        );
      }

      if (paygMonthlyCapEur > MAX_CAP_EUR) {
        return NextResponse.json(
          { ok: false, error: { code: 'INVALID_REQUEST', message: `Maximum monthly cap is €${MAX_CAP_EUR}.` } },
          { status: 400 }
        );
      }

      // Convert EUR to ICU
      const icuCap = Math.round(paygMonthlyCapEur / EUR_PER_ICU);

      // Enable PAYG with cap
      await enablePayg(workspaceId, icuCap);
    } else {
      // Disable PAYG
      await disablePayg(workspaceId);
    }

    // Fetch updated workspace data
    const updatedWorkspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        paygEnabled: true,
        paygMonthlyCap: true,
      },
    });

    // Convert ICU cap back to EUR for response
    const responseCapEur = updatedWorkspace?.paygMonthlyCap
      ? Math.round(updatedWorkspace.paygMonthlyCap * EUR_PER_ICU)
      : 0;

    return NextResponse.json({
      ok: true,
      data: {
        paygEnabled: updatedWorkspace?.paygEnabled || false,
        paygMonthlyCapEur: responseCapEur,
      },
    });
  } catch (error: any) {
    logError('Error updating usage settings', error, { workspaceId: params.workspaceId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update usage settings',
        },
      },
      { status: 500 }
    );
  }
}
