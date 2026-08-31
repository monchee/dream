import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, Button, Input, Badge, Skeleton } from '@/components/ui';
import { Check, ChevronLeft, ChevronRight, FileText, Search, Upload, Download } from 'lucide-react';
import { ACTIVE_REPORT_TTL_MS, formatDate, formatTime, getGradeVariant, parsePatientTimeline } from '@shared/utils';
import {
  ACTIVE_REPORT_KEY,
  getIfFresh,
  TESTING_DRAFT_KEY,
  TESTING_PLAN_BUILDER_DRAFTS_KEY,
} from '@shared/utils/ttlStorage';
import {
  derivePatientStatus,
  type PatientStatusResult,
  type PatientWorkflowStatus,
} from '@shared/utils/patientStatus';
import { Patient } from '@shared/types';
import { AdvancedSearchFilters, AdvancedSearchPanel } from './AdvancedSearchFilters';
import { CSVUploadInstructions } from './CSVUploadInstructions';
import { exportDeidentifiedCSV, downloadFile } from '@shared/utils/auditExporter';
import { AdvancedSearchFilters as SearchFilters } from '../hooks/useAdvancedSearch';
import { EmptyState, TableEmptyRow } from '@shared/components/states';

interface PatientTableProps {
  filteredPatients: Patient[];
  currentPage: number;
  ITEMS_PER_PAGE: number;
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  suggestions: {
    procedures: string[];
    hospitals: string[];
    agents: string[];
  };
  isFiltersExpanded: boolean;
  setIsFiltersExpanded: (expanded: boolean) => void;
  databaseDate: string;
  isCustomData?: boolean;
  onSelectPatient: (patient: Patient) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  resetPage: () => void;
  allPatients: Patient[];
  isLoading?: boolean;
  patientDbSavedAt?: number | null;
}

type WorklistQuickFilter = 'all' | 'needs-action' | 'reported';

const QUICK_FILTERS: ReadonlyArray<{ value: WorklistQuickFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'needs-action', label: 'Needs action' },
  { value: 'reported', label: 'Reported' },
];

const STATUS_BADGES: Record<PatientWorkflowStatus, {
  label: string;
  variant: 'outline' | 'info' | 'warning' | 'success';
}> = {
  referral: { label: 'Referral', variant: 'outline' },
  'plan-drafted': { label: 'Plan drafted', variant: 'info' },
  testing: { label: 'Testing', variant: 'warning' },
  reported: { label: 'Reported', variant: 'success' },
};

const PatientStatusBadges: React.FC<{ result: PatientStatusResult }> = ({ result }) => {
  const statusBadge = STATUS_BADGES[result.status];

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={statusBadge.variant} className="whitespace-nowrap px-2 py-0 text-xs leading-5">
        {statusBadge.label}
      </Badge>
      {result.docsOutstanding ? (
        <Badge variant="warning" className="whitespace-nowrap px-2 py-0 text-xs leading-5">
          Docs outstanding
        </Badge>
      ) : null}
    </div>
  );
};

