import React from 'react';
import { cn } from '@shared/utils';
import { WorkflowSectionList, WorkflowSummary } from './TestingWorkflowStep';
import type { SectionStatus } from './workflowSections';

interface TestingWorkflowDesktopProps {
  activeIndex: number;
  onSelectSection: (index: number) => void;
  statuses: SectionStatus[];
  summary: { ready: number; needsAttention: number; notIncluded: number };
  className?: string;
}

/**
 * Desktop rail variant of the testing workflow index (plan 003 / F1).
 * Statuses and selection are owned by the parent.
 */
const TestingWorkflowDesktop: React.FC<TestingWorkflowDesktopProps> = ({
  activeIndex,
  onSelectSection,
  statuses,
  summary,
  className,
}) => {
  return (
    <nav
      aria-label="Testing Workflow Sections"
      className={cn('print:hidden select-none', className)}
    >
      <div className="border-b border-border px-3 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold tracking-wide text-foreground">Workflow</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {activeIndex + 1} of {statuses.length}
          </span>
        </div>
        <WorkflowSummary summary={summary} className="mt-1" />
      </div>
      <WorkflowSectionList
        activeIndex={activeIndex}
        statuses={statuses}
        onSelectSection={onSelectSection}
      />
    </nav>
  );
};

export default TestingWorkflowDesktop;
