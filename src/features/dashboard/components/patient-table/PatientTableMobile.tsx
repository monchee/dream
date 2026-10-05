import React from 'react';
import { Badge, Skeleton } from '@/components/ui';
import { Upload } from 'lucide-react';
import { formatDate, getGradeVariant, parsePatientTimeline } from '@shared/utils';
import { Patient } from '@shared/types';
import { type PatientStatusResult } from '@shared/utils/patientStatus';
import { EmptyState } from '@shared/components/states';
import PatientTableStatus from './PatientTableStatus';

interface PatientTableMobileProps {
  paginatedPatients: Array<{ patient: Patient; result: PatientStatusResult }>;
  isLoading: boolean;
  quickFilter: string;
  filteredPatientsCount: number;
  activeFilterCount: number;
  onSelectPatient: (patient: Patient) => void;
}

/**
 * Mobile card list of the patient worklist (plan 003 / F1). Pure rendering;
 * the card keyboard path and selection are owned by the parent.
 */
const PatientTableMobile: React.FC<PatientTableMobileProps> = ({
  paginatedPatients,
  isLoading,
  quickFilter,
  filteredPatientsCount,
  activeFilterCount,
  onSelectPatient,
}) => {
  const handleMobileCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, patient: Patient) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectPatient(patient);
    }
  };

  return (
    <div className="md:hidden divide-y divide-border">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))
      ) : paginatedPatients.length > 0 ? (
        paginatedPatients.map(({ patient: p, result }, index) => {
          const { events: timelineEvents } = parsePatientTimeline(p.history);
          return (
            <div
              role="button"
              tabIndex={0}
              key={p.id}
              style={{ '--row-index': Math.min(index, 9) } as React.CSSProperties}
              className="block w-full min-h-[44px] p-3 text-left hover:bg-muted/50 dark:hover:bg-card/50 transition-colors cursor-pointer active:bg-muted dark:active:bg-muted/50 animate-row-enter focus-visible:ring-2 focus-visible:ring-primary rounded-none btn-press"
              onClick={() => onSelectPatient(p)}
              onKeyDown={(event) => handleMobileCardKeyDown(event, p)}
              aria-label={`View details for patient: ${p.firstName} ${p.lastName}`}
            >
              <div className="flex justify-between items-start mb-1 gap-2">
                <div>
                  <div className="font-bold text-foreground">
                    {p.lastName}, {p.firstName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[200px]">
                    {formatDate(p.history.date)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <PatientTableStatus result={result} />
                  <Badge variant={getGradeVariant(p.history.grade || 'Ungraded')} className="whitespace-nowrap text-xs w-20 justify-center">
                    {(p.history.grade || 'Ungraded').split(' -')[0]}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-1 line-clamp-1 italic">
                {p.history.procedure || 'Unknown Procedure'}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                {timelineEvents.map((e, idx) => (
                  <div
                    key={idx}
                    role="img"
                    aria-label={`${e.type} event: ${e.time} - ${e.label}`}
                    className={`
                        h-2 w-2 rounded-full
                        ${e.type === 'reaction' ? 'bg-status-danger' : ''}
                        ${e.type === 'induction' ? 'bg-primary' : ''}
                        ${e.type === 'med' ? 'bg-muted-foreground/40 dark:bg-muted/60' : ''}
                      `}
                  />
                ))}
                {timelineEvents.length === 0 && <span className="text-xs text-muted-foreground">No timed events</span>}
              </div>
            </div>
          );
        })
      ) : quickFilter !== 'all' && filteredPatientsCount > 0 ? (
        <EmptyState title="No patients match this filter." />
      ) : activeFilterCount > 0 ? (
        <EmptyState title="No matching records found." />
      ) : (
        <EmptyState
          icon={<Upload className="w-8 h-8 opacity-40" aria-hidden="true" />}
          title="No patient data loaded"
          description="Upload a REDCap CSV to get started."
        />
      )}
    </div>
  );
};

export default PatientTableMobile;