const PatientTable: React.FC<PatientTableProps> = ({
  filteredPatients,
  currentPage,
  ITEMS_PER_PAGE,
  filters,
  updateFilter,
  clearFilters,
  activeFilterCount,
  suggestions,
  isFiltersExpanded,
  setIsFiltersExpanded,
  databaseDate,
  isCustomData = false,
  onSelectPatient,
  handleFileUpload,
  isSheetOpen,
  setIsSheetOpen,
  isUploading,
  fileInputRef,
  handleNextPage,
  handlePrevPage,
  resetPage,
  allPatients,
  isLoading = false,
  patientDbSavedAt,
}) => {
  const [quickFilter, setQuickFilter] = useState<WorklistQuickFilter>('all');
  const statusInputs = useMemo(() => ({
    planDrafts: getIfFresh<Record<string, unknown>>(TESTING_PLAN_BUILDER_DRAFTS_KEY),
    testingDraft: getIfFresh<{ mrn?: string }>(TESTING_DRAFT_KEY),
    activeReport: getIfFresh<{ mrn?: string }>(ACTIVE_REPORT_KEY),
  }), []);

  const patientsWithStatus = useMemo(() => filteredPatients.map(patient => ({
    patient,
    result: derivePatientStatus(patient, statusInputs),
  })), [filteredPatients, statusInputs]);

  const quickFilteredPatients = useMemo(() => patientsWithStatus.filter(({ result }) => {
    if (quickFilter === 'reported') return result.status === 'reported';
    if (quickFilter === 'needs-action') {
      return result.docsOutstanding || result.status !== 'reported';
    }
    return true;
  }), [patientsWithStatus, quickFilter]);

  const totalPages = Math.ceil(quickFilteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = useMemo(() => quickFilteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  ), [currentPage, ITEMS_PER_PAGE, quickFilteredPatients]);

  const selectQuickFilter = (value: WorklistQuickFilter) => {
    setQuickFilter(value);
    resetPage();
  };

  const handleMobileCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, patient: Patient) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectPatient(patient);
    }
  };

  return (
    <Card elevation="raised" className="w-full animate-enter-subtle">
      <CardHeader bordered className="py-4 bg-card">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Top Row: Title + Update Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div className="space-y-1">
              <CardTitle as="h2" className="text-base flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-primary" /> REDCap Record Database
              </CardTitle>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{isCustomData ? `Updated ${databaseDate}` : 'Demo data'}</span>
                {isCustomData && patientDbSavedAt !== null && patientDbSavedAt !== undefined ? (
                  <span>
                    Imported database · {allPatients.length} patients · expires {formatTime(patientDbSavedAt + ACTIVE_REPORT_TTL_MS)}
                  </span>
                ) : null}
                <span className="flex items-center gap-2" aria-label="Timeline legend">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />Induction</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-danger" aria-hidden="true" />Reaction</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40 dark:bg-muted/60" aria-hidden="true" />Medication</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                aria-label="Upload CSV file"
                className="hidden"
              />
              <CSVUploadInstructions
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onUpload={handleFileUpload}
                isUploading={isUploading}
              />
              <Button
                onClick={() => {
                  const csv = exportDeidentifiedCSV(allPatients);
                  const date = new Date().toISOString().slice(0, 10);
                  downloadFile(csv, `audit-export-${date}.csv`, 'text/csv');
                }}
                size="sm"
                variant="outline"
                disabled={allPatients.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Audit Export
              </Button>
              <Button
                onClick={() => setIsSheetOpen(true)}
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </div>
          {/* Search & Filters Section */}
          <div className="space-y-3">
            {/* Row 1: Search Box + Filter Button Toggle */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search by Name, REDCap ID..."
                  aria-label="Search patients by name, REDCap ID, or city"
                  className="pl-9 min-h-[44px] sm:min-h-9 bg-muted"
                  value={filters.textQuery}
                  onChange={(e) => updateFilter('textQuery', e.target.value)}
                />
              </div>
              <AdvancedSearchFilters
                activeFilterCount={activeFilterCount}
                isExpanded={isFiltersExpanded}
                setIsExpanded={setIsFiltersExpanded}
              />
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Worklist filters">
                {QUICK_FILTERS.map(({ value, label }) => {
                  const isSelected = quickFilter === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      aria-pressed={isSelected}
                      onClick={() => selectQuickFilter(value)}
                      className="min-h-[44px] sm:min-h-8 rounded-none px-3 text-xs btn-press"
                    >
                      {isSelected ? <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Expanded Filters */}
            {isFiltersExpanded && (
              <AdvancedSearchPanel
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
                suggestions={suggestions}
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Desktop View (Table) */}
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
                      <PatientStatusBadges result={result} />
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
            ) : quickFilter !== 'all' && filteredPatients.length > 0 ? (
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

      {/* Mobile View (Card List) */}
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
                    <PatientStatusBadges result={result} />
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
        ) : quickFilter !== 'all' && filteredPatients.length > 0 ? (
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

      {/* Pagination Controls */}
      {quickFilteredPatients.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 dark:bg-muted/20">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, quickFilteredPatients.length)} of {quickFilteredPatients.length} records
          </div>
          <div
            className="text-xs text-muted-foreground sm:hidden"
            aria-live="polite"
            aria-atomic="true"
          >
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 min-h-[44px] sm:min-h-8 min-w-[44px] sm:min-w-8 px-2 rounded-none btn-press"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div
              className="text-xs font-medium text-foreground/80 px-2 hidden sm:block"
              aria-live="polite"
              aria-atomic="true"
            >
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage * ITEMS_PER_PAGE >= quickFilteredPatients.length}
              className="h-8 min-h-[44px] sm:min-h-8 min-w-[44px] sm:min-w-8 px-2 rounded-none btn-press"
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default React.memo(PatientTable);
