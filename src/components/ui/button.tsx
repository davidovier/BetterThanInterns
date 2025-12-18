import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-[1px] hover:shadow-soft',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-[1px]',
        outline:
          'border border-input bg-background hover:bg-secondary hover:text-secondary-foreground hover:-translate-y-[1px] hover:shadow-soft',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-[1px]',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Brand variants - Forest green for brand presence
        brand: 'bg-brand-600 text-white hover:bg-brand-700 hover:-translate-y-[1px] hover:shadow-medium shadow-soft',
        'brand-outline': 'border-2 border-brand-600 text-brand-700 hover:bg-brand-50 hover:-translate-y-[1px] hover:shadow-soft',
        'brand-ghost': 'text-brand-700 hover:bg-brand-50 hover:text-brand-800',
        // CTA variant - Amber for primary calls-to-action (high visibility)
        cta: 'bg-amber-500 text-white hover:bg-amber-600 hover:-translate-y-[1px] hover:shadow-medium shadow-soft font-semibold',
        'cta-outline': 'border-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:-translate-y-[1px] hover:shadow-soft',
        // Subtle variant for secondary actions
        subtle: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:-translate-y-[1px]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
        xl: 'h-12 px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
