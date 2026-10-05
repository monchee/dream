import React from 'react';
import { Button, Checkbox, Input, Label } from '@/components/ui';
import { Check, Plus, X } from 'lucide-react';
import { CustomDrugEntry } from '@shared/types';
import { CategoryTheme } from '@shared/types/common';

interface TestingPlanGeneratorCustomDrugProps {
  customDrugs: CustomDrugEntry[];
  selectedDrugs: string[];
  customTheme: CategoryTheme;
  hasCustomActive: boolean;
  hasPendingRedcapOther: boolean;
  redcapOtherText: string;
  newCustomDrug: string;
  setNewCustomDrug: (value: string) => void;
  customDrugNotice: string;
  toggleDrug: (drug: string) => void;
  addRedcapOtherAsCustomDrug: () => void;
  removeCustomDrug: (name: string) => void;
  updateCustomEntry: (name: string, field: keyof CustomDrugEntry, value: unknown) => void;
  updateCustomEntryStep: (name: string, si: number, field: string, value: string) => void;
  addCustomEntryIdtStep: (name: string) => void;
  removeCustomEntryIdtStep: (name: string, idx: number) => void;
  addCustomDrug: () => void;
}

/**
 * The "Additional Items" section of the testing plan builder: custom drug
 * chips, REDCap "(not listed)" callout, inline protocol editing, and the
 * add-custom-drug input. Pure rendering: all state and handlers are owned by
 * the parent TestingPlanGenerator (plan 003 / F1). Rendered as a full-span
 * child of the drug selection grid.
 */
