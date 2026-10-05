
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { History, Building2, AlertCircle, CheckCircle2, HelpCircle, Phone, User } from 'lucide-react';
import { Patient } from '@shared/types';
import { calculateTimeDifference, getOutstandingDocuments, parsePatientTimeline } from '@shared/utils';
import { deriveHighRiskChips } from '@shared/utils/highRiskContext';
import PatientHistoryIdentity from './history/PatientHistoryIdentity';
import PatientHistoryRiskContext from './history/PatientHistoryRiskContext';
import PatientHistoryDetails from './history/PatientHistoryDetails';
import PatientHistoryTimeline from './history/PatientHistoryTimeline';
import { getTryptasePeak, splitGrade } from './history/patientHistoryUtils';

interface PatientHistoryProps {
  patient: Patient;
  onToggleSuspectedAgent: (drugName: string) => void;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patient, onToggleSuspectedAgent }) => {
  const { history } = patient;
  const highRiskChips = deriveHighRiskChips(history);

  const { label: gradeLabel, description: gradeDesc } = splitGrade(history.grade);

  // Use centralized parsing logic
  const { events: sortedEvents, untimedMedications: untimedAdministered } = useMemo(() =>
    parsePatientTimeline(history),
  [history]);

  const doctorName = history.referringDoctor || history.anaesthetist || 'Unknown';

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

  const checklistItems: Array<{ state: 'pass' | 'warning' | 'unknown'; label: string; icon: typeof CheckCircle2 }> = [
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
  ];

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
        <PatientHistoryIdentity
          date={history.date}
          procedure={history.procedure}
          tryptaseChipText={tryptaseChipText}
          hasTryptaseData={Boolean(history.tryptases?.length || history.tryptase)}
          gradeLabel={gradeLabel}
          gradeDesc={gradeDesc}
          grade={history.grade}
        />

        <PatientHistoryRiskContext highRiskChips={highRiskChips} checklistItems={checklistItems} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN (Details) */}
          <PatientHistoryDetails history={history} />

          {/* RIGHT COLUMN (Timeline & Lab Data) */}
          <PatientHistoryTimeline
            history={history}
            sortedEvents={sortedEvents}
            untimedAdministered={untimedAdministered}
            elapsedLabel={elapsedLabel}
            onToggleSuspectedAgent={onToggleSuspectedAgent}
          />

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
            <div className="font-medium text-foreground text-sm">{history.hospital || 'Unknown'}</div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default React.memo(PatientHistory);
