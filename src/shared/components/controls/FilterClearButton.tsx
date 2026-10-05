import React from 'react';
import { X } from 'lucide-react';

interface FilterClearButtonProps {
  /** Domain-specific accessible name, e.g. "Clear drug filter". */
  label: string;
  onClear: () => void;
  /** Absolute-positioning offsets and any caller-specific styling. */
  className?: string;
  /** Icon size class; defaults to w-3.5 h-3.5. */
  iconClassName?: string;
}

/**
 * Accessible clear action for filter inputs (plan 003 / F4). One component
 * solves the 44px hit area, the accessible name, and the focus ring once
 * for the dashboard and every testing surface.
 */
const FilterClearButton: React.FC<FilterClearButtonProps> = ({
  label,
  onClear,
  className = 'absolute right-1 xl:right-2 top-1/2 -translate-y-1/2',
  iconClassName = 'w-3.5 h-3.5',
}) => (
  <button
    type="button"
    onClick={onClear}
    aria-label={label}
    className={`${className} text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 flex items-center justify-center`}
  >
    <X className={iconClassName} />
  </button>
);

export default FilterClearButton;
