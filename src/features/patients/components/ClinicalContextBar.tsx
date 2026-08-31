import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useRedact } from '@features/reports/hooks/useRedact';
import { cn, formatDate } from '@shared/utils';
import { ClinicalWorkContext, ClinicalWorkSource } from '@shared/types/clinicalWorkContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';

export interface ClinicalContextBarProps {
  context?: ClinicalWorkContext | null;
  firstName?: string;
  lastName?: string;
  mrn?: string;
  dob?: string;
  reactionDate?: string;
  visitDate?: string;
  source?: ClinicalWorkSource;
  className?: string;
  'aria-label'?: string;
  ariaLabel?: string;
}

export function ClinicalContextBar({
  context,
  firstName: propFirstName,
  lastName: propLastName,
  mrn: propMrn,
  dob: propDob,
  reactionDate: propReactionDate,
  visitDate: propVisitDate,
  source: propSource,
  className,
  'aria-label': ariaLabelProp,
  ariaLabel,
}: ClinicalContextBarProps) {
  const { redact } = useRedact();

  const firstName = propFirstName ?? context?.firstName ?? '';
  const lastName = propLastName ?? context?.lastName ?? '';
  const mrn = propMrn ?? context?.mrn ?? '';
  const dob = propDob ?? context?.dob;
  const reactionDate = propReactionDate ?? context?.reactionDate;
  const visitDate = propVisitDate ?? context?.testingVisitDate;
  const source = propSource ?? context?.source;

  const hasName = Boolean(firstName || lastName);
  const formattedName = hasName
    ? `${redact(lastName.toUpperCase())}, ${redact(firstName)}`
    : 'NO IDENTITY ENTERED';

  const accessibleLabel = ariaLabelProp || ariaLabel || 'Current patient and encounter';

  return (
    <aside
      aria-label={accessibleLabel}
      className={cn(
        'w-full border border-border border-l-[6px] border-l-primary bg-card/95 shadow-sm backdrop-blur-sm print:hidden',
        className,
      )}
    >
      {/* Mobile compact patient strip (<768px, md:hidden): ~36px height */}
      <div className="md:hidden px-3 sm:px-4 py-1 min-h-[36px] flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 text-xs font-medium text-foreground overflow-hidden">
          <span className="font-semibold truncate">{formattedName}</span>
          <span aria-hidden="true" className="text-muted-foreground shrink-0">·</span>
          <span className="shrink-0">
            REDCap ID <span className="font-mono font-semibold">{mrn ? redact(mrn) : '—'}</span>
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="View patient details"
              className={cn(
                'inline-flex items-center justify-center gap-1 px-2.5 py-1 min-h-[44px] min-w-[44px] text-xs font-semibold rounded-none shrink-0',
                'border border-border bg-background hover:bg-muted text-foreground transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
              )}
            >
              <span>Details</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-72 sm:w-80 rounded-none border border-border bg-card p-3 shadow-lg text-card-foreground"
          >
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-foreground border-b border-border pb-1.5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Patient Details</span>
                {source === 'direct' && (
                  <span className="border border-status-info/40 bg-status-info/10 text-status-info text-xs px-1.5 py-0.5 rounded-none font-semibold uppercase tracking-wider">
                    Direct Entry
                  </span>
                )}
                {source === 'manual' && (
                  <span className="border border-border bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-none font-semibold uppercase tracking-wider">
                    Manual Entry
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground font-medium">Name</dt>
                <dd className="font-semibold text-foreground break-words m-0">{formattedName}</dd>

                <dt className="text-muted-foreground font-medium">REDCap ID</dt>
                <dd className="font-mono font-semibold text-foreground m-0">{mrn ? redact(mrn) : '—'}</dd>

                <dt className="text-muted-foreground font-medium">DOB</dt>
                <dd className="text-foreground m-0">{dob ? redact(formatDate(dob)) : 'not recorded'}</dd>

                {reactionDate && (
                  <>
                    <dt className="text-muted-foreground font-medium">Reaction</dt>
                    <dd className="text-foreground m-0">{redact(formatDate(reactionDate))}</dd>
                  </>
                )}

                {visitDate && (
                  <>
                    <dt className="text-muted-foreground font-medium">Visit</dt>
                    <dd className="text-foreground m-0">{formatDate(visitDate)}</dd>
                  </>
                )}

                {source && source !== 'direct' && source !== 'manual' && (
                  <>
                    <dt className="text-muted-foreground font-medium">Source</dt>
                    <dd className="text-foreground capitalize m-0">{source}</dd>
                  </>
                )}
              </dl>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tablet / Desktop full context bar (>=768px, hidden md:block) */}
      <div className="hidden md:block py-2 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6">
          <div className="flex min-w-max items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground">
            <span className="font-semibold">{formattedName}</span>

            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <span>
              REDCap ID <span className="font-mono font-semibold">{mrn ? redact(mrn) : '—'}</span>
            </span>

            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <span>DOB {dob ? redact(formatDate(dob)) : 'not recorded'}</span>

            {reactionDate ? (
              <>
                <span aria-hidden="true" className="text-muted-foreground">·</span>
                <span>Reaction {redact(formatDate(reactionDate))}</span>
              </>
            ) : null}

            {visitDate ? (
              <>
                <span aria-hidden="true" className="text-muted-foreground">·</span>
                <span>Visit {formatDate(visitDate)}</span>
              </>
            ) : null}

            {source === 'direct' && (
              <>
                <span aria-hidden="true" className="text-muted-foreground">·</span>
                <span className="border border-status-info/40 bg-status-info/10 text-status-info text-xs px-1.5 py-0.5 rounded-none font-semibold uppercase tracking-wider">
                  Direct Entry
                </span>
              </>
            )}

            {source === 'manual' && (
              <>
                <span aria-hidden="true" className="text-muted-foreground">·</span>
                <span className="border border-border bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-none font-semibold uppercase tracking-wider">
                  Manual Entry
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default ClinicalContextBar;
