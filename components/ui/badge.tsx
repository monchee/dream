import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        info: "border-transparent bg-status-info/15 text-status-info shadow-sm hover:bg-status-info/25 dark:bg-status-info/20 dark:text-status-info",
        warning: "border-transparent bg-status-warning/15 text-status-warning shadow-sm hover:bg-status-warning/25 dark:bg-status-warning/20 dark:text-status-warning",
        success: "border-transparent bg-status-success text-status-success-foreground shadow hover:bg-status-success/90 dark:bg-status-success",
        danger: "border-transparent bg-status-danger text-status-danger-foreground shadow hover:bg-status-danger/90 dark:bg-status-danger",
        grade4: "border-transparent bg-status-grade4 text-status-grade4-foreground hover:bg-status-grade4/90",
        grade3: "border-transparent bg-status-grade3 text-status-grade3-foreground hover:bg-status-grade3/90",
        grade2: "border-transparent bg-status-grade2 text-status-grade2-foreground font-semibold hover:bg-status-grade2/90",
        grade1: "border-transparent bg-status-grade1 text-status-grade1-foreground hover:bg-status-grade1/90",
        ungraded: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
