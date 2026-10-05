import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { Activity, Check, ChevronDown, ClipboardList, Plus, Search } from 'lucide-react';
import { LogFormData } from '@shared/types';
import { CATEGORY_THEMES, DEFAULT_THEME } from '@shared/utils/constants';
import { FilterClearButton } from '@shared/components/controls';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { DrugTestGrid } from './DrugTestGrid';
import { preventNegativeInput } from './TestingLogFormSectionShared';

export interface DrugTestPanelSectionProps {
  formData: LogFormData;
  onClearPanel: () => void;
  drugCategories: Record<string, string[]>;
  drugFilter: string;
  setDrugFilter: (value: string) => void;
  drugToCategoryMap: Record<string, string>;
  onToggleDrug: (drug: string) => void;
  onToggleCategory: (drugs: string[]) => void;
  onAddCustomDrug: () => void;
  onControlChange: (field: keyof LogFormData['controls'], value: string) => void;
  onUpdateDrugData: (index: number, field: string, value: string) => void;
  onSelectProtocol: (rowIndex: number, protocolIndex: number) => void;
  onRemoveRow: (index: number) => void;
  onAddCustomIdtStep: (rowIndex: number) => void;
  onRemoveCustomIdtStep: (rowIndex: number, stepIndex: number) => void;
  /** R1: section actions (Previous/Next) rendered in the record lane, before the plan lane. */
  sectionActions?: React.ReactNode;
  /** R1: plan-lane state lives in the parent so it survives section navigation (session-persistent). */
  planLaneOpen: boolean;
  onPlanLaneToggle: () => void;
  onPlanLaneOpen: () => void;
  onPlanLaneSet: (open: boolean) => void;
  planLaneManual: boolean;
}

/** A row belongs to the active session panel when it is a fresh selection or a custom (Other) row — custom rows carry stable `custom-*` ids. */
function isInSessionPanel(row: LogFormData['testPanel'][number]): boolean {
  return !row.id || row.drugName === 'Other';
}

/** A custom drug still needs concentrations before it can be tested. */
function customDrugNeedsSetup(row: LogFormData['testPanel'][number]): boolean {
  return row.drugName === 'Other'
    && !row.customSptConcentration
    && (row.customIdtSteps ?? []).length === 0;
}

