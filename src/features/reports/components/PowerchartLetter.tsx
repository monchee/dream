import React from 'react';
import { useRedact } from '../hooks/useRedact';
import { Card, CardContent } from '@/components/ui';
import { LogFormData, Patient } from '@shared/types';
import { formatDate, getPositiveResults, getNegativeResults } from '@shared/utils';
import { getCrossSensitizationNotes, getCrossSensitizedDrugs, buildRecommendations } from '@shared/utils/testingUtils';
import {
  calculateMinutesAfterInduction,
  formatSymptomsList,
  formatTreatmentList,
  getOutcomeText,
  formatTryptaseSentence,
} from '@shared/utils/reportExporter';
import { ReportPrintIdentity } from './ReportPrintIdentity';

interface PowerchartLetterProps {
  data: LogFormData;
  patient: Patient | null;
  activeReportSavedAt?: number | null;
}

// Re-export for backward compatibility with any direct imports
export { generateLetterText } from '@shared/utils/reportExporter';

const PowerchartLetter: React.FC<PowerchartLetterProps> = ({ data, patient, activeReportSavedAt }) => {
  const { redact } = useRedact();
  const posResults = getPositiveResults(data);
  const negResults = getNegativeResults(data);
  const crossNotes = getCrossSensitizationNotes(posResults);
  const crossSensitized = getCrossSensitizedDrugs(posResults);
  const { avoidList, bullets, noAllergyMessage } = buildRecommendations(posResults, crossSensitized);

  const fullName = `${data.firstName} ${data.lastName}`;
  const redactedFullName = redact(fullName);
  const firstName = data.firstName;
  const testingDate = data.visitDate ? formatDate(data.visitDate) : '[date]';
  const reportDate = activeReportSavedAt ? new Date(activeReportSavedAt).toISOString() : new Date().toISOString();

  return (
    <Card className="overflow-hidden print:overflow-visible print:shadow-none print:border-none print:bg-white">
      <ReportPrintIdentity
        patientName={redactedFullName}
        mrn={redact(data.mrn)}
        dob={patient?.dob}
        reportTitle="Powerchart Letter"
        requestDate={reportDate}
      />

      {/* Minimal Accent Header */}
      <div className="border border-border bg-muted p-4 md:p-6 print:bg-white print:border-none print:p-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground print:text-black">Anaesthetic Allergy Clinic</h2>
            <p className="text-sm text-muted-foreground mt-1">Department of Clinical Immunology & Allergy</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Testing Date</p>
            <p className="text-sm font-semibold text-foreground">{testingDate}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 md:p-8 lg:p-12 space-y-8 print:p-2 print:space-y-1.5">
        {/* Patient Details */}
        <div className="bg-muted border border-border rounded-none p-4 print:bg-white print-rule">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 print:grid-cols-2 print:gap-2">
          <div>
            <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Patient Name</p>
            <p className="text-xl font-semibold tracking-tight text-primary print:text-base print:text-black">{redactedFullName}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">REDCap ID</p>
            <p className="text-lg font-mono font-medium text-foreground/80 print:text-xs">{redact(data.mrn)}</p>
          </div>
          {patient?.redcapId && patient.redcapId !== data.mrn && (
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">REDCap Record ID (secondary)</p>
              <p className="text-lg font-mono font-medium text-foreground/80 print:text-xs">{redact(patient.redcapId)}</p>
            </div>
          )}
          {patient && patient.id !== 'manual' && (
            <>
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Date of Reaction</p>
                <p className="text-foreground/80 font-medium print:text-xs">{formatDate(patient.history.date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Hospital</p>
                <p className="text-foreground/80 font-medium print:text-xs">{patient.history.hospital || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Operation</p>
                <p className="text-foreground/80 font-medium print:text-xs">{patient.history.procedure}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Procedure Outcome</p>
                <p className="text-foreground/80 font-medium print:text-xs capitalize">{getOutcomeText(patient)}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider print:text-[9px]">Testing Date</p>
            <p className="text-foreground/80 font-medium print:text-xs">{testingDate}</p>
          </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="section-card bg-card border border-border rounded-none p-4 space-y-4 text-sm leading-relaxed text-foreground/90 print:bg-white print-rule print:p-2 print:text-xs print:space-y-1.5">
          <div className="max-w-prose space-y-4 print:space-y-1.5">
          {patient && patient.id !== 'manual' && (
            <p>
              {fullName} presented to {patient.history.hospital || '[hospital]'} for a {patient.history.procedure?.toLowerCase() || '[procedure]'} on the {formatDate(patient.history.date)}.
              {' '}Approximately {calculateMinutesAfterInduction(patient)} after induction, {firstName} developed signs concerning for anaphylaxis.
              {' '}These were {formatSymptomsList(patient)}.
              {' '}{firstName} was treated with {formatTreatmentList(patient)} and the operation was {getOutcomeText(patient)}.
            </p>
          )}

          {/* Tryptase sentence (3A) — always rendered; defaults to "not obtained" */}
          <p className="italic text-foreground/80">
            {formatTryptaseSentence(data.tryptase)}
          </p>

          <p>
            {firstName} presented to the RPA ANZAAG Allergy Clinic on {testingDate}, for Skin Prick (SPT) and Intradermal (IDT) allergy testing. The following agents were tested:
          </p>

          {/* Drug list — names only, no measurements (3B) */}
          {data.testPanel && data.testPanel.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              {data.testPanel.map((row, i) => {
                const drugName = row.drugName === 'Other' ? (row.customName || 'Other') : row.drugName;
                return <li key={i}>{drugName}</li>;
              })}
            </ul>
          )}
          </div>
        </div>

        {/* Results Summary (3B restyle) */}
        <div className="section-card bg-muted border border-border rounded-none p-4 space-y-4 print:bg-white print-rule print:p-1.5 print:space-y-1">
          <h3 className="font-bold text-sm uppercase tracking-wider border-b-2 border-primary pb-2 text-foreground print:text-xs print:pb-0.5">Results</h3>
          {posResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider font-bold text-status-danger print:text-[9px]">Positive</p>
              {posResults.map((drug, i) => (
                // impeccable-disable-next-line side-tab
                <div key={i} className="border border-status-danger/30 bg-card p-3 rounded-none print:bg-white print:border-l-4 print:border-black print:p-2">
                  <span className="font-bold text-status-danger uppercase text-sm print:text-xs print:text-black">{drug}</span>
                  <span className="text-status-danger text-sm font-semibold print:text-xs print:text-black">: Positive</span>
                </div>
              ))}
            </div>
          )}
          {/* Cross-sensitization notes (3C) */}
          {crossNotes.length > 0 && (
            <div className="space-y-1 pt-1">
              {crossNotes.map((note, i) => (
                <p key={i} className="text-sm italic text-foreground/80 print:text-xs">{note}</p>
              ))}
            </div>
          )}
          {negResults.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1 print:text-[9px]">Negative</p>
              <ul className="space-y-1">
                {negResults.map((drug, i) => (
                  <li key={i} className="text-foreground/80 text-sm print:text-xs">{drug}: negative</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* IV Challenge (3E) */}
        {data.proceedToChallenge && (
          <div className="section-card bg-muted border border-border rounded-none p-4 print:bg-white print-rule print:p-1.5">
            <h3 className="font-bold text-sm uppercase tracking-wider border-b-2 border-primary pb-2 mb-3 text-foreground print:text-xs print:pb-0.5 print:mb-1">Drug Challenge</h3>
            <p className="text-sm print:text-xs">
              {(() => {
                const cName = data.challengeDrug === 'Other' ? (data.challengeDrugCustom || 'Other') : data.challengeDrug;
                if (data.outcome === 'SUCCESS') return `Drug challenge with ${cName} — tolerated.`;
                if (data.outcome === 'UNSUCCESS') {
                  const syms = data.symptoms.map(s => s === 'Other' ? `Other (${data.symptomsOther})` : s).join(', ');
                  const intv = data.interventionType === 'Other' ? `Other: ${data.interventionOther}` : data.interventionType;
                  return `Drug challenge with ${cName} — reaction at ${data.reactionTime} minutes; symptoms: ${syms}; treated with: ${intv}.`;
                }
                return `Drug challenge with ${cName} — outcome not recorded.`;
              })()}
            </p>
          </div>
        )}

        {/* Recommendations (3D) */}
        <div className="section-card bg-muted border border-border rounded-none p-4 space-y-3 print:bg-white print-rule print:p-1.5 print:space-y-1">
          <h3 className="font-bold text-sm uppercase tracking-wider border-b-2 border-primary pb-2 text-foreground print:text-xs print:pb-0.5">Recommendations</h3>
          {noAllergyMessage ? (
            <p className="text-foreground/80 text-sm print:text-xs">{noAllergyMessage}</p>
          ) : (
            <>
              <div className="space-y-2">
                {avoidList.map(drug => (
                  <p key={drug} className="font-bold text-status-danger text-sm uppercase print:text-xs print:text-black">AVOID {drug}</p>
                ))}
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 print:text-xs">
                {bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
            </>
          )}
        </div>

        {/* Report Timestamp */}
        {activeReportSavedAt && (
          <div className="text-xs text-muted-foreground pt-4 mt-4 border-t border-border print:text-[9px] print:pt-1 print:mt-1">
            Report generated: {new Date(activeReportSavedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {/* Correspondence details */}
        {patient?.history?.referringEmail && (
          <div className="text-sm print:text-xs text-foreground/80 print:break-inside-avoid">
            <span className="font-semibold">Referrer email: </span>{patient.history.referringEmail}
          </div>
        )}

        {/* MDT Signature */}
        <div className="pt-6 border-t border-border print:pt-1 print:break-inside-avoid">
          <p className="text-sm font-semibold text-foreground/90 print:text-xs">
            Allergy MDT: Dr. D Zalcberg, Dr. A Stoyanov and CNC K. Wells.
          </p>
        </div>

        {/* Print signature lines */}
        <div className="hidden print:flex print:pt-2 justify-between gap-12 print:break-inside-avoid">
          <div className="flex-1 border-t border-black pt-1">
            <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Clinician Signature</p>
          </div>
          <div className="w-32 border-t border-black pt-1">
            <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Date</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerchartLetter;
