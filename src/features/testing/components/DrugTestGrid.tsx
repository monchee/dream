import React from 'react';
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../../components/ui';
import { X, Plus, Check, ChevronDown, ClipboardList } from 'lucide-react';
import { DrugTestRow, DrugProtocol } from '@shared/types';
import { CATEGORY_THEMES, DEFAULT_THEME, SKIN_TEST_POSITIVE_THRESHOLD } from '@shared/utils/constants';
import { CompactActionButton } from '@shared/components/controls';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { EmptyState } from '@shared/components/states';

interface DrugTestGridProps {
  testPanel: DrugTestRow[];
  drugToCategoryMap: Record<string, string>;
  onUpdate: (index: number, field: string, value: string) => void;
  onSelectProtocol: (rowIndex: number, protocolIndex: number) => void;
  onRemove: (index: number) => void;
  onAddCustomIdtStep: (rowIndex: number) => void;
  onRemoveCustomIdtStep: (rowIndex: number, stepIndex: number) => void;
  /** R1: 'record' renders measurements only; 'plan' renders protocol/concentration/notes content. */
  variant?: 'record' | 'plan';
  /** Opens the testing-plan lane; used by the record empty state and the custom-drug hint. */
  onOpenPlan?: () => void;
}

const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
};

const isPositive = (value: string) => {
  const num = parseFloat(value);
  return !Number.isNaN(num) && num >= SKIN_TEST_POSITIVE_THRESHOLD;
};

interface WhealInputProps {
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
}

const WhealInput = ({ value, onChange, 'aria-label': ariaLabel }: WhealInputProps) => (
  <div className="relative">
    <Input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*"
      aria-label={ariaLabel}
      onKeyDown={preventNegativeInput}
      className={`h-11 xl:h-9 text-center font-mono tabular-nums rounded-none ${isPositive(value) ? 'text-status-danger font-bold bg-status-danger/10 border-status-danger/40 dark:bg-status-danger/20 dark:text-status-danger dark:border-status-danger/50' : ''}`}
      placeholder="-"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {isPositive(value) ? (
      <span className="pointer-events-none absolute -right-1.5 -top-1.5 z-10 rounded-none bg-status-danger px-1 py-0.5 text-xs font-bold leading-none text-status-danger-foreground">
        +POS
      </span>
    ) : null}
  </div>
);

interface DrugRowBaseProps {
  row: DrugTestRow;
  index: number;
  protocol: DrugProtocol | null;
  allProtocols: DrugProtocol[];
  drugToCategoryMap: Record<string, string>;
  onUpdate: (index: number, field: string, value: string) => void;
  onSelectProtocol: (rowIndex: number, protocolIndex: number) => void;
  onRemove: (index: number) => void;
  onAddCustomIdtStep: (rowIndex: number) => void;
  onRemoveCustomIdtStep: (rowIndex: number, stepIndex: number) => void;
  /** Opens the plan lane (record variant only, for unconfigured custom drugs). */
  onOpenPlan?: () => void;
}

function useRowContext({ row, protocol, drugToCategoryMap }: Pick<DrugRowBaseProps, 'row' | 'protocol' | 'drugToCategoryMap'>) {
  const protocolIndex = row.protocolIndex ?? 0;
  const category = drugToCategoryMap[row.drugName] || 'Others';
  const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;
  const borderClass = row.drugName === 'Other' ? DEFAULT_THEME.rowBorder : theme.rowBorder;
  // Resolve IDT results — handle legacy records that came in via migration
  const idtResults = row.idtResults ?? [];
  const idtSteps = row.drugName === 'Other'
    ? (row.customIdtSteps ?? [])
    : (protocol?.idtSteps ?? []);
  return { protocolIndex, category, theme, borderClass, idtResults, idtSteps };
}