const TestingPlanGeneratorCustomDrug: React.FC<TestingPlanGeneratorCustomDrugProps> = ({
  customDrugs,
  selectedDrugs,
  customTheme,
  hasCustomActive,
  hasPendingRedcapOther,
  redcapOtherText,
  newCustomDrug,
  setNewCustomDrug,
  customDrugNotice,
  toggleDrug,
  addRedcapOtherAsCustomDrug,
  removeCustomDrug,
  updateCustomEntry,
  updateCustomEntryStep,
  addCustomEntryIdtStep,
  removeCustomEntryIdtStep,
  addCustomDrug,
}) => {
  return (
    <div className={`col-span-full space-y-2 rounded-none p-3 transition-colors duration-150 ${
        hasPendingRedcapOther
          ? 'bg-status-warning/10 ring-1 ring-status-warning/30'
          : hasCustomActive ? `${customTheme.activeBg} ${customTheme.activeRing} ring-1` : 'hover:bg-muted/50'
      }`}>
      <div className={`flex justify-between items-center border-b border-dashed pb-1 mb-2 ${
          hasPendingRedcapOther ? 'border-status-warning/30' : hasCustomActive ? `${customTheme.headerBorder}` : 'border-border'
        }`}>
        <h4 className={`section-label flex items-center gap-2 ${
            hasPendingRedcapOther ? 'text-status-warning' : hasCustomActive ? customTheme.headerText : ''
          }`}>
          Additional Items
          {hasPendingRedcapOther
            ? <span className="flex h-1.5 w-1.5 rounded-none bg-status-warning animate-pulse"></span>
            : hasCustomActive && <span className={`flex h-1.5 w-1.5 rounded-none ${customTheme.pulse} animate-pulse`}></span>}
        </h4>
      </div>
      {hasPendingRedcapOther && (
        <div className="mb-3 border border-status-warning/30 bg-status-warning/10 p-3 rounded-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-status-warning">
                From REDCap — Others (not listed)
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{redcapOtherText}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRedcapOtherAsCustomDrug}
              className="min-h-[44px] xl:h-8 shrink-0 border-status-warning/50 text-status-warning hover:bg-status-warning/15 rounded-none"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add as custom item
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {customDrugs.map(entry => (
          <div key={entry.name} className="md:w-full flex items-stretch">
            <button
              type="button"
              onClick={() => toggleDrug(entry.name)}
              aria-pressed={selectedDrugs.includes(entry.name)}
              className={`min-w-0 flex-1 text-xs px-2.5 py-1.5 rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                entry.fromRedcapOther
                  ? selectedDrugs.includes(entry.name)
                    ? 'bg-status-warning text-status-warning-foreground border-status-warning shadow-sm ring-1 ring-status-warning/30'
                    : 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning/20'
                  : selectedDrugs.includes(entry.name)
                    ? customTheme.btnSelected
                    : `bg-card text-muted-foreground border-border hover:bg-muted/50 ${customTheme.btnHover}`
              }`}
            >
              {selectedDrugs.includes(entry.name) && <Check className="w-3 h-3 shrink-0" />}
              <span className="truncate">{entry.name}</span>
              {entry.fromRedcapOther && (
                <span className="shrink-0 text-xs uppercase tracking-wider opacity-90">
                  (not listed)
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => removeCustomDrug(entry.name)}
              className="border border-l-0 border-border px-2 min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 inline-flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive rounded-none"
              aria-label={`Remove custom drug ${entry.name}`}
              title={`Remove ${entry.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {/* Inline protocol editing for selected custom drugs */}
      {customDrugs.filter(e => selectedDrugs.includes(e.name)).map(entry => (
        <div key={`proto-${entry.name}`} className="border border-dashed border-border p-2 space-y-2 bg-muted/30 mb-2 rounded-none">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{entry.name} — Protocol</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0 w-7">SPT</span>
            <Input
              className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono"
              placeholder="Neat concentration (e.g. 10mg/mL)..."
              aria-label={`${entry.name} SPT neat concentration`}
              value={entry.sptConcentration || ''}
              onChange={ev => updateCustomEntry(entry.name, 'sptConcentration', ev.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IDT Dilutions</div>
            {(entry.idtSteps ?? []).map((step, si) => (
              <div key={si} className="flex items-center gap-1.5">
                <Input className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono" placeholder="Ratio (e.g. 1:100)" aria-label={`${entry.name} IDT dilution step ${si + 1} ratio`} value={step.ratio} onChange={ev => updateCustomEntryStep(entry.name, si, 'ratio', ev.target.value)} />
                <Input className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono" placeholder="Conc. (e.g. 0.1mg/mL)" aria-label={`${entry.name} IDT dilution step ${si + 1} concentration`} value={step.concentration} onChange={ev => updateCustomEntryStep(entry.name, si, 'concentration', ev.target.value)} />
                <button type="button" onClick={() => removeCustomEntryIdtStep(entry.name, si)} aria-label={`Remove ${entry.name} IDT dilution step ${si + 1}`} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-2 -m-1 min-h-[44px] min-w-[44px] flex items-center justify-center xl:min-h-0 xl:min-w-0 xl:m-0 xl:p-0.5" title="Remove step">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addCustomEntryIdtStep(entry.name)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[44px] xl:min-h-0 w-fit">
              <Plus className="w-3 h-3" /> Add IDT dilution step
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`plan-challenge-${entry.name}`} checked={entry.includeInChallenge || false} onCheckedChange={checked => updateCustomEntry(entry.name, 'includeInChallenge', checked === true)} />
            <Label htmlFor={`plan-challenge-${entry.name}`} className="text-xs text-muted-foreground cursor-pointer select-none">Include in drug challenge</Label>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          className="flex-1 h-11 xl:h-8 text-xs rounded-none bg-background"
          placeholder="Add custom drug..."
          value={newCustomDrug}
          onChange={e => setNewCustomDrug(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomDrug()}
          aria-describedby={customDrugNotice ? 'custom-drug-notice' : undefined}
        />
        <Button size="sm" variant="outline" onClick={addCustomDrug} className="h-11 xl:h-8 w-8 xl:p-0 p-0 rounded-none" aria-label="Add custom drug">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {customDrugNotice && (
        <p id="custom-drug-notice" className="text-xs text-muted-foreground">
          {customDrugNotice}
        </p>
      )}
    </div>
  );
};

export default TestingPlanGeneratorCustomDrug;
