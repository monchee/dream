import React from 'react';
import {
  User,
  TestTube2,
  Syringe,
  Activity,
  FileCheck2,
  ClipboardList,
  Save,
  Eye,
  Clock,
  Circle,
  MinusCircle,
} from 'lucide-react';
import { LogFormData } from '@shared/types';
import { testingService } from '../../services/TestingService';

export type TestingWorkflowSectionKey =
  | 'patient-visit'
  | 'spt-idt'
  | 'drug-challenge'
  | 'tryptase'
  | 'assessment-plan'
  | 'nursing-notes'
  | 'review-save';

export type SectionStatus = 'Not started' | 'In progress' | 'Ready for review' | 'Not included';

export interface WorkflowSectionMeta {
  key: TestingWorkflowSectionKey;
  number: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKFLOW_SECTIONS: WorkflowSectionMeta[] = [
  { key: 'patient-visit', number: 1, label: 'Patient and visit', shortLabel: 'Patient', icon: User },
  { key: 'spt-idt', number: 2, label: 'SPT and IDT', shortLabel: 'SPT/IDT', icon: TestTube2 },
  { key: 'drug-challenge', number: 3, label: 'Drug challenge', shortLabel: 'Challenge', icon: Syringe },
  { key: 'tryptase', number: 4, label: 'Serial serum tryptase', shortLabel: 'Tryptase', icon: Activity },
  { key: 'assessment-plan', number: 5, label: 'Assessment and plan', shortLabel: 'Plan', icon: FileCheck2 },
  { key: 'nursing-notes', number: 6, label: 'Nursing notes', shortLabel: 'Nursing', icon: ClipboardList },
  { key: 'review-save', number: 7, label: 'Review and save', shortLabel: 'Save', icon: Save },
];

export function deriveSectionStatus(
  sectionKey: TestingWorkflowSectionKey,
  formData: LogFormData,
  _isDirectEntry = false
): SectionStatus {
  switch (sectionKey) {
    case 'patient-visit': {
      const hasMrn = Boolean(formData.mrn?.trim());
      const hasFirstName = Boolean(formData.firstName?.trim());
      const hasLastName = Boolean(formData.lastName?.trim());
      const hasVisitDate = Boolean(formData.visitDate?.trim());
      const count = [hasMrn, hasFirstName, hasLastName, hasVisitDate].filter(Boolean).length;

      if (count === 4) return 'Ready for review';
      if (count > 0) return 'In progress';
      return 'Not started';
    }

    case 'spt-idt': {
      const controls = formData.controls;
      const hasAllControls = Boolean(
        controls?.histamineSpt?.trim() && controls?.salineSpt?.trim() && controls?.salineIdt?.trim()
      );
      const hasAnyControl = Boolean(
        controls?.histamineSpt?.trim() || controls?.salineSpt?.trim() || controls?.salineIdt?.trim()
      );

      const rows = formData.testPanel || [];
      const hasRows = rows.length > 0;
      const allOtherRowsNamed = rows.every(
        row => row.drugName !== 'Other' || Boolean(row.customName?.trim())
      );
      const hasAnyUnregisteredOther = rows.some(
        row => row.drugName === 'Other' && !row.customName?.trim()
      );
      const rowsWithResults = rows.filter(
        row => Boolean(row.sptWheal?.trim()) || (row.idtResults || []).some(r => Boolean(r?.trim()))
      );
      const hasAnyResults = rowsWithResults.length > 0;

      if (hasRows && allOtherRowsNamed && hasAllControls && hasAnyResults) {
        return 'Ready for review';
      }
      if (hasAnyControl || hasAnyResults || hasAnyUnregisteredOther) {
        return 'In progress';
      }
      return 'Not started';
    }

    case 'drug-challenge': {
      if (!formData.proceedToChallenge) return 'Not included';
      const hasDrug = Boolean(formData.challengeDrug && (formData.challengeDrug !== 'Other' || formData.challengeDrugCustom?.trim()));
      const hasOutcome = Boolean(formData.outcome);
      if (hasDrug && hasOutcome) {
        if (formData.outcome === 'UNSUCCESS') {
          const hasReactionTime = Boolean(formData.reactionTime?.trim());
          const hasSymptoms = (formData.symptoms?.length ?? 0) > 0;
          return (hasReactionTime && hasSymptoms) ? 'Ready for review' : 'In progress';
        }
        return 'Ready for review';
      }
      return 'In progress';
    }

    case 'tryptase': {
      if (!formData.tryptase?.obtained && (!formData.tryptase?.values || formData.tryptase.values.length === 0)) {
        return 'Not included';
      }
      if (formData.tryptase?.obtained) {
        const values = formData.tryptase.values || [];
        const hasValidValues = values.length > 0 && values.some(
          v => Boolean(v.time?.trim()) && Boolean(v.result?.trim())
        );
        return hasValidValues ? 'Ready for review' : 'In progress';
      }
      return 'Not included';
    }

    case 'assessment-plan': {
      return formData.plan?.trim() ? 'Ready for review' : 'Not started';
    }

    case 'nursing-notes': {
      const notes = formData.nurseNotes;
      if (!notes || (!notes.preTesting?.trim() && !notes.duringTesting?.trim() && !notes.postTesting?.trim() && !notes.signedBy?.trim())) {
        return 'Not included';
      }
      if (notes.signedBy?.trim()) {
        return 'Ready for review';
      }
      return 'In progress';
    }

    case 'review-save': {
      const validation = testingService.validateForm(formData);
      return validation.isValid ? 'Ready for review' : 'In progress';
    }

    default:
      return 'Not started';
  }
}

export type StatusIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface StatusPresentation {
  Icon: StatusIconComponent;
  className: string;
}

export const getStatusIcon = (status: SectionStatus): StatusIconComponent => {
  switch (status) {
    case 'Ready for review':
      return Eye;
    case 'In progress':
      return Clock;
    case 'Not included':
      return MinusCircle;
    case 'Not started':
    default:
      return Circle;
  }
};

export const getStatusPresentation = (
  status: SectionStatus,
  isActive: boolean
): StatusPresentation => {
  if (isActive) {
    return { Icon: getStatusIcon(status), className: 'text-workflow-active-foreground' };
  }

  switch (status) {
    case 'Ready for review':
      return { Icon: Eye, className: 'text-primary' };
    case 'In progress':
      return { Icon: Clock, className: 'text-status-warning' };
    case 'Not included':
      return { Icon: MinusCircle, className: 'text-muted-foreground' };
    case 'Not started':
    default:
      return { Icon: Circle, className: 'text-muted-foreground' };
  }
};

export interface WorkflowSummaryCounts {
  ready: number;
  needsAttention: number;
  notIncluded: number;
}

export const getWorkflowSummary = (statuses: SectionStatus[]): WorkflowSummaryCounts => ({
  ready: statuses.filter(status => status === 'Ready for review').length,
  needsAttention: statuses.filter(status => status === 'Not started' || status === 'In progress').length,
  notIncluded: statuses.filter(status => status === 'Not included').length,
});