function RemoveButton({ row, index, onRemove }: { row: DrugTestRow; index: number; onRemove: (index: number) => void }) {
  return (
    <CompactActionButton
      onClick={() => onRemove(index)}
      label={`Remove ${row.drugName} from testing panel`}
      tooltip="Remove drug"
      className={`shrink-0 p-2 -m-1 xl:m-0 xl:p-1 ${row.drugName === 'Other' ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
    >
      <X className="w-4 h-4" />
    </CompactActionButton>
  );
}

/** Record variant: name, measurement inputs, and reference info only. */
const DrugRecordRow = React.memo((props: DrugRowBaseProps) => {
  const { row, index, protocol, onUpdate, onRemove, onOpenPlan } = props;
  const { borderClass, idtResults, idtSteps } = useRowContext(props);

  const customNeedsSetup = row.drugName === 'Other'
    && !row.customSptConcentration
    && (row.customIdtSteps ?? []).length === 0;

  return (
    <div className={`p-4 md:p-3 bg-background border border-border border-l-[6px] ${borderClass} shadow-sm rounded-none group space-y-3`}>
      {/* Drug name row */}
      <div className="flex items-center gap-2">
        {row.drugName === 'Other' ? (
          <Input
            aria-label="Custom drug name"
            className="h-11 xl:h-9 text-sm flex-1 min-w-0 font-medium font-mono rounded-none"
            placeholder="Specify name..."
            value={row.customName || ''}
            onChange={(e) => onUpdate(index, 'customName', e.target.value)}
            autoFocus
          />
        ) : (
          <span className="font-semibold text-sm text-foreground flex-1 min-w-0 truncate">
            {row.drugName}
          </span>
        )}
        <RemoveButton row={row} index={index} onRemove={onRemove} />
      </div>

      {customNeedsSetup && onOpenPlan && (
        <button
          type="button"
          onClick={onOpenPlan}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[44px] xl:min-h-0 w-fit"
        >
          <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
          Concentrations not set — open the testing plan to configure this custom drug
        </button>
      )}

      {/* SPT concentration reference */}
      {protocol?.sptNeatConcentration && (
        <div className="text-xs text-muted-foreground">
          <span className="section-label">SPT Preparation: </span>
          {protocol.sptNeatConcentration}
        </div>
      )}

      {/* Result inputs grid */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${1 + idtSteps.length}, minmax(0, 1fr))` }}>
        {/* SPT */}
        <div className="space-y-1">
          <div className="section-label text-center">SPT</div>
          <div className="text-xs text-center text-muted-foreground leading-tight min-h-[2rem] flex items-center justify-center">
            {row.drugName === 'Other' ? (row.customSptConcentration || '') : (protocol?.sptNeatConcentration ? 'Neat' : '')}
          </div>
          <WhealInput
            aria-label={`${row.drugName} SPT wheal measurement in millimetres`}
            value={row.sptWheal}
            onChange={(value) => onUpdate(index, 'sptWheal', value)}
          />
        </div>

        {/* IDT steps */}
        {idtSteps.map((step, si) => {
          const val = idtResults[si] ?? '';
          return (
            <div key={si} className="space-y-1">
              <div className="section-label text-center">IDT {si + 1}</div>
              <div className="text-[10px] text-center text-muted-foreground leading-tight min-h-[2rem] flex flex-col items-center justify-center">
                <span className="font-medium">{step.ratio}</span>
                {step.concentration && <span>{step.concentration}</span>}
              </div>
              <WhealInput
                aria-label={`${row.drugName} IDT ${step.ratio} wheal measurement in millimetres`}
                value={val}
                onChange={(value) => onUpdate(index, `idt_${si}`, value)}
              />
            </div>
          );
        })}
      </div>

      {/* Legacy fallback: show 3 unlabelled IDT columns if old record with no protocol */}
      {idtSteps.length === 0 && !protocol && idtResults.length > 0 && idtResults.map((val, si) => (
        <div key={si} className="space-y-1">
          <div className="section-label text-center">IDT {si + 1}</div>
          <div className="min-h-[2rem]" />
          <WhealInput
            aria-label={`${row.drugName} IDT ${si + 1} wheal measurement in millimetres`}
            value={val}
            onChange={(value) => onUpdate(index, `idt_${si}`, value)}
          />
        </div>
      ))}
    </div>
  );
});

DrugRecordRow.displayName = 'DrugRecordRow';

