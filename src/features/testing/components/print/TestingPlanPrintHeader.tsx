import React from 'react';
import { Badge } from '@/components/ui';
import { AlertTriangle, FolderSearch, NotebookText } from 'lucide-react';
import { DocumentsToChase, Patient } from '@shared/types';
import { formatDate } from '@shared/utils';

interface TestingPlanPrintHeaderProps {
  patient: Patient;
  urgent: boolean;
  reactionDate?: string;
  documentsToChase?: DocumentsToChase;
  notes?: string;
}

const PrintCheckbox = ({ checked }: { checked: boolean }) => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-current print:border-black text-[8px] shrink-0">
    {checked ? '✓' : ''}
  </span>
);

/**
 * The medication chart header of the printable testing request form: patient
 * identification box, ADR sticker block, urgent banner, department line,
 * documents to chase, and clinical notes (plan 003 / F1). Pure rendering.
 */
const TestingPlanPrintHeader: React.FC<TestingPlanPrintHeaderProps> = ({
  patient,
  urgent,
  reactionDate,
  documentsToChase,
  notes,
}) => {
  const genderLower = patient.gender?.toLowerCase() ?? '';
  const isMale = genderLower.startsWith('m');
  const isFemale = genderLower.startsWith('f');

  return (
    <>
      {/* === MEDICATION CHART HEADER === */}
      <div className="flex border border-border print:border-black print-keep-together">

        {/* Left: Patient identification label box */}
        <div className="flex-1 border-r border-border print:border-black p-2 print:p-1.5 min-w-0">
          <p className="text-[10px] print:text-[9px] font-semibold text-center text-muted-foreground print-muted-ink mb-1.5 print:mb-1">
            Affix patient identification label here
          </p>
          <table className="w-full text-xs print:text-[9px] border-collapse">
            <tbody>
              <tr className="border-t border-border print:border-black">
                <td className="py-0.5 pr-2 font-semibold text-muted-foreground print-ink whitespace-nowrap w-24 print:w-20 align-top">REDCap ID:</td>
                <td className="py-0.5 font-mono text-foreground print:text-black">{patient.mrn}</td>
              </tr>
              <tr className="border-t border-border print:border-black">
                <td className="py-0.5 pr-2 font-semibold text-muted-foreground print-ink whitespace-nowrap align-top">Family name:</td>
                <td className="py-0.5 font-semibold text-foreground print:text-black uppercase">{patient.lastName}</td>
              </tr>
              <tr className="border-t border-border print:border-black">
                <td className="py-0.5 pr-2 font-semibold text-muted-foreground print-ink whitespace-nowrap align-top">Given names:</td>
                <td className="py-0.5 text-foreground print:text-black">{patient.firstName}</td>
              </tr>
              <tr className="border-t border-border print:border-black">
                <td className="py-0.5 pr-2 font-semibold text-muted-foreground print-ink whitespace-nowrap align-top">Address:</td>
                <td className="py-0.5 text-muted-foreground print-muted-ink italic text-[10px] print:text-[8px] text-center">
                    Not a valid<br />prescription unless<br />identifiers present
                  </td>
              </tr>
              <tr className="border-t border-border print:border-black">
                <td className="py-0.5 pr-2 font-semibold text-muted-foreground print-ink whitespace-nowrap align-middle">Date of birth:</td>
                <td className="py-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground print:text-black">{patient.dob ? formatDate(patient.dob) : ''}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold text-muted-foreground print-ink">Sex:</span>
                      <span className="flex items-center gap-0.5">
                        <PrintCheckbox checked={isMale} />
                        <span className="text-foreground print:text-black">M</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <PrintCheckbox checked={isFemale} />
                        <span className="text-foreground print:text-black">F</span>
                      </span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-[9px] print:text-[8px] font-semibold text-status-danger print-alert-ink">
            First prescriber to print patient name and check label correct:
          </p>
        </div>

        {/* Right: ADR sticker + form title */}
        <div className="flex flex-col min-w-[180px] print:min-w-[160px]">
          <div className="border-b border-border print:border-black p-2 print:p-1.5 text-center">
            <p className="text-xs print:text-[10px] font-bold text-status-danger print-alert-ink border border-status-danger print-alert-ink px-2 py-0.5 inline-block">
              Attach ADR sticker
            </p>
            <p className="text-[9px] print:text-[8px] text-muted-foreground print-muted-ink mt-0.5">See front page for details</p>
          </div>
          <div className="flex-1 p-3 print:p-2 flex flex-col items-center justify-center gap-1">
            <p className="text-base print:text-sm font-bold text-foreground print:text-black leading-tight text-center">
              Anaesthetic Allergy<br />Skin Testing<br />Request
            </p>
            {reactionDate && (
              <p className="text-[10px] print:text-[9px] text-center text-muted-foreground print-muted-ink">
                Reaction: {formatDate(reactionDate)}
              </p>
            )}
            <p className="text-xs print:text-[10px] text-center text-muted-foreground print-muted-ink">
              Year: 20{new Date().getFullYear().toString().slice(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Banner */}
      {urgent && (
        <div className="flex items-center gap-3 bg-status-danger text-status-danger-foreground px-5 py-3 print:px-2 print:py-1 font-bold uppercase tracking-wider text-sm print:bg-black print:border-2 print:border-black rounded-none">
          <AlertTriangle className="w-5 h-5 print:w-4 print:h-4 shrink-0" />
          URGENT — Priority Testing Required
        </div>
      )}

      {/* Department line */}
      <p className="text-xs text-muted-foreground print:text-[9px] print-muted-ink">
        Department of Clinical Immunology &amp; Allergy · Royal Prince Alfred Hospital · Date of request: {formatDate(new Date().toISOString())}
      </p>

      {/* Documents to Chase */}
      {documentsToChase && (documentsToChase.tryptases || documentsToChase.anaestheticChart || documentsToChase.other) && (
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-widest border-b border-border mb-2 pb-1 print:text-[10px] print:mb-1 print:pb-0.5 flex items-center gap-1.5 print:text-black">
            <FolderSearch className="w-3.5 h-3.5 print:w-3 print:h-3" />
            Documents to Chase
          </h3>
          <div className="flex flex-wrap gap-2 print:gap-1">
            {documentsToChase.tryptases && (
              <Badge variant="outline" className="gap-1 bg-status-warning/10 border-status-warning/30 text-status-warning font-semibold uppercase tracking-wide print:text-[10px] print:bg-white print:border print:border-black print:text-black rounded-none">
                Tryptases
              </Badge>
            )}
            {documentsToChase.anaestheticChart && (
              <Badge variant="outline" className="gap-1 bg-status-warning/10 border-status-warning/30 text-status-warning font-semibold uppercase tracking-wide print:text-[10px] print:bg-white print:border print:border-black print:text-black rounded-none">
                Anaesthetic Chart
              </Badge>
            )}
            {documentsToChase.other && (
              <Badge variant="outline" className="gap-1 bg-status-warning/10 border-status-warning/30 text-status-warning font-semibold uppercase tracking-wide print:text-[10px] print:bg-white print:border print:border-black print:text-black rounded-none">
                Other{documentsToChase.otherText ? `: ${documentsToChase.otherText}` : ''}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Clinical Notes */}
      {notes && (
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-widest border-b border-border mb-2 pb-1 print:text-[10px] print:mb-1 print:pb-0.5 flex items-center gap-1.5 print:text-black">
            <NotebookText className="w-3.5 h-3.5 print:w-3 print:h-3" />
            Clinical Notes
          </h3>
          <p className="text-foreground/80 whitespace-pre-wrap text-sm print:text-xs">{notes}</p>
        </div>
      )}
    </>
  );
};

export default TestingPlanPrintHeader;
