import React from 'react';
import { cn } from '@shared/utils';
import { LogFormData } from '@shared/types';
import TestingWorkflowDesktop from './workflow/TestingWorkflowDesktop';
import TestingWorkflowMobile from './workflow/TestingWorkflowMobile';
import {
  WORKFLOW_SECTIONS,
  deriveSectionStatus,
  getWorkflowSummary,
} from './workflow/workflowSections';

// Public API preserved from before the F1 extraction (plan 003):
// consumers import the section meta and status derivation from this module.
export type { TestingWorkflowSectionKey, SectionStatus, WorkflowSectionMeta } from './workflow/workflowSections';
export { WORKFLOW_SECTIONS, deriveSectionStatus };

export interface TestingWorkflowIndexProps {
  activeIndex: number;
  onSelectSection: (index: number) => void;
  formData: LogFormData;
  isDirectEntry?: boolean;
  className?: string;
  variant?: 'rail' | 'mobile';
}

export const TestingWorkflowIndex: React.FC<TestingWorkflowIndexProps> = ({
  activeIndex,
  onSelectSection,
  formData,
  isDirectEntry = false,
  className,
  variant = 'rail',
}) => {
  const statuses = React.useMemo(
    () => WORKFLOW_SECTIONS.map(section => deriveSectionStatus(section.key, formData, isDirectEntry)),
    [formData, isDirectEntry]
  );
  const summary = React.useMemo(() => getWorkflowSummary(statuses), [statuses]);

  if (variant === 'mobile') {
    return (
      <TestingWorkflowMobile
        activeIndex={activeIndex}
        onSelectSection={onSelectSection}
        statuses={statuses}
        summary={summary}
        className={className}
      />
    );
  }

  return (
    <TestingWorkflowDesktop
      activeIndex={activeIndex}
      onSelectSection={onSelectSection}
      statuses={statuses}
      summary={summary}
      className={cn(className)}
    />
  );
};

export default TestingWorkflowIndex;
