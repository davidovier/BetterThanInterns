/**
 * Application Configuration
 *
 * Centralized config for feature flags and environment-specific settings.
 */

export const IS_DEBUG =
  process.env.NEXT_PUBLIC_DEBUG === 'true' ||
  process.env.NODE_ENV === 'development';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