/** Plan variant: protocol switching, custom concentrations, dilutions, and notes. */
const DrugPlanRow = React.memo((props: DrugRowBaseProps) => {
  const { row, index, protocol, allProtocols, onUpdate, onSelectProtocol, onAddCustomIdtStep, onRemoveCustomIdtStep } = props;
  const { protocolIndex, theme, borderClass } = useRowContext(props);

  const configured = !(row.drugName === 'Other'
    && !row.customSptConcentration
    && (row.customIdtSteps ?? []).length === 0);

  return (
    <div className={`p-4 md:p-3 bg-muted/20 border border-border border-l-[6px] ${borderClass} rounded-none space-y-3`}>
      {/* Drug name row */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-foreground flex-1 min-w-0 truncate">
          {row.drugName === 'Other' ? (row.customName || 'Custom drug (specify name in Record lane)') : row.drugName}
        </span>
        {!configured && (
          <span className="text-xs font-semibold text-status-warning shrink-0">Needs concentrations</span>
        )}
        <RemoveButton row={row} index={index} onRemove={props.onRemove} />
      </div>

      {row.drugName !== 'Other' && allProtocols.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="section-label shrink-0">Protocol</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Switch protocol for ${row.drugName}`}
                className={`shrink-0 inline-flex items-center justify-center gap-1 text-xs px-2 py-0.5 min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 rounded-none border transition-[color,background-color,border-color,box-shadow] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${theme.btnSelected}`}
                title="Switch protocol"
              >
                <span>{protocol?.protocolLabel || `Protocol ${protocolIndex + 1}`}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none min-w-[10rem]">
              {allProtocols.map((p, pi) => (
                <DropdownMenuItem
                  key={pi}
                  onSelect={() => onSelectProtocol(index, pi)}
                  className="text-xs gap-2 rounded-none cursor-pointer"
                >
                  <Check className={`w-3 h-3 shrink-0 ${pi === protocolIndex ? 'opacity-100' : 'opacity-0'}`} />
                  {p.protocolLabel || `Protocol ${pi + 1}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Custom drug protocol configuration */}
      {row.drugName === 'Other' && (
        <div className="border border-dashed border-border p-2 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="section-label shrink-0 w-7">SPT</span>
            <Input
              className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono"
              placeholder="Neat concentration (e.g. 10mg/mL)..."
              value={row.customSptConcentration || ''}
              onChange={(e) => onUpdate(index, 'customSptConcentration', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="section-label">IDT Dilutions</div>
            {(row.customIdtSteps ?? []).map((step, si) => (
              <div key={si} className="flex items-center gap-1.5">
                <Input
                  className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono"
                  placeholder="Ratio (e.g. 1:100)"
                  value={step.ratio}
                  onChange={(e) => onUpdate(index, `customIdtStep_ratio_${si}`, e.target.value)}
                  aria-label={`${row.drugName} IDT dilution step ${si + 1} ratio`}
                />
                <Input
                  className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono"
                  placeholder="Conc. (e.g. 0.1mg/mL)"
                  value={step.concentration}
                  onChange={(e) => onUpdate(index, `customIdtStep_concentration_${si}`, e.target.value)}
                  aria-label={`${row.drugName} IDT dilution step ${si + 1} concentration`}
                />
                <button
                  type="button"
                  onClick={() => onRemoveCustomIdtStep(index, si)}
                  aria-label={`Remove ${row.drugName} IDT dilution step ${si + 1}`}
                  className="shrink-0 text-muted-foreground/60 hover:text-destructive transition-colors p-2 -m-1 min-h-[44px] min-w-[44px] flex items-center justify-center xl:min-h-0 xl:min-w-0 xl:m-0 xl:p-0.5"
                  title="Remove step"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddCustomIdtStep(index)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[44px] xl:min-h-0 w-fit"
            >
              <Plus className="w-3 h-3" /> Add IDT dilution step
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`challenge-${index}`}
              checked={row.includeInChallenge || false}
              onChange={(e) => onUpdate(index, 'includeInChallenge', e.target.checked.toString())}
              className="w-3.5 h-3.5 accent-primary rounded-none"
            />
            <label htmlFor={`challenge-${index}`} className="text-xs text-muted-foreground cursor-pointer select-none">
              Include in drug challenge
            </label>
          </div>
        </div>
      )}

      {/* Notes */}
      <label htmlFor={`drug-notes-${index}`} className="sr-only">
        {`Notes for ${row.drugName === 'Other' ? (row.customName || 'custom drug') : row.drugName}`}
      </label>
      <Input
        id={`drug-notes-${index}`}
        aria-label={`Notes for ${row.drugName === 'Other' ? (row.customName || 'custom drug') : row.drugName}`}
        className="h-11 xl:h-8 text-xs text-foreground placeholder:text-muted-foreground rounded-none"
        placeholder="Notes..."
        value={row.notes || ''}
        onChange={(e) => onUpdate(index, 'notes', e.target.value)}
      />
    </div>
  );
});

DrugPlanRow.displayName = 'DrugPlanRow';

export const DrugTestGrid: React.FC<DrugTestGridProps> = ({
  testPanel, drugToCategoryMap, onUpdate, onSelectProtocol, onRemove, onAddCustomIdtStep, onRemoveCustomIdtStep,
  variant = 'record', onOpenPlan,
}) => {
  if (testPanel.length === 0) {
    if (variant === 'plan') return null;
    return (
      <div className="bg-card rounded-none border border-dashed border-border">
        <EmptyState
          title="No drugs selected. Choose a category above to begin."
          className="border-0 bg-transparent"
        />
        {onOpenPlan && (
          <div className="pb-5 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenPlan}
              className="min-h-[44px] xl:min-h-0 rounded-none"
            >
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              Open the testing plan
            </Button>
          </div>
        )}
      </div>
    );
  }

  const shared = {
    drugToCategoryMap,
    onUpdate,
    onSelectProtocol,
    onRemove,
    onAddCustomIdtStep,
    onRemoveCustomIdtStep,
    onOpenPlan,
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
      {testPanel.map((row, index) => {
        const allProtocols = getSkinProtocolsForDrug(row.drugName);
        const protocol = allProtocols[row.protocolIndex ?? 0] ?? null;
        const key = row.id || `${row.drugName}-${index}`;
        return variant === 'plan'
          ? <DrugPlanRow key={key} row={row} index={index} protocol={protocol} allProtocols={allProtocols} {...shared} />
          : <DrugRecordRow key={key} row={row} index={index} protocol={protocol} allProtocols={allProtocols} {...shared} />;
      })}
    </div>
  );
};
