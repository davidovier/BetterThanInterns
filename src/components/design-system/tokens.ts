/**
 * Design System Tokens for Better Than Interns
 *
 * This file documents the semantic design tokens and consistent usage patterns
 * across the application. All tokens map to Tailwind utility classes.
 */

export const designTokens = {
  /**
   * TYPOGRAPHY SCALE
   * Use these semantic names instead of raw Tailwind classes for consistency
   */
  typography: {
    display: 'text-4xl lg:text-5xl font-bold tracking-tight',
    pageTitle: 'text-2xl lg:text-3xl font-bold tracking-tight',
    sectionTitle: 'text-xl font-semibold',
    cardTitle: 'text-base font-semibold',
    body: 'text-sm',
    bodyLarge: 'text-base',
    meta: 'text-xs',
    metaUpper: 'text-xs uppercase tracking-wide font-medium',
  },

  /**
   * COLOR USAGE (SEMANTIC)
   * Map business intent to Tailwind color utilities
   */
  colors: {
    // Surfaces
    surface: 'bg-background',
    elevated: 'bg-card',
    muted: 'bg-muted',

    // Borders
    borderSubtle: 'border-border/40',
    borderDefault: 'border-border',
    borderStrong: 'border-border/60',

    // Text
    textPrimary: 'text-foreground',
    textSecondary: 'text-muted-foreground',
    textMuted: 'text-muted-foreground/60',

    // Brand/Accent
    accentPrimary: 'bg-brand-500 text-white',
    accentSoft: 'bg-primary/5 border-primary/20',

    // States
    dangerSoft: 'bg-red-50 border-red-200 text-red-900',
    warningSoft: 'bg-amber-50 border-amber-200 text-amber-900',
    successSoft: 'bg-green-50 border-green-200 text-green-900',
    infoSoft: 'bg-brand-50 border-brand-200 text-brand-900',

    // Plan badges
    planStarter: 'bg-muted/60 text-muted-foreground border-border',
    planPro: 'bg-primary/10 text-primary border-primary/20',
    planEnterprise: 'bg-amber-100/80 text-amber-800 border-amber-200',
  },

  /**
   * SHADOWS
   * Elevation system for visual hierarchy
   */
  shadows: {
    soft: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-lg',

    // Interactive states
    hoverLift: 'hover:shadow-md hover:-translate-y-[1px] transition-all',
  },

  /**
   * SPACING & LAYOUT
   */
  spacing: {
    pageX: 'px-8',
    pageY: 'py-8',
    sectionGap: 'space-y-8',
    cardPadding: 'p-6',
    cardPaddingCompact: 'p-4',
  },

  /**
   * BORDER RADIUS
   */
  radius: {
    card: 'rounded-2xl',
    button: 'rounded-xl',
    input: 'rounded-xl',
    badge: 'rounded-full',
    small: 'rounded-lg',
  },

  /**
   * TRANSITIONS
   */
  transitions: {
    default: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    colors: 'transition-colors duration-200',
  },
} as const;

/**
 * USAGE EXAMPLES:
 *
 * // Page header
 * <h1 className={designTokens.typography.pageTitle}>My Page</h1>
 *
 * // Card
 * <div className={`${designTokens.radius.card} ${designTokens.shadows.soft} ${designTokens.spacing.cardPadding}`}>
 *   Content
 * </div>
 *
 * // Primary button with hover
 * <button className={`${designTokens.colors.accentPrimary} ${designTokens.radius.button} ${designTokens.shadows.hoverLift}`}>
 *   Click me
 * </button>
 */
