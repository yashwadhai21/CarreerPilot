import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs [a&]:hover:brightness-105',
        secondary:
          'border-border/60 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        destructive:
          'border-destructive/30 bg-destructive/15 text-destructive [a&]:hover:bg-destructive/25',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        success:
          'border-success/30 bg-success/15 text-success [a&]:hover:bg-success/25',
        warning:
          'border-warning/35 bg-warning/15 text-warning-foreground [a&]:hover:bg-warning/25',
        accent:
          'border-accent/40 bg-accent text-accent-foreground [a&]:hover:bg-accent/80',
        info:
          'border-info/30 bg-info/15 text-info [a&]:hover:bg-info/25',
        soft:
          'border-border/60 bg-muted/80 text-foreground [a&]:hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
