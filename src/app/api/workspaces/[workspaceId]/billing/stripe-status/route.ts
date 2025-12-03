/**
 * GET /api/workspaces/[workspaceId]/billing/stripe-status
 *
 * Get Stripe billing status for a workspace
 * Returns subscription details if Stripe is configured and workspace has a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { isStripeEnabled, getStripeClient } from '@/lib/stripe';
import { logError } from '@/lib/logging';

type RouteParams = {
  params: {
    workspaceId: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { workspaceId } = params;

    // Verify workspace access (any member can view billing status)
    const hasAccess = await verifyWorkspaceAccess(workspaceId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    // If Stripe is not enabled, return basic info
    if (!isStripeEnabled) {
      return NextResponse.json({
        ok: true,
        data: {
          stripeEnabled: false,
          plan: workspace.plan,
          hasActiveSubscription: false,
          trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
        },
      });
    }

    // If no subscription, return basic info
    if (!workspace.stripeSubscriptionId) {
      return NextResponse.json({
        ok: true,
        data: {
          stripeEnabled: true,
          plan: workspace.plan,
          hasActiveSubscription: false,
          trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
        },
      });
    }

    // Fetch subscription details from Stripe
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId) as any;

    return NextResponse.json({
      ok: true,
      data: {
        stripeEnabled: true,
        plan: workspace.plan,
        hasActiveSubscription: subscription.status === 'active',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date((subscription.canceled_at as number) * 1000).toISOString()
            : null,
        },
        trialEndsAt: workspace.trialEndsAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    logError('Error fetching billing status', error, { workspaceId: params.workspaceId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch billing status',
        },
      },
      { status: 500 }
    );
  }
}
