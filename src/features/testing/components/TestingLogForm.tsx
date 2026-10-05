import React, { useCallback, useRef, useState } from 'react';
import { LogFormData, NurseNotes, TryptaseData } from '@shared/types';
import { useTestingLogLogic } from '../hooks/useTestingLogLogic';
import { TestingService } from '../services/TestingService';
import {
  AssessmentPlanSection,
  DrugChallengeSection,
  DrugTestPanelSection,
  NurseNotesSection,
  TryptaseSection,
  VisitDetailsSection,
} from './TestingLogFormSections';
import { ReviewSaveSection } from './ReviewSaveSection';
import { TestingWorkflowIndex, WORKFLOW_SECTIONS } from './TestingWorkflowIndex';
import { ValidationErrorLink } from './SaveActionSection';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface TestingLogFormProps {
  formData: LogFormData;
  setFormData: React.Dispatch<React.SetStateAction<LogFormData>>;
  onSubmit: () => void;
  drugCategories: Record<string, string[]>;
  symptomOptions: readonly string[] | string[];
  interventionOptions: readonly string[] | string[];
  isDirectEntry?: boolean;
}

const TestingLogForm: React.FC<TestingLogFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  drugCategories,
  symptomOptions,
  interventionOptions,
  isDirectEntry = false,
}) => {
  const {
    drugToCategoryMap,
    handleInputChange,
    handleControlChange,
    toggleDrug,
    toggleCategory,
    selectProtocol,
    addCustomDrug,
    addCustomIdtStep,
    removeCustomIdtStep,
    removeRow,
    updateDrugData,
    toggleSymptom,
    challengeOptions,
  } = useTestingLogLogic({ formData, setFormData, drugCategories });

  const handleTryptaseChange = useCallback((tryptase: TryptaseData) => {
    setFormData(prev => ({ ...prev, tryptase }));
  }, [setFormData]);

  const handleNurseNotesChange = useCallback((nurseNotes: NurseNotes) => {
    setFormData(prev => ({ ...prev, nurseNotes }));
  }, [setFormData]);

  const handleClearTestPanel = useCallback(() => {
    setFormData(prev => ({ ...prev, testPanel: [] }));
  }, [setFormData]);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorLink[]>([]);
  const [drugFilter, setDrugFilter] = useState('');
  const [nurseNotesOpen, setNurseNotesOpen] = useState(true);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const testingService = new TestingService();
  const lastSectionIndex = WORKFLOW_SECTIONS.length - 1;
  const showSectionOneSaveAction = activeSectionIndex === 0 && validationErrors.length > 0;

  const toValidationLink = (message: string): ValidationErrorLink => {
    const lower = message.toLowerCase();
    if (lower.includes('mrn') || lower.includes('redcap id')) return { message, fieldId: 'patient-mrn' };
    if (lower.includes('first name')) return { message, fieldId: 'patient-first-name' };
    if (lower.includes('last name')) return { message, fieldId: 'patient-last-name' };
    if (lower.includes('visit date')) return { message, fieldId: 'visit-date' };
    if (lower.includes('drug') || lower.includes('test panel')) return { message, fieldId: 'drug-filter' };
    return { message, fieldId: 'clinical-plan' };
  };

  const getInvalidSectionIndex = (errors: string[]): number => {
    for (const error of errors) {
      const lower = error.toLowerCase();
      if (lower.includes('mrn') || lower.includes('redcap id') || lower.includes('first name') || lower.includes('last name') || lower.includes('visit date')) {
        return 0; // Patient and visit
      }
      if (lower.includes('drug') || lower.includes('test panel')) {
        return 1; // SPT and IDT
      }
      if (lower.includes('challenge')) {
        return 2; // Drug challenge
      }
      if (lower.includes('plan')) {
        return 4; // Assessment and plan
      }
    }
    return 6; // Review and save
  };

  const handleSave = () => {
    const { isValid, errors } = testingService.validateForm(formData);
    if (!isValid) {
      const errorLinks = errors.map(toValidationLink);
      setValidationErrors(errorLinks);
      const invalidSectionIdx = getInvalidSectionIndex(errors);
      setActiveSectionIndex(invalidSectionIdx);

      requestAnimationFrame(() => {
        const firstError = errorLinks[0];
        if (firstError?.fieldId) {
          const element = document.getElementById(firstError.fieldId);
          if (element) {
            element.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            element.focus?.();
            return;
          }
        }
        errorSummaryRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        errorSummaryRef.current?.focus?.();
      });
      return;
    }
    setValidationErrors([]);
    onSubmit();
  };

  const handleJumpToSection = (sectionIndex: number, fieldId?: string) => {
    setActiveSectionIndex(sectionIndex);
    if (fieldId) {
      requestAnimationFrame(() => {
        const element = document.getElementById(fieldId);
        if (element) {
          element.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
          element.focus?.();
        }
      });
    }
  };

  // Shared step navigation; rendered inside the section-2 record lane (R1)
  // and below the section for every other section.
  const stepNavigationControls = (
    <div className="flex items-center justify-between pt-4 border-t border-border no-print">
      <Button
        type="button"
        variant="outline"
        onClick={() => setActiveSectionIndex(i => Math.max(0, i - 1))}
        disabled={activeSectionIndex === 0}
        className="min-h-[44px] px-4 rounded-none btn-press"
      >
        <ChevronLeft className="w-4 h-4 mr-1.5" /> Previous Section
      </Button>

      {activeSectionIndex < lastSectionIndex && !showSectionOneSaveAction ? (
        <Button
          type="button"
          onClick={() => setActiveSectionIndex(i => Math.min(lastSectionIndex, i + 1))}
          className="min-h-[44px] px-4 rounded-none bg-primary text-primary-foreground font-semibold btn-press"
        >
          Next Section <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] px-6 rounded-none bg-primary text-primary-foreground font-bold btn-press shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" /> Save Clinical Record
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full space-y-4 sm:space-y-6">
      {/* Mobile Workflow Navigator */}
      <div className="md:hidden no-print">
        <TestingWorkflowIndex
          variant="mobile"
          activeIndex={activeSectionIndex}
          onSelectSection={setActiveSectionIndex}
          formData={formData}
          isDirectEntry={isDirectEntry}
        />
      </div>

      {/* Main Indexed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Desktop Sticky Workflow Index */}
        <div
          className="hidden md:block sticky z-10"
          style={{ top: 'calc(var(--app-chrome-height, 0px) + 1rem)' }}
        >
          <div className="p-3 border border-border bg-card shadow-sm rounded-none">
            <TestingWorkflowIndex
              activeIndex={activeSectionIndex}
              onSelectSection={setActiveSectionIndex}
              formData={formData}
              isDirectEntry={isDirectEntry}
            />
          </div>
        </div>

        {/* Active Section View */}
        <div className="min-w-0 space-y-6 chrome-anchor">
          {/* Section 1: Patient and visit */}
          {activeSectionIndex === 0 && (
            <VisitDetailsSection
              formData={formData}
              onInputChange={handleInputChange}
              isDirectEntry={isDirectEntry}
              validationErrors={validationErrors}
            />
          )}

          {/* Section 2: SPT and IDT — nav actions render inside the record lane (R1 focus order) */}
          {activeSectionIndex === 1 && (
            <DrugTestPanelSection
              formData={formData}
              onClearPanel={handleClearTestPanel}
              drugCategories={drugCategories}
              drugFilter={drugFilter}
              setDrugFilter={setDrugFilter}
              drugToCategoryMap={drugToCategoryMap}
              onToggleDrug={toggleDrug}
              onToggleCategory={toggleCategory}
              onAddCustomDrug={addCustomDrug}
              onControlChange={handleControlChange}
              onUpdateDrugData={updateDrugData}
              onSelectProtocol={selectProtocol}
              onRemoveRow={removeRow}
              onAddCustomIdtStep={addCustomIdtStep}
              onRemoveCustomIdtStep={removeCustomIdtStep}
              sectionActions={stepNavigationControls}
            />
          )}

          {/* Section 3: Drug challenge */}
          {activeSectionIndex === 2 && (
            <DrugChallengeSection
              formData={formData}
              challengeOptions={challengeOptions}
              symptomOptions={symptomOptions}
              interventionOptions={interventionOptions}
              onInputChange={handleInputChange}
              onToggleSymptom={toggleSymptom}
            />
          )}

          {/* Section 4: Serial serum tryptase */}
          {activeSectionIndex === 3 && (
            <TryptaseSection
              tryptase={formData.tryptase}
              onChange={handleTryptaseChange}
            />
          )}

          {/* Section 5: Assessment and plan */}
          {activeSectionIndex === 4 && (
            <AssessmentPlanSection
              plan={formData.plan}
              onInputChange={handleInputChange}
            />
          )}

          {/* Section 6: Nursing notes */}
          {activeSectionIndex === 5 && (
            <NurseNotesSection
              nurseNotes={formData.nurseNotes}
              onChange={handleNurseNotesChange}
              isOpen={nurseNotesOpen}
              setIsOpen={setNurseNotesOpen}
            />
          )}

          {/* Section 7: Review and save */}
          {activeSectionIndex === 6 && (
            <ReviewSaveSection
              formData={formData}
              isDirectEntry={isDirectEntry}
              validationErrors={validationErrors}
              errorSummaryRef={errorSummaryRef}
              onSave={handleSave}
              onJumpToSection={handleJumpToSection}
            />
          )}

          {/* Step Navigation Controls between sections (inside the record lane for section 2) */}
          {activeSectionIndex !== 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border no-print">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveSectionIndex(i => Math.max(0, i - 1))}
                disabled={activeSectionIndex === 0}
                className="min-h-[44px] px-4 rounded-none btn-press"
              >
                <ChevronLeft className="w-4 h-4 mr-1.5" /> Previous Section
              </Button>

              {activeSectionIndex < lastSectionIndex && !showSectionOneSaveAction ? (
                <Button
                  type="button"
                  onClick={() => setActiveSectionIndex(i => Math.min(lastSectionIndex, i + 1))}
                  className="min-h-[44px] px-4 rounded-none bg-primary text-primary-foreground font-semibold btn-press"
                >
                  Next Section <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  className="min-h-[44px] px-6 rounded-none bg-primary text-primary-foreground font-bold btn-press shadow-sm"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Clinical Record
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestingLogForm;
