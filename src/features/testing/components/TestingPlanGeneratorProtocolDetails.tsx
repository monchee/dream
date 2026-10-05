import React from 'react';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { DrugProtocol } from '@features/testing/types';
import { resolveSelectedProtocol, type ProtocolResolution } from '@shared/utils/protocolResolver';
import { ProtocolDoseTable } from './ProtocolDoseTable';

interface ProtocolChoice {
  drug: string;
  protocols: DrugProtocol[];
}

interface SelectedListedDrug {
  drug: string;
  protocols: DrugProtocol[];
  resolution: ProtocolResolution;
}

interface ProtocolChoicesSectionProps {
  protocolChoices: ProtocolChoice[];
  selectedProtocols: Record<string, number>;
  updateSelectedProtocol: (drug: string, protocolIndex: number) => void;
}

/**
 * The "Protocol Choices" selector grid of the testing plan builder. Rendered
 * between drug selection and Additional Items, exactly as before the F1
 * extraction (plan 003). Selection state is owned by the parent.
 */
export const ProtocolChoicesSection: React.FC<ProtocolChoicesSectionProps> = ({
  protocolChoices,
  selectedProtocols,
  updateSelectedProtocol,
}) => {
  if (protocolChoices.length === 0) return null;
  return (
      <div className="col-span-full border border-border bg-muted/30 p-3 space-y-3 rounded-none">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h5 className="section-label">Protocol Choices</h5>
          <span className="text-xs text-muted-foreground tabular-nums">
            {protocolChoices.length} drug{protocolChoices.length === 1 ? '' : 's'} with multiple protocols
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {protocolChoices.map(({ drug, protocols }) => {
            const resolution = resolveSelectedProtocol(protocols, selectedProtocols[drug]);
            const isInvalid = resolution.status === 'invalid';
            const selectValue = resolution.status === 'valid' ? String(resolution.index) : '';
            return (
              <div key={drug} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`protocol-${drug}`} className="text-xs font-medium text-foreground">
                    {drug}
                  </Label>
                  {isInvalid && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-status-danger">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Review required
                    </span>
                  )}
                </div>
                <Select
                  value={selectValue}
                  onValueChange={(value) => updateSelectedProtocol(drug, Number(value))}
                >
                  <SelectTrigger
                    id={`protocol-${drug}`}
                    className={`h-11 xl:h-8 text-xs rounded-none bg-background ${
                      isInvalid ? 'border-status-danger text-status-danger ring-1 ring-status-danger/30' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select protocol (review required)..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {protocols.map((protocol, index) => (
                      <SelectItem key={`${drug}-${index}`} value={String(index)} className="text-xs rounded-none">
                        {protocol.protocolLabel || `Protocol ${index + 1}`}
                        {protocol.presentation ? ` - ${protocol.presentation}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>
  );
};

interface DoseSpecificationsSectionProps {
  selectedListedDrugs: SelectedListedDrug[];
}

/**
 * The "Protocol & Dose Specifications" block of the testing plan builder.
 * Rendered after Additional Items, exactly as before the F1 extraction.
 */
export const DoseSpecificationsSection: React.FC<DoseSpecificationsSectionProps> = ({
  selectedListedDrugs,
}) => {
  if (selectedListedDrugs.length === 0) return null;
  return (
      <div className="col-span-full border border-border bg-muted/20 p-3 space-y-3 rounded-none" data-testid="selected-protocol-details">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-dashed border-border pb-1">
          <h5 className="section-label">Protocol &amp; Dose Specifications</h5>
          <span className="text-xs text-muted-foreground tabular-nums">
            {selectedListedDrugs.length} selected drug{selectedListedDrugs.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          {selectedListedDrugs.map(({ drug, resolution }) => {
            if (resolution.status === 'valid') {
              return <ProtocolDoseTable key={drug} protocol={resolution.protocol!} />;
            }
            if (resolution.status === 'invalid') {
              return (
                <div
                  key={drug}
                  role="alert"
                  aria-live="assertive"
                  className="border border-status-danger bg-status-danger/10 p-3 rounded-none space-y-1 text-status-danger"
                  data-testid={`protocol-review-required-${drug}`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>⚠ {drug} — Protocol selection requires review</span>
                  </div>
                  <p className="text-xs font-normal text-foreground/90 leading-relaxed">
                    Saved protocol selection index is invalid. Please select a valid protocol option in Protocol Choices below.
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
  );
};
