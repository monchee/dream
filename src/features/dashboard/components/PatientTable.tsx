import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { Check, FileText, Search, Upload, Download } from 'lucide-react';
import { ACTIVE_REPORT_TTL_MS, formatTime } from '@shared/utils';
import {
  ACTIVE_REPORT_KEY,
  getIfFresh,
  TESTING_DRAFT_KEY,
  TESTING_PLAN_BUILDER_DRAFTS_KEY,
} from '@shared/utils/ttlStorage';
import { derivePatientStatus } from '@shared/utils/patientStatus';
import { Patient } from '@shared/types';
import { AdvancedSearchFilters, AdvancedSearchPanel } from './AdvancedSearchFilters';
import { CSVUploadInstructions } from './CSVUploadInstructions';
import { exportDeidentifiedCSV, downloadFile } from '@shared/utils/auditExporter';
import { AdvancedSearchFilters as SearchFilters } from '../hooks/useAdvancedSearch';
import PatientTableDesktop from './patient-table/PatientTableDesktop';
import PatientTableMobile from './patient-table/PatientTableMobile';
import PatientTablePagination from './patient-table/PatientTablePagination';

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

  const paginatedPatients = useMemo(() => quickFilteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  ), [currentPage, ITEMS_PER_PAGE, quickFilteredPatients]);

  const selectQuickFilter = (value: WorklistQuickFilter) => {
    setQuickFilter(value);
    resetPage();
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
                  className="pl-9 min-h-[44px] sm:min-h-9 bg-muted text-ellipsis"
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
      <PatientTableDesktop
        paginatedPatients={paginatedPatients}
        isLoading={isLoading}
        quickFilter={quickFilter}
        filteredPatientsCount={filteredPatients.length}
        activeFilterCount={activeFilterCount}
        onSelectPatient={onSelectPatient}
      />

      {/* Mobile View (Card List) */}
      <PatientTableMobile
        paginatedPatients={paginatedPatients}
        isLoading={isLoading}
        quickFilter={quickFilter}
        filteredPatientsCount={filteredPatients.length}
        activeFilterCount={activeFilterCount}
        onSelectPatient={onSelectPatient}
      />

      {/* Pagination Controls */}
      {quickFilteredPatients.length > 0 && (
        <PatientTablePagination
          totalFiltered={quickFilteredPatients.length}
          currentPage={currentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
        />
      )}
    </Card>
  );
};

export default React.memo(PatientTable);
