import React from 'react';
import { Clock, Flag, FlaskConical, MonitorCheck } from 'lucide-react';
import { PatientHistory } from '@shared/types';
import { TimelineEvent } from '@shared/utils';
import { formatTimeHHmm, getOutcomeConfig, getTryptasePeak } from './patientHistoryUtils';

interface PatientHistoryTimelineProps {
  history: PatientHistory;
  sortedEvents: TimelineEvent[];
  untimedAdministered: string[];
  elapsedLabel: string | null;
  onToggleSuspectedAgent: (drugName: string) => void;
}

/**
 * Right column of the reaction history card: key times, the medication
 * timeline, untimed agents, procedure outcome, and the serum tryptase table
 * (plan 003 / F1). Pure rendering; suspect-agent toggling is owned by the
 * parent.
 */
const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({
  history,
  sortedEvents,
  untimedAdministered,
  elapsedLabel,
  onToggleSuspectedAgent,
}) => {
  const outcomeConfig = getOutcomeConfig(history.procedureOutcome);
  const OutcomeIcon = outcomeConfig.icon;
  const tryptasePeak = getTryptasePeak(history.tryptases);

  return (
    <div className="lg:col-span-5 flex flex-col gap-5">
      <div className="space-y-2">
        <div className="section-label flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary dark:text-primary" />
          Timeline &amp; Medications
        </div>
        {/* Removed overflow-hidden and overflow-y-auto to allow tooltips to display without clipping */}
        <div className="bg-background rounded-none border border-border overflow-visible flex-1 flex flex-col">

          {/* Key Times Header */}
          <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center gap-4 text-xs shrink-0 rounded-none">
            <div className="flex items-center gap-1.5">
              <span className="section-label">Induction:</span>
              <span className="font-mono font-semibold text-primary dark:text-primary text-xs">
                {formatTimeHHmm(history.inductionTime)}
              </span>
            </div>
            {elapsedLabel && (
              <span className="font-mono text-xs font-medium text-muted-foreground">{elapsedLabel}</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="section-label">Reaction:</span>
              <span className="font-mono font-bold text-status-danger text-xs">
                {formatTimeHHmm(history.reactionTime)}
              </span>
            </div>
          </div>

          {/* Timeline Area */}
          <div className="p-4">
            {sortedEvents.length > 0 ? (
              <div className="relative border-l-2 border-border ml-1.5 space-y-4">
                {sortedEvents.map((event, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute top-0.5 rounded-full border-2 z-10
                        ${event.type === 'reaction'
                          ? 'h-4 w-4 -left-[8px] bg-status-danger border-white dark:border-border ring-2 ring-status-danger/30'
                          : event.type === 'induction'
                          ? 'h-3.5 w-3.5 -left-[7px] bg-primary border-white dark:border-border'
                          : 'h-2.5 w-2.5 -left-[5px] bg-muted-foreground/40 dark:bg-muted/60 border-white dark:border-border'}`}
                    />

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {event.type === 'induction' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-primary dark:text-primary">
                                {event.label}
                              </span>
                              <MonitorCheck className="h-3.5 w-3.5 text-primary opacity-70" />
                            </div>
                          ) : event.type === 'reaction' ? (
                            <span className="font-bold text-xs text-status-danger">
                              {event.label}
                            </span>
                          ) : event.type === 'med' ? (
                            <button
                              type="button"
                              onClick={() => onToggleSuspectedAgent(event.label)}
                              aria-pressed={history.suspectedAgents.includes(event.label)}
                              aria-label={`${history.suspectedAgents.includes(event.label) ? 'Unmark' : 'Mark'} ${event.label} as suspected culprit agent`}
                              className={`inline-flex items-center gap-1 border px-2 py-1 text-xs font-semibold transition-colors ${
                                history.suspectedAgents.includes(event.label)
                                  ? 'border-status-danger/30 bg-status-danger/10 text-status-danger'
                                  : 'border-border bg-muted/40 text-foreground hover:border-primary/50 hover:text-primary'
                              }`}
                            >
                              {history.suspectedAgents.includes(event.label) && <Flag className="h-3 w-3 fill-current" aria-hidden="true" />}
                              {event.label}
                            </button>
                          ) : (
                            <span className="font-semibold text-xs text-foreground">{event.label}</span>
                          )}
                        </div>
                        <span className={`font-mono text-xs font-bold ${
                          event.type === 'reaction' ? 'text-status-danger' :
                          event.type === 'induction' ? 'text-primary dark:text-primary' :
                          'text-muted-foreground'
                        }`}>
                          {formatTimeHHmm(event.time)}
                        </span>
                      </div>
                      {event.type === 'induction' && history.anaesthesiaType && history.anaesthesiaType.length > 0 && (
                        <div className="text-xs opacity-80 text-muted-foreground">{history.anaesthesiaType.join(', ')}</div>
                      )}
                      {event.subtext && event.type !== 'reaction' && event.type !== 'induction' && (
                        <div className="text-xs opacity-80 text-muted-foreground">{event.subtext}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4 text-xs">No timed events.</div>
            )}
          </div>

          {/* Untimed Agents Section */}
          {untimedAdministered.length > 0 && (
            <div className="border-t border-border px-3 py-3 bg-muted/50">
              <p className="section-label mb-2">Agents with no listed time</p>
              <div className="flex flex-wrap gap-1.5">
                {untimedAdministered.map((drug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onToggleSuspectedAgent(drug)}
                    aria-pressed={history.suspectedAgents.includes(drug)}
                    aria-label={`${history.suspectedAgents.includes(drug) ? 'Unmark' : 'Mark'} ${drug} as suspected culprit agent`}
                    className={`inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      history.suspectedAgents.includes(drug)
                        ? 'border-status-danger/30 bg-status-danger/10 text-status-danger'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {history.suspectedAgents.includes(drug) && <Flag className="h-3 w-3 fill-current" aria-hidden="true" />}
                    {drug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outcome Footer */}
          <div className="bg-muted/50 border-t border-border px-4 py-2 flex items-center justify-between shrink-0 rounded-none">
            <span className="section-label">Outcome</span>
            <div className={`font-bold text-xs flex items-center gap-1.5 ${outcomeConfig.color}`}>
              <OutcomeIcon className="h-3.5 w-3.5" />
              {outcomeConfig.text}
            </div>
          </div>

        </div>
      </div>

      {/* 4. Serum Tryptase (Moved to Right Column per P1-a) */}
      {history.tryptases && history.tryptases.length > 0 && (
        <div className="space-y-2">
          <div className="section-label flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-primary dark:text-primary" />
            Serum Tryptase
          </div>
          <div className="bg-background rounded-none border border-border overflow-hidden">
            <table className="w-full text-left text-xs" aria-label="Serum Tryptase samples">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold uppercase tracking-wider">Sample</th>
                  <th scope="col" className="px-3 py-2 font-semibold uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-3 py-2 font-semibold uppercase tracking-wider">Result <span className="normal-case">(μg/L)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.tryptases.map((sample, index) => {
                  const isPeak = history.tryptases!.length >= 2 && tryptasePeak?.index === index;
                  return (
                    <tr key={`${sample.time ?? 'no-time'}-${sample.result}-${index}`} className={isPeak ? 'bg-primary/5 font-semibold' : undefined}>
                      <th scope="row" className="px-3 py-2 font-semibold text-foreground">
                        T{index + 1}
                      </th>
                      <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                        {formatTimeHHmm(sample.time)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-foreground">
                        <span>{sample.result}</span>
                        {isPeak && (
                          <span className="ml-2 inline-flex items-center border border-primary/30 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                            Peak
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistoryTimeline;
