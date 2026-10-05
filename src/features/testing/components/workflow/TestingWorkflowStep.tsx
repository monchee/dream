import React from 'react';
import { cn } from '@shared/utils';
import { WORKFLOW_SECTIONS, getStatusPresentation, type SectionStatus, type WorkflowSummaryCounts } from './workflowSections';

interface WorkflowSummaryProps {
  summary: WorkflowSummaryCounts;
  className?: string;
}

export const WorkflowSummary: React.FC<WorkflowSummaryProps> = ({ summary, className }) => (
  <p className={cn('text-xs leading-5 text-muted-foreground', className)}>
    <span className="text-primary font-medium">{summary.ready} ready</span>
    <span aria-hidden="true"> · </span>
    <span>{summary.needsAttention} need attention</span>
    <span aria-hidden="true"> · </span>
    <span>{summary.notIncluded} not included</span>
  </p>
);

interface WorkflowSectionListProps {
  activeIndex: number;
  onSelectSection: (index: number) => void;
  statuses: SectionStatus[];
}

/**
 * The ordered list of workflow section steps (plan 003 / F1). Pure
 * rendering: the active section and selection live in the parent index.
 */
export const WorkflowSectionList: React.FC<WorkflowSectionListProps> = ({
  activeIndex,
  onSelectSection,
  statuses,
}) => (
  <ol className="list-none m-0 p-0 border-t border-border">
    {WORKFLOW_SECTIONS.map((section, index) => {
      const isActive = activeIndex === index;
      const status = statuses[index];
      const Icon = section.icon;
      const { Icon: StatusIcon, className: statusClassName } = getStatusPresentation(status, isActive);

      return (
        <li key={section.key} className="m-0 p-0 border-b border-border last:border-b-0">
          <button
            type="button"
            onClick={() => onSelectSection(index)}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${section.number}. ${section.label} (${status})`}
            className={cn(
              'group flex w-full min-h-[44px] items-start gap-3 px-3 py-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              isActive
                ? 'bg-workflow-active text-workflow-active-foreground'
                : 'bg-card text-foreground hover:bg-muted/60'
            )}
          >
            <span
              className={cn(
                'w-5 shrink-0 pt-0.5 font-mono text-sm tabular-nums leading-5',
                isActive ? 'text-workflow-active-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              {section.number}
            </span>
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                isActive ? 'text-workflow-active-foreground' : 'text-primary'
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium leading-5">
                {section.label}
              </span>
              <span className={cn('mt-1 flex items-center gap-1.5 text-xs leading-4', statusClassName)}>
                <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{status}</span>
              </span>
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);
