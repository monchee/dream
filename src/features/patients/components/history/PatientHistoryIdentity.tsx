import React from 'react';
import { Badge, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { FlaskConical } from 'lucide-react';
import { formatDate, getGradeVariant } from '@shared/utils';

interface PatientHistoryIdentityProps {
  date: string;
  procedure?: string;
  tryptaseChipText?: string;
  hasTryptaseData: boolean;
  gradeLabel: string;
  gradeDesc: string;
  grade: string;
}

/**
 * The header information box of the reaction history card: reaction date,
 * procedure, tryptase chip, and the severity grade badge (plan 003 / F1).
 */
const PatientHistoryIdentity: React.FC<PatientHistoryIdentityProps> = ({
  date,
  procedure,
  tryptaseChipText,
  hasTryptaseData,
  gradeLabel,
  gradeDesc,
  grade,
}) => {
  return (
    <div className="mt-2 bg-background p-4 rounded-none border border-border flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
        <span className="font-semibold text-foreground text-base tracking-tight">
          {formatDate(date)}
        </span>
        <span aria-hidden="true" className="hidden sm:inline-block h-4 w-px bg-border" />
        <span className="text-base text-primary dark:text-primary font-semibold uppercase tracking-wider leading-tight break-words">
          {procedure || 'Procedure not recorded'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {hasTryptaseData && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 px-2.5 py-1 rounded-none">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold uppercase tracking-wide text-xs">Tryptase:</span>
            <span>{tryptaseChipText}</span>
          </div>
        )}
        {gradeDesc && gradeDesc !== gradeLabel ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-none cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`Severity grading: ${gradeLabel}. View grading criteria.`}
              >
                <Badge variant={getGradeVariant(grade)} className="whitespace-nowrap">
                  {gradeLabel}
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-left p-3" sideOffset={4}>
              <p className="font-bold mb-1 text-foreground border-b border-border pb-1">{gradeLabel}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{gradeDesc}</p>
            </PopoverContent>
          </Popover>
        ) : (
          <Badge variant={getGradeVariant(grade)} className="whitespace-nowrap">
            {gradeLabel}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PatientHistoryIdentity;
