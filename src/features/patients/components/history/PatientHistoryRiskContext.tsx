import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HighRiskContextChips } from '../HighRiskContextChips';

interface PatientHistoryRiskContextProps {
  highRiskChips: string[];
  checklistItems: ReadonlyArray<{ state: 'pass' | 'warning' | 'unknown'; label: string; icon: typeof CheckCircle2 }>;
}

/**
 * Risk context row and the referral-information checklist of the reaction
 * history card (plan 003 / F1). Pure rendering.
 */
const PatientHistoryRiskContext: React.FC<PatientHistoryRiskContextProps> = ({
  highRiskChips,
  checklistItems,
}) => {
  return (
    <>
      <HighRiskContextChips
        chips={highRiskChips}
        className="border border-status-warning/30 bg-status-warning/10 px-3 py-2"
      />

      <section aria-labelledby="referral-checklist-heading" className="border border-border bg-muted/20 px-3 py-2.5">
        <h3 id="referral-checklist-heading" className="section-label mb-2">Referral information</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2">
          {checklistItems.map(item => {
            const ItemIcon = item.icon;
            const stateClass = item.state === 'pass'
              ? 'text-status-success'
              : item.state === 'warning'
                ? 'text-status-warning'
                : 'text-muted-foreground';

            return (
              <li key={item.label} data-state={item.state} className={`flex items-start gap-1.5 text-xs font-medium leading-4 ${stateClass}`}>
                <ItemIcon className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
};

export default PatientHistoryRiskContext;
