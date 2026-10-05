import React from 'react';
import { Badge, Skeleton } from '@/components/ui';
import { Upload } from 'lucide-react';
import { formatDate, getGradeVariant, parsePatientTimeline } from '@shared/utils';
import { Patient } from '@shared/types';
import { type PatientStatusResult } from '@shared/utils/patientStatus';
import { TableEmptyRow } from '@shared/components/states';
import PatientTableStatus from './PatientTableStatus';

interface PatientTableDesktopProps {
  paginatedPatients: Array<{ patient: Patient; result: PatientStatusResult }>;
  isLoading: boolean;
  quickFilter: string;
  filteredPatientsCount: number;
  activeFilterCount: number;
  onSelectPatient: (patient: Patient) => void;
}

/**
 * Desktop table view of the patient worklist (plan 003 / F1). Pure
 * rendering: filtering, pagination, and selection are owned by the parent.
 */
const PatientTableDesktop: React.FC<PatientTableDesktopProps> = ({
  paginatedPatients,
  isLoading,
  quickFilter,
  filteredPatientsCount,
  activeFilterCount,
  onSelectPatient,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table aria-label="Patient database" className="w-full text-sm text-left">
        <thead className="bg-card text-xs uppercase text-muted-foreground font-semibold">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 w-28">Date</th>
            <th scope="col" className="px-4 py-3 w-40 md:w-44 lg:w-48">Patient</th>
            <th scope="col" className="px-4 py-3 min-w-[140px]">Procedure</th>
            <th scope="col" className="px-4 py-3 w-32 md:w-36 lg:w-48">Timeline</th>
            <th scope="col" className="px-4 py-3 w-36 md:w-40 lg:w-48">Status</th>
            <th scope="col" className="px-4 py-3 text-center w-24 md:w-28">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 mx-auto" /></td>
              </tr>
            ))
          ) : paginatedPatients.length > 0 ? (
            paginatedPatients.map(({ patient: p, result }, index) => {
              const { events: timelineEvents } = parsePatientTimeline(p.history);
              return (
                <tr
                  key={p.id}
                  style={{ '--row-index': Math.min(index, 9) } as React.CSSProperties}
                  className="hover:bg-muted/50 dark:hover:bg-card/50 transition-colors group animate-row-enter"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono tabular-nums text-xs">
                    {formatDate(p.history.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors">
                    <button
                      type="button"
                      onClick={() => onSelectPatient(p)}
                      className="block max-w-[130px] md:max-w-[150px] lg:max-w-[180px] truncate border-0 bg-transparent p-0 text-left font-medium text-foreground cursor-pointer group-hover:text-primary dark:group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label={`View details for patient: ${p.firstName} ${p.lastName}`}
                      title={`${p.lastName}, ${p.firstName}`}
                    >
                      {p.lastName}, {p.firstName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="line-clamp-1 max-w-[150px] md:max-w-[200px] lg:max-w-xs" title={p.history.procedure || 'Unknown'}>
                      {p.history.procedure || <span className="italic text-muted-foreground">Unknown</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {timelineEvents.map((e, idx) => (
                        <div
                          key={idx}
                          role="img"
                          aria-label={`${e.type} event: ${e.time} - ${e.label}`}
                          className={`
                              h-2.5 w-2.5 rounded-full cursor-help inline-block
                              ${e.type === 'reaction' ? 'bg-status-danger' : ''}
                              ${e.type === 'induction' ? 'bg-primary' : ''}
                              ${e.type === 'med' ? 'bg-muted-foreground/40 dark:bg-muted/60' : ''}
                            `}
                          title={`${e.time} - ${e.label}`}
                        />
                      ))}
                      {timelineEvents.length === 0 && <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PatientTableStatus result={result} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={getGradeVariant(p.history.grade || 'Ungraded')}
                      className="whitespace-nowrap text-xs cursor-help w-20 justify-center"
                      title={p.history.grade || 'Ungraded'}
                    >
                      {(p.history.grade || 'Ungraded').split(' -')[0]}
                    </Badge>
                  </td>
                </tr>
              );
            })
          ) : quickFilter !== 'all' && filteredPatientsCount > 0 ? (
            <TableEmptyRow colSpan={6} title="No patients match this filter." />
          ) : activeFilterCount > 0 ? (
            <TableEmptyRow colSpan={6} title="No matching records found." />
          ) : (
            <TableEmptyRow
              colSpan={6}
              icon={<Upload className="w-8 h-8 opacity-40" aria-hidden="true" />}
              title="No patient data loaded"
              description="Upload a REDCap CSV to get started."
            />
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTableDesktop;
