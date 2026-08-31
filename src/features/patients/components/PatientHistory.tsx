
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Patient } from '@shared/types';
import { Activity, Syringe, FileText, History, Clock, Building2, AlertTriangle, User, Phone, CheckCircle2, AlertCircle, HelpCircle, Info, MessageSquare, MonitorCheck, FlaskConical, Flag } from 'lucide-react';
import { formatDate, getGradeVariant, parsePatientTimeline, calculateTimeDifference, getOutstandingDocuments } from '@shared/utils';
import { deriveHighRiskChips } from '@shared/utils/highRiskContext';
import { HighRiskContextChips } from './HighRiskContextChips';

interface PatientHistoryProps {
  patient: Patient;
  onToggleSuspectedAgent: (drugName: string) => void;
}

type TryptaseSample = NonNullable<Patient['history']['tryptases']>[number];

function getTryptasePeak(samples?: TryptaseSample[]): { index: number; value: number; display: string } | null {
  if (!samples?.length) return null;

  return samples.reduce<{ index: number; value: number; display: string } | null>((peak, sample, index) => {
    const value = parseFloat(sample.result);
    if (Number.isNaN(value)) return peak;
    if (!peak || value > peak.value) {
      return { index, value, display: String(value) };
    }
    return peak;
  }, null);
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patient, onToggleSuspectedAgent }) => {
  const { history } = patient;
  const highRiskChips = deriveHighRiskChips(history);

  const formatTime = (time?: string) => {
    if (!time) return "--:--";
    const parts = time.split(':');
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return time;
  };

  const splitGrade = (grade: string) => {
    if (!grade) return { label: "Ungraded", description: "No grade recorded" };
    const parts = grade.split(' - ');
    const label = parts[0];
    const description = parts.slice(1).join(' - ');
    return { label, description: description || label };
  };

  const { label: gradeLabel, description: gradeDesc } = splitGrade(history.grade);

  // Use centralized parsing logic
  const { events: sortedEvents, untimedMedications: untimedAdministered } = useMemo(() => 
    parsePatientTimeline(history), 
  [history]);

  const getOutcomeConfig = (outcome?: string) => {
      if (!outcome) return { text: "Not recorded", color: "text-muted-foreground", icon: HelpCircle };
      const lower = outcome.toLowerCase();
      if (lower.includes('completed') || lower === '2') return { text: "Completed", color: "text-status-success", icon: CheckCircle2 };
      if (lower.includes('abandoned') || lower.includes('adandoned') || lower === '1') return { text: "Abandoned", color: "text-status-danger", icon: AlertCircle };
      return { text: outcome, color: "text-foreground", icon: HelpCircle };
  };

  const outcomeConfig = getOutcomeConfig(history.procedureOutcome);
  const OutcomeIcon = outcomeConfig.icon;

  const doctorName = history.referringDoctor || history.anaesthetist || "Unknown";

  const elapsedMinutes = calculateTimeDifference(history.inductionTime, history.reactionTime);
  const elapsedLabel = elapsedMinutes !== null
    ? (elapsedMinutes < 60 ? `+${elapsedMinutes}m` : `+${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`)
    : null;
  const tryptasePeak = getTryptasePeak(history.tryptases);
  const tryptaseChipText = history.tryptases?.length
    ? history.tryptases.length === 1
      ? `T1${history.tryptases[0].time ? ` (${history.tryptases[0].time})` : ''}: ${history.tryptases[0].result}`
      : tryptasePeak
        ? `peak ${tryptasePeak.display} μg/L`
        : `${history.tryptases.length} samples`
    : history.tryptase;

  const hasTryptaseSamples = Boolean(history.tryptases?.length);
  const hasExposureData = sortedEvents.length > 0 || untimedAdministered.length > 0;
  const outstandingDocuments = getOutstandingDocuments(history.documentsToChase);
  const outstandingDocumentLabels = outstandingDocuments.map(document => {
    switch (document) {
      case 'tryptases': return 'tryptase';
      case 'anaestheticChart': return 'anaesthetic chart';
      case 'other': return 'other documents';
    }
  });
  const chartUploadStatus = history.uploadedDocs?.anaestheticChart;

  const checklistItems = [
    hasTryptaseSamples
      ? { state: 'pass', label: 'Tryptase recorded', icon: CheckCircle2 }
      : { state: 'warning', label: 'Tryptase not recorded — check with referrer', icon: AlertCircle },
    hasExposureData
      ? { state: 'pass', label: 'Timed medication exposures present', icon: CheckCircle2 }
      : { state: 'warning', label: 'No timed exposures recorded', icon: AlertCircle },
    outstandingDocuments.length === 0
      ? { state: 'pass', label: 'No documents outstanding', icon: CheckCircle2 }
      : { state: 'warning', label: `Documents outstanding: ${outstandingDocumentLabels.join(', ')}`, icon: AlertCircle },
    chartUploadStatus === true
      ? { state: 'pass', label: 'Anaesthetic chart uploaded', icon: CheckCircle2 }
      : chartUploadStatus === false
        ? { state: 'warning', label: 'Anaesthetic chart not uploaded', icon: AlertCircle }
        : { state: 'unknown', label: 'Anaesthetic chart upload status not tracked in this export', icon: HelpCircle },
  ] as const;

  return (
    <Card elevation="raised" className="bg-card">
      <CardHeader bordered className="bg-muted/30 dark:bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="bg-primary/15 dark:bg-primary/20 p-1.5 rounded-none">
            <History className="h-4 w-4 text-primary dark:text-primary" />
          </div>
          Reaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        
        {/* Header Information Box */}
        <div className="mt-2 bg-background p-4 rounded-none border border-border flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="font-semibold text-foreground text-base tracking-tight">
                {formatDate(history.date)}
            </span>
            <span aria-hidden="true" className="hidden sm:inline-block h-4 w-px bg-border" />
            <span className="text-base text-primary dark:text-primary font-semibold uppercase tracking-wider leading-tight break-words">
                {history.procedure || "Procedure not recorded"}
            </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {(history.tryptases?.length || history.tryptase) && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 px-2.5 py-1 rounded-none">
                        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-semibold uppercase tracking-wide text-xs">Tryptase:</span>
                        <span>{tryptaseChipText}</span>
                    </div>
                )}
                {gradeDesc && gradeDesc !== gradeLabel ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="rounded-none cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                aria-label={`Severity grading: ${gradeLabel}. View grading criteria.`}
                            >
                                <Badge variant={getGradeVariant(history.grade)} className="whitespace-nowrap">
                                    {gradeLabel}
                                </Badge>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-left p-3" sideOffset={4}>
                            <p className="font-bold mb-1 text-foreground border-b border-border pb-1">{gradeLabel}</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">{gradeDesc}</p>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <Badge variant={getGradeVariant(history.grade)} className="whitespace-nowrap">
                        {gradeLabel}
                    </Badge>
                )}
            </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (Details) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
                
                {/* 1. Suspected Agents */}
                {history.suspectedAgents && history.suspectedAgents.length > 0 ? (
                    <div className="space-y-2">
                        <div className="section-label text-status-danger flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-status-danger shrink-0" />
                            Suspected Culprit Agents
                        </div>
                        <div className="bg-status-danger/10 p-3 rounded-none border border-status-danger/30 flex flex-wrap gap-2 items-center">
                            {history.suspectedAgents.map((agent, i) => (
                                <Badge key={i} variant="danger" className="text-xs px-2.5 py-0.5">{agent}</Badge>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="section-label flex items-center gap-2">
                            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            Suspected Culprit Agents
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Not captured in referral — review the medication timeline below.
                        </p>
                    </div>
                )}

                {/* 2. Reaction Summary & Comments */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="section-label flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-primary dark:text-primary" /> 
                            Reaction Summary
                        </div>
                        <div className="bg-background p-3 rounded-none border border-border text-foreground leading-relaxed text-sm max-w-prose">
                            {history.reactionSummary || "No summary provided."}
                        </div>
                    </div>

                    {history.comments && (
                        <div className="space-y-2">
                            <div className="section-label flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> 
                                Additional Comments
                            </div>
                            <div className="bg-background p-3 rounded-none border border-border text-muted-foreground leading-relaxed text-xs">
                                {history.comments}
                            </div>
                        </div>
                    )}

                    {history.differentialDiagnosis && (
                        <div className="space-y-2">
                            <div className="section-label flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                Differential Diagnosis
                            </div>
                            <div className="bg-background p-3 rounded-none border border-border text-muted-foreground leading-relaxed text-xs">
                                {history.differentialDiagnosis}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Clinical Features & Treatment (Grid 1x2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 h-full">
                        <div className="section-label flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-primary dark:text-primary" /> 
                            Clinical Features
                        </div>
                        <div className="bg-background p-3 rounded-none border border-border flex flex-col gap-3 flex-1">
                            
                            {/* Key Symptom Highlights */}
                            {(history.firstSymptom || history.predominantSymptom) && (
                                <div className="space-y-2 border-b border-border pb-3 mb-1">
                                    {history.firstSymptom && (
                                        <div className="flex flex-col gap-0.5 border-l-2 border-status-warning pl-2">
                                            <span className="section-label text-status-warning">First Sign</span>
                                            <span className="text-foreground font-semibold text-sm leading-tight">{history.firstSymptom}</span>
                                        </div>
                                    )}
                                    {history.predominantSymptom && (
                                        <div className="flex flex-col gap-0.5 border-l-2 border-border pl-2">
                                            <span className="section-label">Predominant</span>
                                            <span className="text-foreground font-semibold text-sm leading-tight">{history.predominantSymptom}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 content-start">
                                {history.symptoms && history.symptoms.length > 0 ? (
                                    history.symptoms.map((s, i) => (
                                        s.detail ? (
                                            <Popover key={i}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-none bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground cursor-pointer hover:border-primary/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                                        aria-label={`${s.label}. View detail.`}
                                                    >
                                                        {s.label}
                                                        <Info className="h-3 w-3 opacity-50 text-primary" aria-hidden="true" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 text-xs p-3" sideOffset={4}>
                                                    {s.detail}
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <span key={i} className="inline-flex items-center rounded-none bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                                {s.label}
                                            </span>
                                        )
                                    ))
                                ) : <span className="text-muted-foreground text-xs">None recorded</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 h-full">
                        <div className="section-label flex items-center gap-2">
                            <Syringe className="h-3.5 w-3.5 text-primary dark:text-primary" /> 
                            Treatment
                        </div>
                        <div className="bg-background p-3 rounded-none border border-border flex-1">
                            {history.treatment && history.treatment.length > 0 ? (
                                <ul className="text-foreground text-xs space-y-1.5">
                                    {history.treatment.map((t, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                            <CheckCircle2 className="h-3 w-3 text-status-grade1 shrink-0 mt-0.5" />
                                            <span>{t}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <span className="text-muted-foreground text-xs">None recorded</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN (Timeline & Lab Data) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="space-y-2">
                    <div className="section-label flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary dark:text-primary" /> 
                        Timeline & Medications
                    </div>
                    {/* Removed overflow-hidden and overflow-y-auto to allow tooltips to display without clipping */}
                    <div className="bg-background rounded-none border border-border overflow-visible flex-1 flex flex-col">
                        
                        {/* Key Times Header */}
                        <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center gap-4 text-xs shrink-0 rounded-none">
                            <div className="flex items-center gap-1.5">
                                <span className="section-label">Induction:</span>
                                <span className="font-mono font-semibold text-primary dark:text-primary text-xs">
                                    {formatTime(history.inductionTime)}
                                </span>
                            </div>
                            {elapsedLabel && (
                                <span className="font-mono text-xs font-medium text-muted-foreground">{elapsedLabel}</span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="section-label">Reaction:</span>
                                <span className="font-mono font-bold text-status-danger text-xs">
                                    {formatTime(history.reactionTime)}
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
                                                        {formatTime(event.time)}
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
                                                    {formatTime(sample.time)}
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

        </div>

        {/* 5. Context Bar (Moved to full-width row below grid per P1-b) */}
        <div className="bg-background p-3 rounded-none border border-border flex flex-col sm:flex-row gap-4">
            <div className="space-y-1 flex-1 min-w-0">
                <span className="section-label flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Referring Doctor
                </span>
                <div className="font-medium text-foreground text-sm break-words leading-snug">
                    {doctorName}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                    {history.referringDoctorPosition && (
                        <span className="font-medium text-muted-foreground">{history.referringDoctorPosition}</span>
                    )}
                    {(history.referringDoctorPosition && (history.providerNumber || history.referringPhone)) && (
                        <span className="text-muted-foreground/60" aria-hidden="true">|</span>
                    )}
                    {history.providerNumber && <span className="opacity-80">#{history.providerNumber}</span>}
                    {history.referringPhone && <span className="opacity-80 flex items-center gap-0.5"><Phone className="h-3.5 w-3.5" /> {history.referringPhone}</span>}
                </div>
            </div>

            <div className="space-y-1 flex-1 min-w-0 sm:border-l sm:border-border sm:pl-4">
                <span className="section-label flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Hospital
                </span>
                <div className="font-medium text-foreground text-sm">{history.hospital || "Unknown"}</div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default React.memo(PatientHistory);
