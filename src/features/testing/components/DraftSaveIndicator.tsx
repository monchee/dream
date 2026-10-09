import { cn, formatTime } from '@shared/utils';

interface DraftSaveIndicatorProps {
  isSaving?: boolean;
  isDirty?: boolean;
  hasChanges?: boolean;
  lastSavedAt?: number | null;
  showNoDraft?: boolean;
  /** A failed local write takes precedence over every other state. */
  saveFailed?: boolean;
  className?: string;
}

export function DraftSaveIndicator({
  isSaving = false,
  isDirty = false,
  hasChanges = false,
  lastSavedAt = null,
  showNoDraft = false,
  saveFailed = false,
  className,
}: DraftSaveIndicatorProps) {
  const dirty = isDirty || hasChanges;
  const status = saveFailed
    ? 'Unable to save locally — keep this window open'
    : isSaving
      ? 'Saving…'
      : lastSavedAt
        ? `Draft saved · ${formatTime(lastSavedAt)}`
        : dirty
          ? 'Unsaved changes'
          : showNoDraft
            ? 'No draft'
            : '';

  if (!status) return null;

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'text-xs font-medium tabular-nums transition-colors',
        saveFailed && 'text-status-warning font-semibold',
        isSaving && 'text-muted-foreground animate-pulse',
        !saveFailed && !isSaving && !lastSavedAt && dirty && 'text-status-warning font-semibold',
        !saveFailed && !isSaving && (lastSavedAt || !dirty) && 'text-muted-foreground',
        className,
      )}
    >
      {status}
    </span>
  );
}
