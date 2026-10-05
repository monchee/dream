import React from 'react';
import { Button, Input } from '@/components/ui';
import { Check, History, Pin, Search } from 'lucide-react';
import { CATEGORY_THEMES, DEFAULT_THEME, DEFAULT_SELECTED_DRUGS } from '@shared/utils/constants';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { resolveSelectedProtocol } from '@shared/utils/protocolResolver';
import { FilterClearButton } from '@shared/components/controls';

interface TestingPlanGeneratorDrugSelectionProps {
  drugCategories: Record<string, string[]>;
  selectedDrugs: string[];
  selectedProtocols: Record<string, number>;
  historyDrugs: string[];
  drugFilter: string;
  setDrugFilter: (value: string) => void;
  toggleDrug: (drug: string) => void;
  toggleCategory: (categoryDrugs: string[]) => void;
  onClearAll: () => void;
  hasNothingToClear: boolean;
  /** Full-span sections rendered inside the category grid after the no-match message (Protocol Choices, Additional Items, Dose Specifications). */
  children?: React.ReactNode;
}

/**
 * The "Select Drugs for Testing" section of the testing plan builder.
 * Pure rendering: selection state and all handlers are owned by the parent
 * TestingPlanGenerator (plan 003 / F1).
 */
const TestingPlanGeneratorDrugSelection: React.FC<TestingPlanGeneratorDrugSelectionProps> = ({
  drugCategories,
  selectedDrugs,
  selectedProtocols,
  historyDrugs,
  drugFilter,
  setDrugFilter,
  toggleDrug,
  toggleCategory,
  onClearAll,
  hasNothingToClear,
  children,
}) => {
  return (
    <div className="space-y-2 rounded-none p-3 transition-colors duration-150">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-1 mb-2">
        <h3 className="section-label">Select Drugs for Testing</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-destructive min-h-[44px] xl:min-h-0 xl:h-6 px-2 rounded-none"
          title="Clear all selected drugs"
          disabled={hasNothingToClear}
        >
          Clear All
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={drugFilter}
          onChange={e => setDrugFilter(e.target.value)}
          placeholder="Filter drugs..."
          aria-label="Filter drugs"
          className="h-11 xl:h-8 pl-8 pr-11 xl:pr-8 text-xs rounded-none"
        />
        {drugFilter && (
          <FilterClearButton
            label="Clear drug filter"
            onClear={() => setDrugFilter('')}
            className="absolute right-1 xl:right-2 top-1/2 -translate-y-1/2"
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {Object.entries(drugCategories).map(([category, drugs]) => {
          const categoryDrugs = drugs as string[];
          const filteredDrugs = drugFilter
            ? categoryDrugs.filter(d => d.toLowerCase().includes(drugFilter.toLowerCase()))
            : categoryDrugs;

          if (drugFilter && filteredDrugs.length === 0) return null;

          const allCategorySelected = categoryDrugs.every(d => selectedDrugs.includes(d));
          const hasActiveSelection = categoryDrugs.some(d => selectedDrugs.includes(d));

          const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;

          return (
            <div
              key={category}
              className={`space-y-2 rounded-none p-3 transition-colors duration-150 ${category === 'Others' ? 'col-span-full' : ''} ${hasActiveSelection ? `${theme.activeBg} ${theme.activeRing} ring-1` : 'hover:bg-muted/50'}`}
            >
              <div className={`flex justify-between items-center border-b border-dashed pb-1 mb-2 ${hasActiveSelection ? `${theme.headerBorder}` : 'border-border'}`}>
                <h4 className={`section-label flex items-center gap-2 ${hasActiveSelection ? theme.headerText : ''}`}>
                  {category}
                  {hasActiveSelection && <span className={`flex h-1.5 w-1.5 rounded-none ${theme.pulse} animate-pulse`}></span>}
                </h4>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleCategory(categoryDrugs); }}
                  className={`text-xs hover:underline font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] xl:min-h-0 inline-flex items-center ${hasActiveSelection ? theme.actionText : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {allCategorySelected ? 'Select None' : 'Select All'}
                </button>
              </div>
              <div className={category === 'Others' ? 'flex flex-wrap gap-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'flex flex-wrap gap-2'}>
                {filteredDrugs.map(drug => {
                  const fromHistory = historyDrugs.includes(drug);
                  const isDefault = DEFAULT_SELECTED_DRUGS.includes(drug);
                  const protocols = getSkinProtocolsForDrug(drug);
                  const resolution = resolveSelectedProtocol(protocols, selectedProtocols[drug]);
                  const needsPharmacyVerification = resolution.status === 'valid' && resolution.protocol.needsPharmacyVerification === true;
                  return (
                    <button
                      key={drug}
                      onClick={() => toggleDrug(drug)}
                      aria-pressed={selectedDrugs.includes(drug)}
                      className={`text-xs px-2.5 py-1.5 min-h-[44px] xl:min-h-0 rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === 'Others' ? 'md:w-full' : ''} ${
                        selectedDrugs.includes(drug)
                          ? theme.btnSelected
                          : `bg-card text-muted-foreground border-border hover:bg-muted/50 ${theme.btnHover}`
                      }`}
                    >
                      {selectedDrugs.includes(drug) && <Check className="w-3 h-3 shrink-0" />}
                      {drug}
                      {selectedDrugs.includes(drug) && needsPharmacyVerification && (
                        <span className="border border-status-warning bg-status-warning/10 px-1.5 py-0.5 text-xs font-semibold leading-tight text-status-warning rounded-none">
                          ⚠ Confirm preparation with pharmacy
                        </span>
                      )}
                      {isDefault && (
                        <span title="Pre-filled for all patients by default" className="inline-flex">
                          <Pin className="w-3 h-3 shrink-0 opacity-70" aria-label="Standard pre-fill" />
                        </span>
                      )}
                      {fromHistory && (
                        <span title="Auto-selected from patient history" className="inline-flex">
                          <History className="w-3 h-3 shrink-0 opacity-70" aria-label="Given at time of reaction" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {drugFilter && Object.values(drugCategories).every(
          drugs => !(drugs as string[]).some(d => d.toLowerCase().includes(drugFilter.toLowerCase()))
        ) && (
          <p className="text-xs text-muted-foreground col-span-full py-2">No drugs match &ldquo;{drugFilter}&rdquo;</p>
        )}
        {children}
      </div>
    </div>
  );
};

export default TestingPlanGeneratorDrugSelection;
