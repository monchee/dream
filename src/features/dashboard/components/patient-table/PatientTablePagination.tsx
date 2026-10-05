import React from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PatientTablePaginationProps {
  totalFiltered: number;
  currentPage: number;
  ITEMS_PER_PAGE: number;
  handlePrevPage: () => void;
  handleNextPage: () => void;
}

/**
 * Worklist pagination footer (plan 003 / F1). Page state is owned by the
 * parent. Hidden entirely when the filtered list is empty.
 */
const PatientTablePagination: React.FC<PatientTablePaginationProps> = ({
  totalFiltered,
  currentPage,
  ITEMS_PER_PAGE,
  handlePrevPage,
  handleNextPage,
}) => {
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 dark:bg-muted/20">
      <div className="text-xs text-muted-foreground hidden sm:block">
        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalFiltered)} of {totalFiltered} records
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
          disabled={currentPage * ITEMS_PER_PAGE >= totalFiltered}
          className="h-8 min-h-[44px] sm:min-h-8 min-w-[44px] sm:min-w-8 px-2 rounded-none btn-press"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default PatientTablePagination;
