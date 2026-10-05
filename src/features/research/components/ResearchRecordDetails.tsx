import React from 'react';
import { ResearchRecord } from '../types';
import ResearchDeleteDialog from './ResearchDeleteDialog';

interface ResearchRecordDetailsProps {
  record: ResearchRecord;
  onDelete: () => void;
}

/**
 * The expandable detail panel beneath a research submission row: controls,
 * test panel table, challenge outcome, plan, and the delete control
 * (plan 003 / F1). Delegation of the delete call lives in
 * ResearchDeleteDialog.
 */
const ResearchRecordDetails: React.FC<ResearchRecordDetailsProps> = ({ record, onDelete }) => {
  return (
    <div className="px-4 py-4 bg-muted/30 dark:bg-card/40 border-t border-border space-y-4">
      {/* Controls */}
      <div>
        <p className="section-label mb-1.5">Controls</p>
        <div className="flex flex-wrap gap-4 text-xs text-foreground/85">
          <span>Histamine SPT: <strong className="font-mono text-foreground">{record.histamine_spt || '—'}</strong></span>
          <span>Saline SPT: <strong className="font-mono text-foreground">{record.saline_spt || '—'}</strong></span>
          <span>Saline IDT: <strong className="font-mono text-foreground">{record.saline_idt || '—'}</strong></span>
        </div>
      </div>

      {/* Test Panel */}
      {record.test_panel.length > 0 && (
        <div>
          <p className="section-label mb-1.5">Test panel</p>
          <div className="border border-border overflow-x-auto rounded-none">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Drug', 'SPT', 'IDT Results', 'Result'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {record.test_panel.map((d, i) => (
                  <tr key={i} className={d.is_positive ? 'bg-status-danger/10' : 'hover:bg-muted/30 transition-colors'}>
                    <td className="px-3 py-1.5 font-medium text-foreground">{d.drug_name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground font-mono tabular-nums">{d.spt_wheal || '—'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground font-mono tabular-nums">{d.idt_results || '—'}</td>
                    <td className="px-3 py-1.5">
                      {d.is_positive ? (
                        <span className="text-status-danger font-semibold">Positive</span>
                      ) : (
                        <span className="text-muted-foreground">Negative</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Challenge */}
      {record.proceed_to_challenge && (
        <div>
          <p className="section-label mb-1.5">Challenge test</p>
          <div className="flex flex-wrap gap-4 text-xs text-foreground/85">
            <span>Drug: <strong className="text-foreground">{record.challenge_drug || '—'}</strong></span>
            <span>
              Outcome:{' '}
              <strong
                className={
                  record.challenge_outcome === 'SUCCESS'
                    ? 'text-status-grade1 dark:text-emerald-400 font-semibold'
                    : record.challenge_outcome === 'UNSUCCESS'
                    ? 'text-destructive dark:text-red-400 font-semibold'
                    : 'text-muted-foreground'
                }
              >
                {record.challenge_outcome === 'SUCCESS' ? 'Pass' : record.challenge_outcome === 'UNSUCCESS' ? 'Fail' : '—'}
              </strong>
            </span>
            {record.reaction_time && (
              <span>
                Reaction time: <strong className="font-mono text-foreground">{record.reaction_time}</strong>
              </span>
            )}
            {record.intervention_type && (
              <span>
                Intervention: <strong className="text-foreground">{record.intervention_type}</strong>
              </span>
            )}
          </div>
          {record.symptoms.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              Symptoms: {record.symptoms.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Plan */}
      {record.plan && (
        <div>
          <p className="section-label mb-1">Plan</p>
          <p className="text-xs text-foreground/85 whitespace-pre-wrap">{record.plan}</p>
        </div>
      )}

      {/* Delete */}
      <ResearchDeleteDialog recordId={record.id} onDeleted={onDelete} />
    </div>
  );
};

export default ResearchRecordDetails;
