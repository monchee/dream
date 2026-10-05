import React from 'react';
import { useRedact } from '../hooks/useRedact';
import { Card, CardContent } from '@/components/ui';
import { LogFormData } from '@shared/types';
import { formatDate, getPositiveResults, getNegativeResults } from '@shared/utils';
import { getCrossSensitizedDrugs, buildRecommendations } from '@shared/utils/testingUtils';
import { Ban, ShieldCheck } from 'lucide-react';
import { ReportPrintIdentity } from './ReportPrintIdentity';

interface PatientHandoutProps {
  data: LogFormData;
  activeReportSavedAt?: number | null;
}

const PatientHandout = ({ data, activeReportSavedAt }: PatientHandoutProps) => {
  const { redact } = useRedact();
  const patientName = redact(`${data.firstName} ${data.lastName}`);
  const reportDate = activeReportSavedAt ? new Date(activeReportSavedAt).toISOString() : new Date().toISOString();
  const posResults = getPositiveResults(data);
  const negResults = getNegativeResults(data);
  const crossSensitized = getCrossSensitizedDrugs(posResults);
  const { avoidList } = buildRecommendations(posResults, crossSensitized);

  return (
    <Card className="overflow-hidden print:overflow-visible print:shadow-none print:border-none">
        <ReportPrintIdentity
          patientName={patientName}
          mrn={redact(data.mrn)}
          dob={data.dob}
          reportTitle="Allergy Testing Results"
          requestDate={reportDate}
        />

        {/* Minimal Accent Header */}
        <div className="border border-border bg-muted p-4 md:p-6 print:bg-white print:border-none print:p-2">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground print:text-black">Allergy Testing Results</h2>
            <p className="text-sm text-muted-foreground mt-1">Patient Information Handout</p>
          </div>
        </div>

        <CardContent className="p-4 md:p-8 lg:p-12 space-y-8 print:p-3 print:space-y-2">
           
           {/* Header Info */}
            <div className="section-card bg-muted border border-border rounded-none p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:bg-white print-rule print:p-2">
               <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider print:text-[9px]">Patient Name</p>
                  <p className="text-xl font-semibold tracking-tight text-primary print:text-sm print:text-black">{patientName}</p>
               </div>
               <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider print:text-[9px]">Date of Birth</p>
                  <p className="text-lg font-medium print:text-sm">{data.dob ? redact(formatDate(data.dob)) : 'Not recorded'}</p>
               </div>
               <div className="sm:text-right print:text-right">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider print:text-[9px]">Date</p>
                  <p className="text-lg font-medium print:text-sm">{formatDate(data.visitDate)}</p>
               </div>
            </div>

           {/* Positive Results */}
            <div className="section-card">
               <h3 className="text-status-danger font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b-2 border-status-danger flex items-center gap-2 print:text-xs print:mb-1 print:pb-1 print:text-black print:border-black">
                  <Ban className="w-5 h-5 print:w-3 print:h-3" /> Drugs to avoid
               </h3>
              {avoidList.length > 0 ? (
                 <ul className="space-y-3 print:space-y-1">
                    {avoidList.map((drugName, idx) => (
                        // impeccable-disable-next-line side-tab
                        <li key={idx} className="avoid-entry bg-status-danger/10 border border-status-danger/30 p-4 rounded-none flex justify-between items-center print:bg-white print:border-black print:border-l-8 print:p-1.5 print:text-xs">
                           <div>
                             <span className="font-semibold text-foreground text-lg print:text-xs print:text-black print:font-bold">{drugName}</span>
                             {crossSensitized.includes(drugName) && (
                               <p className="text-xs text-status-danger mt-0.5 print:text-[9px] print:text-black">cross-sensitization risk</p>
                             )}
                           </div>
                           <span className="bg-status-danger text-status-danger-foreground text-xs font-semibold px-2 py-1 rounded-none print:bg-black print:text-white print:px-2 print:py-1 print:text-[10px] print:tracking-wider">AVOID</span>
                        </li>
                    ))}
                 </ul>
              ) : (
                 <p className="text-muted-foreground italic p-4 bg-muted/30 dark:bg-muted/20 rounded-none border border-border print:p-2 print:text-xs">No positive reactions recorded today.</p>
              )}
            </div>

           {/* Negative Results */}
            <div className="section-card">
               <h3 className="text-status-success font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b-2 border-status-success flex items-center gap-2 print:text-xs print:mb-1 print:pb-1 print:text-black print:border-black">
                  <ShieldCheck className="w-5 h-5 print:w-3 print:h-3" /> Drugs tolerated
               </h3>
              {negResults.length > 0 ? (
                 <ul className="space-y-3 print:space-y-1">
                    {negResults.map((drugName, idx) => (
                        <li key={idx} className="bg-status-success/10 border border-status-success/30 p-4 rounded-none flex justify-between items-center print:bg-white print-rule print:p-1.5 print:text-xs">
                           <span className="font-semibold text-foreground text-lg print:text-xs print:text-black">{drugName}</span>
                           <span className="border border-status-success text-status-success bg-status-success/10 text-xs font-semibold px-2 py-1 rounded-none print:border-black print:text-black print:bg-white print:px-1.5 print:py-0.5 print:text-[9px]">SAFE</span>
                        </li>
                    ))}
                 </ul>
              ) : (
                 <p className="text-muted-foreground italic p-4 bg-muted/30 dark:bg-muted/20 rounded-none border border-border print:p-2 print:text-xs">No negative results recorded.</p>
              )}
            </div>

           {/* Department Info */}
            <div className="section-card bg-muted border border-border rounded-none p-4 text-sm space-y-2 print:bg-white print-rule print:p-2 print:space-y-0.5 print:text-xs">
               <h3 className="font-semibold text-primary mb-2 uppercase text-xs tracking-wider print:text-[10px] print:mb-1 print:text-black">Contact Information</h3>
               <p className="font-semibold dark:text-foreground/90 print:text-xs">Department of Clinical Immunology & Allergy</p>
              <p className="dark:text-foreground/80 print:text-xs">Royal Prince Alfred Hospital</p>
              <p className="dark:text-foreground/80 print:text-xs">Clinic location: Level 5, Gloucester House</p>
              <p className="dark:text-foreground/80 print:text-xs">Phone: (02) 9515 7586</p>
              <p className="dark:text-foreground/80 print:text-xs">Email: SLHD-RPA-ClinicalImmunology@health.nsw.gov.au</p>
              <p className="pt-2 text-muted-foreground italic print:pt-1 print:text-xs max-w-prose">If you have any questions about these results, please contact the clinic.</p>
            </div>

            <div className="section-card bg-status-info/10 dark:bg-status-info/20 border border-status-info/30 dark:border-status-info/30 rounded-none p-4 text-center text-sm print:bg-white print-rule print:text-xs">
               <p className="text-foreground/80">This report summarises your skin and/or challenge tests performed today.</p>
               <p className="font-semibold text-foreground mt-2 print:mt-1">Please provide this document to your anaesthetist before any future surgery.</p>
            </div>

        {/* Report Timestamp */}
        {activeReportSavedAt && (
          <div className="text-xs text-muted-foreground pt-4 mt-4 border-t border-border print:text-[9px] print:pt-2 print:mt-2">
            Report generated: {new Date(activeReportSavedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        </CardContent>
    </Card>
  );
};

export default PatientHandout;
