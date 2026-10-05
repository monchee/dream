import React from 'react';
import { Badge, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Activity, AlertTriangle, CheckCircle2, FileText, Info, MessageSquare, Syringe } from 'lucide-react';
import { PatientHistory } from '@shared/types';

interface PatientHistoryDetailsProps {
  history: PatientHistory;
}

/**
 * Left column of the reaction history card: suspected agents, reaction
 * summary and comments, clinical features and treatment (plan 003 / F1).
 * Pure rendering.
 */
const PatientHistoryDetails: React.FC<PatientHistoryDetailsProps> = ({ history }) => {
  return (
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
            {history.reactionSummary || 'No summary provided.'}
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
  );
};

export default PatientHistoryDetails;
