import React from 'react';
import { cn } from '@shared/utils';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkflowSectionList, WorkflowSummary } from './TestingWorkflowStep';
import { WORKFLOW_SECTIONS, getStatusPresentation, type SectionStatus } from './workflowSections';

interface TestingWorkflowMobileProps {
  activeIndex: number;
  onSelectSection: (index: number) => void;
  statuses: SectionStatus[];
  summary: { ready: number; needsAttention: number; notIncluded: number };
  className?: string;
}

const getDestinationLabel = (direction: 'Previous' | 'Next', index: number): string => {
  const destinationIndex = direction === 'Previous' ? index - 1 : index + 1;
  const destination = WORKFLOW_SECTIONS[destinationIndex];
  return destination ? `${direction} section: ${destination.label}` : `${direction} section`;
};

/**
 * Mobile variant of the testing workflow index: current-section card,
 * previous/next controls, and the "All sections" bottom sheet (plan 003 /
 * F1). Statuses and selection are owned by the parent; only the sheet's
 * open state lives here.
 */
const TestingWorkflowMobile: React.FC<TestingWorkflowMobileProps> = ({
  activeIndex,
  onSelectSection,
  statuses,
  summary,
  className,
}) => {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const activeSection = WORKFLOW_SECTIONS[activeIndex] ?? WORKFLOW_SECTIONS[0];
  const activeStatus = statuses[activeIndex] ?? statuses[0];
  const ActiveStatusIcon = getStatusPresentation(activeStatus, false).Icon;
  const activeStatusClassName = getStatusPresentation(activeStatus, false).className;
  const lastSectionIndex = WORKFLOW_SECTIONS.length - 1;

  return (
    <nav aria-label="Testing Workflow Sections" className={cn('print:hidden select-none', className)}>
      <div className="border border-border bg-card p-3 shadow-sm rounded-none">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground">
            Section {activeIndex + 1} of {WORKFLOW_SECTIONS.length}
          </div>
          <div className="mt-1 break-words text-base font-semibold leading-5 text-foreground">
            {activeSection.label}
          </div>
          <div className={cn('mt-2 flex items-center gap-1.5 text-xs leading-4', activeStatusClassName)}>
            <ActiveStatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{activeStatus}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectSection(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="min-h-[44px] min-w-[44px] rounded-none px-2"
            aria-label={getDestinationLabel('Previous', activeIndex)}
          >
            <ChevronLeft data-icon aria-hidden="true" />
            <span className="sr-only">Previous section</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectSection(Math.min(lastSectionIndex, activeIndex + 1))}
            disabled={activeIndex === lastSectionIndex}
            className="min-h-[44px] min-w-[44px] rounded-none px-2"
            aria-label={getDestinationLabel('Next', activeIndex)}
          >
            <ChevronRight data-icon aria-hidden="true" />
            <span className="sr-only">Next section</span>
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] flex-1 rounded-none px-3 sm:flex-none"
              >
                All sections
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85vh] rounded-none px-0 pb-0 pt-5 sm:px-0"
            >
              <SheetHeader className="px-4 text-left sm:px-5">
                <SheetTitle>All workflow sections</SheetTitle>
                <SheetDescription>
                  Choose a section to continue the clinical record.
                </SheetDescription>
                <WorkflowSummary summary={summary} className="pt-1" />
              </SheetHeader>
              <div className="mt-4 overflow-y-auto border-t border-border">
                <WorkflowSectionList
                  activeIndex={activeIndex}
                  statuses={statuses}
                  onSelectSection={index => {
                    setSheetOpen(false);
                    onSelectSection(index);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default TestingWorkflowMobile;
