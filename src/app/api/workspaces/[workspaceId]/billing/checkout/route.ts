/**
 * POST /api/workspaces/[workspaceId]/billing/checkout
 *
 * Create a Stripe Checkout Session for upgrading workspace plan
 * Gracefully returns 503 if Stripe is not configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyWorkspaceAccess } from '@/lib/access-control';
import { isStripeEnabled, getStripeClient, getStripePriceId } from '@/lib/stripe';
import { logError } from '@/lib/logging';

type RouteParams = {
  params: {
    workspaceId: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { workspaceId } = params;

    // Verify workspace access (we'll check owner role separately)
    const hasAccess = await verifyWorkspaceAccess(workspaceId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if user is owner (only owners can create checkouts)
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
        { ok: false, error: { code: 'FORBIDDEN', message: 'Only workspace owners can manage billing' } },
        { status: 403 }
      );
    }

    // Check if Stripe is enabled
    if (!isStripeEnabled) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'STRIPE_NOT_CONFIGURED',
            message: 'Billing is not configured. Please contact support to upgrade your plan.',
          },
        },
        { status: 503 }
      );
    }

    // Get request body
    const body = await request.json();
    const { plan } = body;

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { ok: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan. Must be "pro" or "enterprise"' } },
        { status: 400 }
      );
    }

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();

    // Create or get Stripe customer
    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        },
      });
      customerId = customer.id;

      // Update workspace with customer ID
      await db.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID for plan
    const priceId = getStripePriceId(plan as 'pro' | 'enterprise');

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/account?tab=billing&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/account?tab=billing&canceled=true`,
      metadata: {
        workspaceId: workspace.id,
        plan,
      },
      currency: 'eur', // Europe-focused
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
    });
  } catch (error: any) {
    logError('Error creating checkout session', error, { workspaceId: params.workspaceId });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create checkout session',
        },
      },
      { status: 500 }
    );
  }
}