export function DrugTestPanelSection({
  formData,
  onClearPanel,
  drugCategories,
  drugFilter,
  setDrugFilter,
  drugToCategoryMap,
  onToggleDrug,
  onToggleCategory,
  onAddCustomDrug,
  onControlChange,
  onUpdateDrugData,
  onSelectProtocol,
  onRemoveRow,
  onAddCustomIdtStep,
  onRemoveCustomIdtStep,
  sectionActions,
  planLaneOpen,
  onPlanLaneToggle,
  onPlanLaneOpen,
  onPlanLaneSet,
  planLaneManual,
}: DrugTestPanelSectionProps) {
  const selectedRows = formData.testPanel.filter(isInSessionPanel);
  const selectedCount = selectedRows.length;

  // R1: auto-manage the lane until the nurse overrides — open while empty,
  // collapse on the first selection, re-open if the panel empties.
  const previousSelectedCount = React.useRef(selectedCount);

  React.useEffect(() => {
    // Initial sync on mount: lane open iff nothing is selected yet.
    if (!planLaneManual) onPlanLaneSet(selectedCount === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (planLaneManual) return;
    // An unconfigured custom drug needs the lane open — don't pull it out from
    // under the nurse; configured selections collapse as before.
    const unconfiguredCustom = formData.testPanel.some(
      row => isInSessionPanel(row) && customDrugNeedsSetup(row),
    );
    if (previousSelectedCount.current === 0 && selectedCount > 0 && !unconfiguredCustom) {
      onPlanLaneSet(false);
    }
    if (selectedCount === 0) {
      onPlanLaneSet(true);
    }
    previousSelectedCount.current = selectedCount;
  }, [selectedCount, planLaneManual, onPlanLaneSet, formData.testPanel]);

  // One-line plan status: drugs, protocol options, and dilution steps.
  const protocolChoiceCount = selectedRows.filter(
    row => row.drugName !== 'Other' && getSkinProtocolsForDrug(row.drugName).length > 1,
  ).length;
  const dilutionStepCount = selectedRows.reduce((sum, row) => {
    if (row.drugName === 'Other') return sum + (row.customIdtSteps?.length ?? 0);
    const protocols = getSkinProtocolsForDrug(row.drugName);
    return sum + (protocols[row.protocolIndex ?? 0]?.idtSteps?.length ?? 0);
  }, 0);

  const noFilterMatches = drugFilter && Object.values(drugCategories).every(
    drugs => !(drugs as string[]).some(d => d.toLowerCase().includes(drugFilter.toLowerCase())),
  );

  return (
    <Card style={{ '--section-index': 1 } as React.CSSProperties} className="animate-section-reveal">
      <CardHeader bordered>
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <div className="bg-muted p-1.5 rounded-none">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          SPT &amp; IDT Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* ── Record-now lane (primary, always visible): reference controls + measurements ── */}
        <div className="bg-card px-4 py-4 rounded-none border border-border flex flex-col gap-4">
          <div className="section-label">Reference Controls (mm):</div>
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:gap-x-8 md:gap-y-4">
            {([
              ['histamineSpt', 'histamine-spt', 'Histamine (SPT)'],
              ['salineSpt', 'saline-spt', 'Saline (SPT)'],
              ['salineIdt', 'saline-idt', 'Saline (IDT)'],
            ] as const).map(([field, id, label]) => (
              <div key={field} className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                <Label htmlFor={id} className="text-xs font-medium text-foreground">{label}</Label>
                <Input
                  id={id}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  onKeyDown={preventNegativeInput}
                  placeholder="0"
                  className="bg-background h-11 xl:h-9 w-full md:w-20 text-center text-sm font-mono tabular-nums rounded-none"
                  value={formData.controls[field]}
                  onChange={(e) => onControlChange(field, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <DrugTestGrid
          testPanel={formData.testPanel}
          drugToCategoryMap={drugToCategoryMap}
          onUpdate={onUpdateDrugData}
          onSelectProtocol={onSelectProtocol}
          onRemove={onRemoveRow}
          onAddCustomIdtStep={onAddCustomIdtStep}
          onRemoveCustomIdtStep={onRemoveCustomIdtStep}
          variant="record"
          onOpenPlan={onPlanLaneOpen}
        />

        {/* Section actions sit in the record lane, before the plan lane (R1 focus order) */}
        {sectionActions}

        {/* ── Plan-and-reference lane (secondary, disclosed): drug selection ── */}
        <div className="border border-border rounded-none">
          <button
            type="button"
            onClick={onPlanLaneToggle}
            aria-expanded={planLaneOpen}
            aria-controls={planLaneOpen ? 'testing-plan-lane' : undefined}
            className="w-full min-h-[44px] flex items-center justify-between gap-3 px-4 py-2.5 text-left bg-muted/50 hover:bg-muted transition-colors rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="flex items-center gap-2 min-w-0 text-sm font-semibold text-foreground">
              <ClipboardList className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate">
                  Testing plan &amp; drug selection
                </span>
                <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                  {selectedCount} drug{selectedCount === 1 ? '' : 's'} selected
                  {protocolChoiceCount > 0 && ` · ${protocolChoiceCount} with protocol options`}
                  {dilutionStepCount > 0 && ` · ${dilutionStepCount} dilution step${dilutionStepCount === 1 ? '' : 's'}`}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150 ${planLaneOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {planLaneOpen && (
            <div id="testing-plan-lane" className="space-y-4 p-4 border-t border-border">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <Label className="section-label">
                  Select Drugs to Test:<span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearPanel}
                  className="text-xs text-muted-foreground hover:text-destructive min-h-[44px] xl:min-h-0 xl:h-6 px-2 rounded-none font-normal"
                  title="Clear all selected drugs"
                >
                  Clear All
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="drug-filter"
                  value={drugFilter}
                  onChange={e => setDrugFilter(e.target.value)}
                  placeholder="Filter drugs..."
                  aria-label="Filter drugs"
                  className="h-11 xl:h-8 pl-8 pr-11 xl:pr-8 text-xs rounded-none bg-background text-foreground"
                />
                {drugFilter && (
                  <FilterClearButton
                    label="Clear drug filter"
                    onClear={() => setDrugFilter('')}
                    className="absolute right-1.5 xl:right-2 top-1/2 -translate-y-1/2 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(drugCategories).map(([category, drugs]) => {
                  const categoryDrugs = drugs as string[];
                  const filteredDrugs = drugFilter
                    ? categoryDrugs.filter(d => d.toLowerCase().includes(drugFilter.toLowerCase()))
                    : categoryDrugs;

                  if (drugFilter && filteredDrugs.length === 0) return null;

                  const hasActiveSelection = categoryDrugs.some(drug =>
                    formData.testPanel.some(row => row.drugName === drug && !row.id),
                  );
                  const allCategorySelected = categoryDrugs.every(drug =>
                    formData.testPanel.some(row => row.drugName === drug && !row.id),
                  );
                  const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;

                  return (
                    <div key={category} className={`space-y-2 rounded-none p-3 transition-colors duration-150 ${category === 'Others' ? 'col-span-full' : ''} ${hasActiveSelection ? `${theme.activeBg} ${theme.activeRing} ring-1` : 'hover:bg-muted/50'}`}>
                      <div className={`flex justify-between items-center border-b border-dashed pb-1 mb-2 ${hasActiveSelection ? `${theme.headerBorder}` : 'border-border'}`}>
                        <p className={`section-label flex items-center gap-2 ${hasActiveSelection ? theme.headerText : ''}`}>
                          {category}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); onToggleCategory(categoryDrugs); }}
                          className={`text-xs hover:underline font-medium transition-colors min-h-[44px] xl:min-h-0 inline-flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${hasActiveSelection ? theme.actionText : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {allCategorySelected ? 'Select None' : 'Select All'}
                        </button>
                      </div>
                      <div className={category === 'Others' ? 'flex flex-wrap gap-2 md:grid md:grid-cols-3 lg:grid-cols-4' : 'flex flex-wrap gap-2'}>
                        {filteredDrugs.map(drug => {
                          const isSelected = formData.testPanel.some(row => row.drugName === drug && !row.id);
                          return (
                            <button
                              key={drug}
                              onClick={() => onToggleDrug(drug)}
                              aria-pressed={isSelected}
                              className={`text-xs px-2.5 py-1.5 min-h-[44px] xl:min-h-0 rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === 'Others' ? 'md:w-full' : ''} ${
                                isSelected
                                  ? theme.btnSelected
                                  : `bg-card text-muted-foreground border-border hover:bg-muted/50 ${theme.btnHover}`
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 shrink-0" />}
                              {drug}
                            </button>
                          );
                        })}

                        {category === 'Others' && (
                          <button
                            onClick={onAddCustomDrug}
                            className={`md:w-full text-xs px-2.5 py-1.5 min-h-[44px] xl:min-h-0 rounded-none border border-dashed border-border text-muted-foreground hover:bg-muted/50 transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${theme.btnHover}`}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            Other
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {noFilterMatches && (
                  <p className="text-xs text-muted-foreground col-span-full py-2">No drugs match &ldquo;{drugFilter}&rdquo;</p>
                )}
              </div>

              {/* Per-drug plan content (protocol, concentrations, notes) lives in the plan lane */}
              {selectedCount > 0 && (
                <div className="space-y-3 pt-2 border-t border-dashed border-border">
                  <p className="section-label">Per-drug plan details</p>
                  <DrugTestGrid
                    testPanel={formData.testPanel}
                    drugToCategoryMap={drugToCategoryMap}
                    onUpdate={onUpdateDrugData}
                    onSelectProtocol={onSelectProtocol}
                    onRemove={onRemoveRow}
                    onAddCustomIdtStep={onAddCustomIdtStep}
                    onRemoveCustomIdtStep={onRemoveCustomIdtStep}
                    variant="plan"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
