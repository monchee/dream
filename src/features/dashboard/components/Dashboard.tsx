
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { parseRedcapCSV, decodeCsvBytes } from '@shared/utils';
import { Patient, LogFormData } from '@shared/types';
import { toast } from 'sonner';
import { useCountUp } from '@shared/hooks/useCountUp';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import AnalyticsPanel from './AnalyticsPanel';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import PatientTable from './PatientTable';
import SkinTestBreakdown from './SkinTestBreakdown';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface DashboardProps {
  existingPatients: Patient[];
  recentLogs: LogFormData[];
  drugOptions: string[];
  drugCategories: Record<string, string[]>;
  onSelectPatient: (patient: Patient) => void;
  onUploadPatients: (patients: Patient[], fileLastModified?: number) => boolean | void;
  databaseDate: string;
  isCustomData?: boolean;
  isLoadingPatients?: boolean;
  patientDbSavedAt?: number | null;
}

const getPrefersReducedMotion = () => (
  typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    : false
);

const Dashboard: React.FC<DashboardProps> = ({ existingPatients, recentLogs, drugOptions, drugCategories, onSelectPatient, onUploadPatients, databaseDate, isCustomData, isLoadingPatients, patientDbSavedAt }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [pendingReplacement, setPendingReplacement] = useState<{
    data: Patient[];
    fileLastModified?: number;
    details?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Search Hook
  const { filteredPatients, suggestions, filters, updateFilter, clearFilters, activeFilterCount } = useAdvancedSearch(existingPatients);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;

    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);
    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  // Trigger chart animations on mount
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimateCharts(true);
      return;
    }

    const raf = requestAnimationFrame(() => setAnimateCharts(true));
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  // --- Analytics Calculation ---
  const analytics = useDashboardAnalytics({
    existingPatients,
    recentLogs,
    drugOptions,
    drugCategories
  });

  // Animated numbers
  const animatedTotalPatients = useCountUp(analytics.totalPatients);
  const animatedRedcapCount = useCountUp(analytics.redcapRecordCount);
  const animatedSevereCount = useCountUp(analytics.redcapGrade3PlusCount);
  const animatedAbandonedCount = useCountUp(analytics.abandonedCount);
  const animatedAvgTime = useCountUp(analytics.avgReactionTime);

  // Headline severe/abandoned rates are REDCap-record rates so the displayed count and percentage share the same denominator.
  // The Overview shows REDCap records and current-session logs as separate figures (no longer summed into one "Records" number).
  const severeRate = analytics.redcapRecordCount > 0
    ? ((analytics.redcapGrade3PlusCount / analytics.redcapRecordCount) * 100).toFixed(1) 
    : "0";

  const abandonedRate = analytics.redcapRecordCount > 0 
    ? ((analytics.abandonedCount / analytics.redcapRecordCount) * 100).toFixed(1)
    : "0";

  // --- Handle File Upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                const text = decodeCsvBytes(event.target?.result as ArrayBuffer);
                const result = parseRedcapCSV(text);

                if (result.success) {
                    // Check for duplicate patient IDs
                    const existingIds = new Set(existingPatients.map(p => p.id));
                    const duplicates = result.data.filter(p => existingIds.has(p.id));

                    if (duplicates.length > 0) {
                        setPendingReplacement({
                            data: result.data,
                            fileLastModified: file.lastModified,
                            details: result.details,
                        });
                    } else {
                        const persisted = onUploadPatients(result.data, file.lastModified);
                        if (persisted === false) {
                            toast.error('Imported, but not saved', {
                                description: 'Browser storage refused the write. The records are available until you leave this page.',
                                duration: 8000,
                            });
                            return;
                        }
                        toast.success('Database updated', {
                            description: `Imported ${result.data.length} record(s).${result.details ? ` ${result.details.join(' ')}` : ''}`,
                        });
                        setIsSheetOpen(false);
                    }
                } else {
                    toast.error('Failed to parse CSV file', {
                        description: `${result.error || 'Please check the file format.'} Make sure the CSV was exported from REDCap and has the correct headers.`,
                        duration: 8000,
                    });
                }
              } catch {
                  toast.error('Error processing file', {
                      description: 'An unexpected error occurred. Please check the file format and try again.',
                      duration: 8000,
                  });
              } finally {
                  setIsUploading(false);
              }
          };
          reader.onerror = () => {
              toast.error('Error reading file', {
                  description: 'Failed to read the file. It may be corrupted or in an unsupported format. Please try exporting from REDCap again.',
                  duration: 8000,
              });
              setIsUploading(false);
          };
          reader.readAsArrayBuffer(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Pagination ---
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, existingPatients]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
        prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const allCategories = useMemo(() => analytics.statsByCategory.map(c => c.category), [analytics.statsByCategory]);
  const areAllExpanded = allCategories.length > 0 && expandedCategories.length === allCategories.length;

  const toggleAllCategories = () => {
    if (areAllExpanded) {
        setExpandedCategories([]);
    } else {
        setExpandedCategories(allCategories);
    }
  };

  const sectionRevealClass = prefersReducedMotion ? '' : 'animate-section-reveal';

  const handleConfirmReplacement = () => {
    if (!pendingReplacement) return;

    const persisted = onUploadPatients(pendingReplacement.data, pendingReplacement.fileLastModified);
    if (persisted === false) {
      toast.error('Imported, but not saved', {
        description: 'Browser storage refused the write. The records are available until you leave this page.',
        duration: 8000,
      });
      return;
    }
    toast.success('Database updated', {
      description: `Imported ${pendingReplacement.data.length} record(s).${pendingReplacement.details ? ` ${pendingReplacement.details.join(' ')}` : ''}`,
    });
    setIsSheetOpen(false);
    setPendingReplacement(null);
  };

  const handleReplacementDialogChange = (open: boolean) => {
    if (!open) setPendingReplacement(null);
  };

  return (
    <div className="space-y-8">

        <ConfirmDialog
          open={pendingReplacement !== null}
          onOpenChange={handleReplacementDialogChange}
          title="Replace existing database?"
          message={`Replace existing database (${existingPatients.length} records) with this export (${pendingReplacement?.data.length ?? 0} records)? Unsaved testing drafts are kept.`}
          confirmLabel="Replace database"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmReplacement}
        />

        {/* Modern Stats Grid */}
        <div style={{ '--section-index': 0 } as React.CSSProperties} className={sectionRevealClass}>
          <AnalyticsPanel
            animatedTotalPatients={animatedTotalPatients}
            animatedRedcapCount={animatedRedcapCount}
            sessionLogCount={analytics.sessionLogCount}
            animatedSevereCount={animatedSevereCount}
            severeRate={severeRate}
            animatedAbandonedCount={animatedAbandonedCount}
            abandonedRate={abandonedRate}
            animatedAvgTime={animatedAvgTime}
            gradeCounts={analytics.gradeCounts}
            hasInferredSessionGrades={analytics.hasInferredSessionGrades}
            topAgents={analytics.topAgentsByCount}
            animateCharts={animateCharts}
            reduceMotion={prefersReducedMotion}
          />
        </div>

        {/* Screen reader announcement for search results */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </div>

        {/* Patient Database Table (Full Width) - Paginated */}
        <div style={{ '--section-index': 1 } as React.CSSProperties} className={sectionRevealClass}>
          <PatientTable
            filteredPatients={filteredPatients}
            currentPage={currentPage}
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            suggestions={suggestions}
            isFiltersExpanded={isFiltersExpanded}
            setIsFiltersExpanded={setIsFiltersExpanded}
            databaseDate={databaseDate}
            isCustomData={isCustomData}
            onSelectPatient={onSelectPatient}
            handleFileUpload={handleFileUpload}
            isSheetOpen={isSheetOpen}
            setIsSheetOpen={setIsSheetOpen}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            resetPage={() => setCurrentPage(1)}
            allPatients={existingPatients}
            isLoading={isLoadingPatients}
            patientDbSavedAt={patientDbSavedAt}
          />
        </div>

        {/* Positive Skin Test Breakdown */}
        <div style={{ '--section-index': 2 } as React.CSSProperties} className={sectionRevealClass}>
          <SkinTestBreakdown
            statsByCategory={analytics.statsByCategory}
            expandedCategories={expandedCategories}
            toggleCategory={toggleCategory}
            toggleAllCategories={toggleAllCategories}
          />
        </div>

    </div>
  );
};

export default Dashboard;
