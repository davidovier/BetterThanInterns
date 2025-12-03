/**
 * Stripe Integration Helper
 *
 * This module provides Stripe SDK integration with graceful degradation.
 * If STRIPE_SECRET_KEY is not configured, the app runs normally without billing features.
 */

import Stripe from 'stripe';

/**
 * Check if Stripe is enabled based on environment variable presence
 */
export const isStripeEnabled = !!process.env.STRIPE_SECRET_KEY;

/**
 * Get configured Stripe client instance
 * @throws Error if Stripe is not enabled
 */
export function getStripeClient(): Stripe {
  if (!isStripeEnabled) {
    throw new Error(
      'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.'
    );
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  });
}

/**
 * Stripe Price IDs for each plan
 * These should match your Stripe dashboard configuration
 */
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER || '',
  pro: process.env.STRIPE_PRICE_ID_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
} as const;

/**
 * Get the Stripe price ID for a given plan
 */
export function getStripePriceId(plan: 'starter' | 'pro' | 'enterprise'): string {
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${plan}`);
  }
  return priceId;
}

/**
 * Stripe webhook secret for verifying webhook signatures
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
