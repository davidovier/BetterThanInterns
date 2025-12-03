/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events
 * Required events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { isStripeEnabled, getStripeClient, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { logError } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    // Return 503 if Stripe is not configured
    if (!isStripeEnabled) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const stripe = getStripeClient();
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      logError('Webhook signature verification failed', err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logError('Error handling webhook', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Update workspace with subscription details and upgrade plan
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const workspaceId = session.metadata?.workspaceId;
    const plan = session.metadata?.plan;

    if (!workspaceId || !plan) {
      console.warn('Missing metadata in checkout session', session.id);
      return;
    }

    const subscriptionId = session.subscription as string;

    // Update workspace with subscription and upgrade plan
    await db.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: plan, // Upgrade to pro or enterprise
        trialEndsAt: null, // Clear trial if any
      },
    });

    console.log(`Workspace ${workspaceId} upgraded to ${plan} via subscription ${subscriptionId}`);
  } catch (error) {
    logError('Error handling checkout.session.completed', error, {
      sessionId: session.id,
      workspaceId: session.metadata?.workspaceId,
    });
  }
}

/**
 * Handle customer.subscription.updated
 * Sync subscription status with workspace
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const workspace = await db.workspace.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!workspace) {
      console.warn('Workspace not found for subscription', subscription.id);
      return;
    }

    // Check subscription status
    if (subscription.status === 'active') {
      // Subscription is active, ensure plan is set correctly
      // Get plan from subscription metadata or price ID
      const plan = subscription.metadata?.plan || workspace.plan;

      await db.workspace.update({
        where: { id: workspace.id },
        data: { plan },
      });

      console.log(`Subscription ${subscription.id} updated: active`);
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      // Subscription has issues, downgrade to starter
      await db.workspace.update({
        where: { id: workspace.id },
        data: {
          plan: 'starter',
          billingNotes: `Subscription ${subscription.status} at ${new Date().toISOString()}`,
        },
      });

      console.log(`Subscription ${subscription.id} updated: ${subscription.status}, downgraded to starter`);
    }
  } catch (error) {
    logError('Error handling customer.subscription.updated', error, {
      subscriptionId: subscription.id,
    });
  }
}

/**
 * Handle customer.subscription.deleted
 * Downgrade workspace to starter plan
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const workspace = await db.workspace.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!workspace) {
      console.warn('Workspace not found for subscription', subscription.id);
      return;
    }

    // Downgrade to starter and clear subscription ID
    await db.workspace.update({
      where: { id: workspace.id },
      data: {
        plan: 'starter',
        stripeSubscriptionId: null,
        billingNotes: `Subscription canceled at ${new Date().toISOString()}`,
      },
    });

    console.log(`Subscription ${subscription.id} deleted, workspace ${workspace.id} downgraded to starter`);
  } catch (error) {
    logError('Error handling customer.subscription.deleted', error, {
      subscriptionId: subscription.id,
    });
  }
}
