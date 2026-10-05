
import React from 'react';
import { useRedact } from '../hooks/useRedact';
import { Card, CardContent } from '@/components/ui';
import { LogFormData } from '@shared/types';
import { formatDate } from '@shared/utils';
import { getPositiveResults } from '@shared/utils/testingUtils';
import { getCrossSensitizationNotes, getCrossSensitizedDrugs, buildRecommendations } from '@shared/utils/testingUtils';
import { FileText, Activity, History, ClipboardList, ShieldAlert } from 'lucide-react';
import { ReportPrintIdentity } from './ReportPrintIdentity';

interface ClinicalReportProps {
  data: LogFormData;
  activeReportSavedAt?: number | null;
}

const ClinicalReport: React.FC<ClinicalReportProps> = ({ data, activeReportSavedAt }) => {
  const { redact } = useRedact();
  const posResults = getPositiveResults(data);
  const crossNotes = getCrossSensitizationNotes(posResults);
  const crossSensitized = getCrossSensitizedDrugs(posResults);
  const { avoidList, bullets, noAllergyMessage } = buildRecommendations(posResults, crossSensitized);
  const patientName = redact(`${data.firstName} ${data.lastName}`);
  const reportDate = activeReportSavedAt ? new Date(activeReportSavedAt).toISOString() : new Date().toISOString();
  const formatSptResult = (value?: string) => value ? `${value} mm` : '-';
  const controlValue = (value?: string) => (
    <>
      <span className="font-mono tabular-nums">{value || '-'}</span>
      {value && <span className="text-muted-foreground"> mm</span>}
    </>
  );

  const formatSymptoms = (data: LogFormData) => {
    return data.symptoms.map(s => {
      if (s === 'Other') return `Other (${data.symptomsOther})`;
      return s;
    }).join(', ');
  };

  const formatIntervention = (data: LogFormData) => {
    if (data.interventionType === 'Other') return `Other: ${data.interventionOther}`;
    return data.interventionType;
  };

  return (
    <Card className="overflow-hidden print:overflow-visible print:shadow-none print:border-none">
      <ReportPrintIdentity
        patientName={patientName}
        mrn={redact(data.mrn)}
        dob={data.dob}
        reportTitle="Anaesthetic Testing Report"
        requestDate={reportDate}
      />

      {/* Minimal Accent Header */}
      <div className="border border-border bg-muted p-4 md:p-6 print:bg-white print:border-none print:p-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground print:text-black">Anaesthetic Testing Report</h2>
            <p className="text-sm text-muted-foreground mt-1">Clinical Immunology & Allergy · Royal Prince Alfred Hospital</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Generated</p>
            <p className="text-sm font-semibold text-foreground">{activeReportSavedAt ? new Date(activeReportSavedAt).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU')}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 md:p-8 lg:p-12 space-y-8 print:p-3 print:space-y-3">
         
         {/* Patient Details */}
         <div className="section-card bg-muted border border-border rounded-none p-4 print:bg-white print-rule">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 print:grid-cols-2 print:gap-2">
            <div>
               <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1 print:mb-0.5">Patient Name</label>
               <p className="text-xl md:text-2xl font-semibold tracking-tight text-primary print:text-base print:text-black">{patientName}</p>
            </div>
            <div>
               <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1 print:mb-0.5">REDCap ID</label>
               <p className="text-lg font-mono font-medium text-foreground print:text-sm">{redact(data.mrn)}</p>
            </div>
            <div>
               <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1 print:mb-0.5">Date of Birth</label>
               <p className="text-lg font-medium text-foreground print:text-sm">{data.dob ? redact(formatDate(data.dob)) : 'Not recorded'}</p>
            </div>
            <div className="md:col-span-2 print:col-span-2">
               <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1 print:mb-0.5">Visit Date</label>
               <p className="text-lg font-medium text-foreground print:text-sm">{formatDate(data.visitDate)}</p>
            </div>
           </div>
         </div>

         {/* Skin Testing Results */}
         <div className="section-card">
            <h3 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 print:text-xs print:mb-2">
              <Activity className="w-5 h-5 print:w-4 print:h-4" /> Skin & Intradermal Testing
            </h3>
            
            {/* Controls */}
            <div className="bg-muted border border-border rounded-none p-3 text-sm mb-4 print:bg-white print-rule print:p-2 print:mb-2 print:text-xs">
               <div className="font-semibold mb-2 block md:inline md:mr-2">Controls (mm):</div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:inline-flex md:gap-4">
                   <span>Histamine SPT: <strong>{controlValue(data.controls?.histamineSpt)}</strong></span>
                   <span>Saline SPT: <strong>{controlValue(data.controls?.salineSpt)}</strong></span>
                   <span>Saline IDT: <strong>{controlValue(data.controls?.salineIdt)}</strong></span>
               </div>
            </div>
            {!data.controls?.histamineSpt && !data.controls?.salineSpt && !data.controls?.salineIdt && (
              <p className="text-muted-foreground italic text-sm print:text-xs">No controls recorded.</p>
            )}

            {(data.testPanel || []).length > 0 ? (
              <>
                {/* Desktop/Print Table */}
                <div className="hidden md:block print:block">
                  <table className="w-full text-sm text-left border-collapse print:text-xs">
                     <thead>
                        <tr className="border-b-2 border-border text-muted-foreground">
                          <th scope="col" className="py-2 font-semibold print:py-1 print:text-[10px]">Drug Tested</th>
                          <th scope="col" className="py-2 font-semibold print:py-1 print:text-[10px]">SPT</th>
                          <th scope="col" className="py-2 font-semibold print:py-1 print:text-[10px]">IDT Results</th>
                          <th scope="col" className="py-2 font-semibold print:py-1 print:text-[10px]">Notes</th>
                        </tr>
                     </thead>
                     <tbody>
                        {data.testPanel.map((row, i) => (
                          <tr key={i} className="border-b border-border">
                             <td className="py-2 font-medium print:py-1 print:text-xs">
                               {row.drugName === 'Other' ? (row.customName || 'Other') : row.drugName}
                             </td>
                             <td className="py-2 print:py-1 print:text-xs font-mono tabular-nums">{formatSptResult(row.sptWheal)}</td>
                             <td className="py-2 print:py-1 print:text-xs font-mono tabular-nums">
                               {row.idtResults?.length
                                 ? row.idtResults.filter(Boolean).map((v, idx) => `IDT ${idx + 1}: ${v}mm`).join(' / ') || '-'
                                 : [row.idt100 && `1:100: ${row.idt100}mm`, row.idt10 && `1:10: ${row.idt10}mm`, row.idtNeat && `Neat: ${row.idtNeat}mm`].filter(Boolean).join(' / ') || '-'}
                             </td>
                             <td className="py-2 print:py-1 print:text-xs text-muted-foreground">{row.notes || ''}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden print:hidden space-y-3">
                   {data.testPanel.map((row, i) => (
                      <div key={i} className="bg-muted border border-border rounded-none p-4">
                          <div className="font-bold text-foreground mb-3 border-b border-border pb-2">
                             {row.drugName === 'Other' ? (row.customName || 'Other') : row.drugName}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                              <div>
                                 <span className="text-xs text-muted-foreground uppercase font-bold block">SPT</span>
                                 <span className="font-medium font-mono tabular-nums">{formatSptResult(row.sptWheal)}</span>
                              </div>
                              <div>
                                 <span className="text-xs text-muted-foreground uppercase font-bold block">IDT Results</span>
                                 <span className="font-medium font-mono tabular-nums">
                                   {row.idtResults?.length
                                     ? row.idtResults.filter(Boolean).map((v, idx) => `IDT ${idx + 1}: ${v}mm`).join(' / ') || '-'
                                     : [row.idt100 && `1:100: ${row.idt100}mm`, row.idt10 && `1:10: ${row.idt10}mm`, row.idtNeat && `Neat: ${row.idtNeat}mm`].filter(Boolean).join(' / ') || '-'}
                                 </span>
                              </div>
                          </div>
                          {row.notes && (
                              <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">{row.notes}</div>
                          )}
                      </div>
                   ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground italic">No panel testing recorded.</p>
            )}
         </div>

         {/* Challenge Results */}
         <div className="section-card">
            <h3 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 print:text-xs print:mb-2">
              <History className="w-5 h-5 print:w-4 print:h-4" /> Drug Challenge Details
            </h3>
            {data.proceedToChallenge ? (
               <div className={`border p-4 rounded-none bg-card ${data.outcome === 'SUCCESS' ? 'border-status-success print:border-black' : 'border-status-danger print:border-black'} print:bg-white print:p-2`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2 print:mb-1">
                     <span className="font-bold text-lg print:text-sm">
                        {data.challengeDrug === 'Other' ? (data.challengeDrugCustom || 'Other') : data.challengeDrug}
                     </span>
                     <div className={`px-2 py-1 rounded-none text-xs font-bold self-start md:self-auto ${
                       data.outcome === 'SUCCESS'
                         ? 'border border-status-success text-status-success bg-status-success/10 print:border-black print:text-white print:bg-black'
                         : 'bg-status-danger text-status-danger-foreground print:bg-black print:text-white print:border print:border-black'
                     } print:px-1.5 print:py-0.5 print:text-[10px]`}>
                        {data.outcome === 'SUCCESS' ? 'NEGATIVE (Safe)' : 'POSITIVE (Reaction)'}
                     </div>
                  </div>
                  
                  {data.outcome === 'UNSUCCESS' && (
                    <div className="mt-2 text-sm space-y-1 print:mt-1 print:text-xs print:space-y-0.5">
                       <p><span className="font-semibold">Reaction Time:</span> {data.reactionTime} mins</p>
                       <p><span className="font-semibold">Symptoms:</span> {formatSymptoms(data)}</p>
                       <p><span className="font-semibold">Intervention:</span> {formatIntervention(data)}</p>
                    </div>
                  )}
               </div>
            ) : (
               <p className="text-muted-foreground italic print:text-xs">No drug challenge performed.</p>
            )}
         </div>

         {/* Cross-sensitization (3C) */}
         {crossNotes.length > 0 && (
           <div className="section-card space-y-2">
             {crossNotes.map((note, i) => (
               <p key={i} className="text-sm italic text-foreground/90 border border-status-warning/30 bg-status-warning/10 p-3 rounded-none print:border-none print:p-0 print:text-xs">{note}</p>
             ))}
           </div>
         )}

         {/* Recommendations (3D) */}
         <div className="section-card">
           <h3 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 print:text-xs print:mb-2">
             <ShieldAlert className="w-5 h-5 print:w-4 print:h-4" /> Recommendations
           </h3>
           {noAllergyMessage ? (
             <p className="text-sm text-foreground/80 print:text-xs">{noAllergyMessage}</p>
           ) : (
             <div className="space-y-3 print:space-y-1">
               <div className="space-y-2">
                 {avoidList.map(drug => (
                  <p key={drug} className="font-bold text-status-danger text-sm uppercase print:text-xs print:text-black print:font-bold">AVOID {drug}</p>
                 ))}
               </div>
               <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 print:text-xs">
                 {bullets.map(b => <li key={b}>{b}</li>)}
               </ul>
             </div>
           )}
         </div>

         {/* Nursing Notes */}
         <div className="section-card">
         {data.nurseNotes && (data.nurseNotes.preTesting || data.nurseNotes.duringTesting || data.nurseNotes.postTesting || data.nurseNotes.signedBy) && (
           <div>
             <h3 className="text-sm md:text-base font-bold text-status-info uppercase tracking-wider flex items-center gap-2 border-b-2 border-status-info/50 pb-2 mb-4 print:text-xs print:mb-2">
               <ClipboardList className="w-5 h-5 print:w-4 print:h-4" /> Nursing Notes
             </h3>
             <div className="space-y-3 print:space-y-2">
               {data.nurseNotes.preTesting && (
                 <div className="bg-status-info/10 border border-status-info/30 rounded-none p-3 print:bg-white print-rule print:p-2">
                   <p className="text-xs uppercase tracking-wider text-status-info font-semibold mb-1 print:mb-0.5">Pre-Testing</p>
                   <p className="text-sm whitespace-pre-wrap print:text-xs">{data.nurseNotes.preTesting}</p>
                 </div>
               )}
               {data.nurseNotes.duringTesting && (
                 <div className="bg-status-info/10 border border-status-info/30 rounded-none p-3 print:bg-white print-rule print:p-2">
                   <p className="text-xs uppercase tracking-wider text-status-info font-semibold mb-1 print:mb-0.5">During Testing</p>
                   <p className="text-sm whitespace-pre-wrap print:text-xs">{data.nurseNotes.duringTesting}</p>
                 </div>
               )}
               {data.nurseNotes.postTesting && (
                 <div className="bg-status-info/10 border border-status-info/30 rounded-none p-3 print:bg-white print-rule print:p-2">
                   <p className="text-xs uppercase tracking-wider text-status-info font-semibold mb-1 print:mb-0.5">Post-Testing / Discharge</p>
                   <p className="text-sm whitespace-pre-wrap print:text-xs">{data.nurseNotes.postTesting}</p>
                 </div>
               )}
               {data.nurseNotes.signedBy && (
                 <p className="text-sm text-muted-foreground print:text-xs">Signed: <strong>{data.nurseNotes.signedBy}</strong> (RN)</p>
               )}
             </div>
           </div>
         )}
         </div>

         {/* Plan */}
         <div className="section-card pb-4 print:pb-2">
            <h3 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 print:text-xs print:mb-2">
              <FileText className="w-5 h-5 print:w-4 print:h-4" /> Assessment & Plan
            </h3>
            <div className="bg-muted border border-border rounded-none p-4 whitespace-pre-wrap text-sm md:text-base print:bg-white print-rule print:p-2 print:text-xs">
               {data.plan || 'No comments recorded.'}
            </div>
         </div>

         {/* Report Timestamp */}
         {activeReportSavedAt && (
           <div className="text-xs text-muted-foreground pt-4 mt-4 border-t border-border print:text-[9px] print:pt-2 print:mt-2">
             Report generated: {new Date(activeReportSavedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
           </div>
         )}

         {/* Print Footer */}
         <div className="hidden print:block pt-4 border-t border-border mt-4">
            <div className="flex justify-between text-xs">
               <div className="border-t border-black w-40 pt-1">Clinician Signature</div>
               <div className="border-t border-black w-40 pt-1">Date</div>
            </div>
         </div>

      </CardContent>
    </Card>
  );
};

export default ClinicalReport;
