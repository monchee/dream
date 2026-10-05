import React from 'react';

interface CompactActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; required so icon-only actions are never unnamed. */
  label: string;
  /** Overrides the tooltip when the visible label differs from the accessible name. */
  tooltip?: string;
  /** Visual size class at desktop density; defaults to nothing (natural). */
  className?: string;
}

/**
 * Compact icon/text action with a guaranteed 44px mobile hit area and
 * visible focus (plan 003 / F4). The visible content stays
 * caller-provided so clinical wording is never rewritten.
 */
const CompactActionButton = React.forwardRef<HTMLButtonElement, CompactActionButtonProps>(
  ({ label, tooltip, className, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={tooltip ?? label}
      className={`min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 inline-flex items-center justify-center text-muted-foreground/60 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  )
);
CompactActionButton.displayName = 'CompactActionButton';

export default CompactActionButton;
