import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:brightness-105 active:brightness-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:brightness-105 active:brightness-95 focus-visible:ring-destructive/30',
        outline:
          'border border-border bg-card/60 backdrop-blur-sm text-foreground shadow-xs hover:bg-accent/50 hover:text-accent-foreground hover:border-border/80',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-muted/80 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto font-medium',
        success:
          'bg-success text-success-foreground shadow-xs hover:brightness-105 active:brightness-95 focus-visible:ring-success/30',
        soft:
          'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/25 border border-primary/20',
        'soft-success':
          'bg-success/10 text-success hover:bg-success/20 active:bg-success/25 border border-success/20',
        'soft-accent':
          'bg-accent text-accent-foreground hover:bg-accent/80 active:bg-accent border border-accent/30',
        'soft-destructive':
          'bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/25 border border-destructive/20',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3 min-h-[40px]',
        sm: 'h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5',
        lg: 'h-12 rounded-xl px-6 text-base has-[>svg]:px-4 font-semibold',
        icon: 'size-10 min-w-[40px] min-h-[40px] rounded-xl',
        'icon-sm': 'size-8 min-w-[32px] min-h-[32px] rounded-lg',
        'icon-lg': 'size-12 min-w-[48px] min-h-[48px] rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
