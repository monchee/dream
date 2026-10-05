import React, { useState } from 'react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Patient, TestingPlanData } from '@shared/types';
import { formatDate, showToast } from '@shared/utils';
import { Printer, ChevronRight, Mail, AlertTriangle, FolderSearch, NotebookText, Copy } from 'lucide-react';
import { formatTestingPlanAsText } from '@shared/utils/testingPlanFormatter';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { resolveSelectedProtocol } from '@shared/utils/protocolResolver';
import { OutboundActionDialog, OutboundActionType } from '@features/reports/components/OutboundActionDialog';

interface TestingPlanPrintViewProps {
  patient: Patient;
  data: TestingPlanData;
  drugCategories: Record<string, string[]>;
  onProceed: () => void;
}

interface TestRow {
  drugName: string;
  protocolLabel?: string;
  category: string;
  type: 'SPT' | 'IDT';
  concentration: string;
  diluent?: string;
  preparation?: string;
  isFirstForDrug: boolean;
  isCustomNotListed?: boolean;
  needsPharmacyVerification?: boolean;
  underReview?: boolean;
  reviewNote?: string;
  requiresReview?: boolean;
}

const TestingPlanPrintView = ({ patient, data, drugCategories, onProceed }: TestingPlanPrintViewProps) => {
  const [activeOutboundAction, setActiveOutboundAction] = useState<OutboundActionType | null>(null);
  const { selectedDrugs, customDrugs, notes, urgent, reactionDate, documentsToChase } = data;

  // Build flat rows: 1 SPT row + N IDT rows per drug
  const testRows: TestRow[] = [];

  Object.entries(drugCategories).forEach(([category, drugs]) => {
    (drugs as string[]).filter(d => selectedDrugs.includes(d)).forEach(d => {
      const protocols = getSkinProtocolsForDrug(d);
      const resolution = resolveSelectedProtocol(protocols, data.selectedProtocols?.[d]);

      if (resolution.status === 'invalid') {
        testRows.push({
          drugName: d,
          category,
          type: 'SPT',
          concentration: '—',
          isFirstForDrug: true,
          requiresReview: true,
        });
        return;
      }

      if (resolution.status === 'empty') {
        testRows.push({
          drugName: d,
          category,
          type: 'SPT',
          concentration: '—',
          isFirstForDrug: true,
        });
        return;
      }

      const protocol = resolution.protocol;
      const protocolLabel = protocols.length > 1 && protocol ? protocol.protocolLabel : undefined;
      const underReview = protocol?.underReview === true;
      const reviewNote = protocol?.reviewNote;
      const needsPharmacyVerification = protocol?.needsPharmacyVerification === true;

      let isFirst = true;
      if (protocol?.sptNeatConcentration) {
        testRows.push({
          drugName: d,
          protocolLabel,
          category,
          type: 'SPT',
          concentration: protocol.sptNeatConcentration,
          diluent: protocol.diluent,
          isFirstForDrug: isFirst,
          needsPharmacyVerification,
          underReview,
          reviewNote,
        });
        isFirst = false;
      }
      protocol?.idtSteps?.forEach(step => {
        testRows.push({
          drugName: d,
          protocolLabel,
          category,
          type: 'IDT',
          concentration: step.ratio + (step.concentration ? ` (${step.concentration})` : ''),
          diluent: undefined,
          preparation: step.preparation,
          isFirstForDrug: isFirst,
          needsPharmacyVerification: isFirst && needsPharmacyVerification,
          underReview: isFirst && underReview,
          reviewNote: isFirst ? reviewNote : undefined,
        });
        isFirst = false;
      });
      if (isFirst && (needsPharmacyVerification || underReview)) {
        testRows.push({
          drugName: d,
          protocolLabel,
          category,
          type: 'SPT',
          concentration: '—',
          isFirstForDrug: true,
          needsPharmacyVerification,
          underReview,
          reviewNote,
        });
      }
    });
  });


  customDrugs.filter(e => selectedDrugs.includes(e.name)).forEach(entry => {
    const notListed = entry.fromRedcapOther === true;
    let isFirst = true;
    if (entry.sptConcentration) {
      testRows.push({ drugName: entry.name, category: 'Additional', type: 'SPT', concentration: entry.sptConcentration, isFirstForDrug: isFirst, isCustomNotListed: notListed });
      isFirst = false;
    }
    entry.idtSteps?.forEach(step => {
      testRows.push({ drugName: entry.name, category: 'Additional', type: 'IDT', concentration: step.ratio + (step.concentration ? ` (${step.concentration})` : ''), preparation: step.preparation, isFirstForDrug: isFirst, isCustomNotListed: notListed && isFirst });
      isFirst = false;
    });
    if (isFirst) {
      testRows.push({ drugName: entry.name, category: 'Additional', type: 'SPT', concentration: '—', isFirstForDrug: true, isCustomNotListed: notListed });
    }
  });

  const handleConfirmedPrint = () => {
    window.print();
  };

  const handleConfirmedCopy = async () => {
    const body = formatTestingPlanAsText(patient, data, drugCategories);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(body);
      showToast.success('Testing request copied to clipboard');
    } catch (err) {
      showToast.error('Failed to copy testing request to clipboard');
      throw err;
    }
  };

  const handleConfirmedEmail = () => {
    const body = formatTestingPlanAsText(patient, data, drugCategories);
    const subject = `Testing Request Form: ${patient.firstName} ${patient.lastName} - ${reactionDate ? new Date(reactionDate).toLocaleDateString('en-AU') : 'Date unknown'}`;
    window.location.href = `mailto:SLHD-RPA-allergynurses@health.nsw.gov.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const genderLower = patient.gender?.toLowerCase() ?? '';
  const isMale = genderLower.startsWith('m');
  const isFemale = genderLower.startsWith('f');

  const Checkbox = ({ checked }: { checked: boolean }) => (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-current print:border-black text-[8px] shrink-0">
      {checked ? '✓' : ''}
    </span>
  );

  return (
    <Card className="overflow-hidden print:overflow-visible print:shadow-none print:border-none print:bg-white">

      {/* Screen-only Controls */}
      <div className="p-4 border-b border-border bg-muted flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-none print:hidden">
        <p className="text-lg font-semibold tracking-tight text-foreground">Testing Request Form</p>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button size="sm" variant="outline" onClick={() => setActiveOutboundAction('copy')} className="rounded-none">
            <Copy className="w-4 h-4 mr-2" /> Copy as Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => setActiveOutboundAction('email')} className="rounded-none">
            <Mail className="w-4 h-4 mr-2" /> Email to Allergy Nurse
          </Button>
          <Button size="sm" onClick={() => setActiveOutboundAction('print')} className="rounded-none">
            <Printer className="w-4 h-4 mr-2" /> Print Now
          </Button>
        </div>
      </div>

      {activeOutboundAction && (
        <OutboundActionDialog
          open={Boolean(activeOutboundAction)}
          onOpenChange={(open) => {
            if (!open) setActiveOutboundAction(null);
          }}
          actionType={activeOutboundAction}
          artifactTitle="Testing Request Form"
          patientName={`${patient.lastName.toUpperCase()}, ${patient.firstName}`}
          mrn={patient.mrn}
          dob={patient.dob}
          testingDate={reactionDate || undefined}
          destination={
            activeOutboundAction === 'email'
              ? 'SLHD-RPA-allergynurses@health.nsw.gov.au'
              : undefined
          }
          disclosureMode="Identified Clinical Request Form"
          onConfirm={async () => {
            if (activeOutboundAction === 'print') {
              handleConfirmedPrint();
            } else if (activeOutboundAction === 'copy') {
              await handleConfirmedCopy();
            } else if (activeOutboundAction === 'email') {
              handleConfirmedEmail();
            }
          }}
        />
      )}

      <CardContent className="p-4 md:p-6 print:p-4 space-y-4 print:space-y-3">

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
                          <Checkbox checked={isMale} />
                          <span className="text-foreground print:text-black">M</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Checkbox checked={isFemale} />
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

        {/* === SPT / IDT PROTOCOL TABLE === */}
        <div>
          {/* Reference Controls */}
          <div className="mb-2 print:mb-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 border border-border print:border-black p-2 print:p-1.5 bg-muted print:bg-white text-xs print:text-[9px]">
            <span className="font-semibold text-muted-foreground print-ink uppercase tracking-wide text-[10px] print:text-[8px]">
              Reference Controls:
            </span>
            {[
              { label: 'Histamine (SPT)', unit: 'mm' },
              { label: 'Saline (SPT)', unit: 'mm' },
              { label: 'Saline (IDT)', unit: 'mm' },
            ].map(({ label, unit }) => (
              <span key={label} className="flex items-end gap-1">
                <span className="text-foreground/80 print-ink">{label}</span>
                <span className="border-b border-border dark:border-border print:border-black inline-block min-w-[3rem] print:h-5" />
                <span className="text-muted-foreground">{unit}</span>
              </span>
            ))}
          </div>

          <table className="w-full border-collapse border border-border print:border-black text-xs print:text-[9px]">
            <thead>
              <tr>
                <th
                  colSpan={10}
                  scope="colgroup"
                  className="border border-border print:border-black bg-muted print:bg-white px-3 py-2 print:py-1.5 text-left font-bold text-sm print:text-[10px] text-foreground print:text-black"
                >
                  Skin Prick Test (SPT) and Intradermal Test (IDT) Protocol
                </th>
              </tr>
              <tr className="bg-muted/50 print:bg-white text-muted-foreground print-ink uppercase text-[10px] print:text-[8px] tracking-wider">
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-left w-14 print:w-12">Date</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-left">Drug (generic name)</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-12 print:w-10">Type</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-left w-[22%]">Concentration</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-14 print:w-12">Date</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-12 print:w-10">Time</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-20 print:w-16">Signature</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-20 print:w-16">Print name</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-16 print:w-14">Wheal (mm)</th>
                <th scope="col" className="border border-border print:border-black px-1.5 py-1.5 print:py-1 font-semibold text-center w-12 print:w-10">Time</th>
              </tr>
            </thead>
            <tbody>
              {testRows.length > 0 ? testRows.map((row, i) => (
                <tr key={i} className={row.isFirstForDrug ? 'bg-muted/30 print:bg-gray-50' : 'bg-background print:bg-white'}>
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5 print:h-7" />
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5">
                    <div className="font-semibold text-foreground print:text-black leading-tight flex flex-wrap items-center gap-1">
                      {row.drugName}
                      {row.protocolLabel && (
                        <span className="font-normal text-muted-foreground print-muted-ink">({row.protocolLabel})</span>
                      )}
                      {row.isCustomNotListed && (
                        <span className="border border-foreground print:border-black rounded-none px-1 text-[9px] uppercase tracking-wide text-foreground print:text-black font-semibold">
                          not listed
                        </span>
                      )}
                    </div>
                    {row.isFirstForDrug && (
                      <>
                        <div className="text-[9px] print:text-[8px] text-muted-foreground print-muted-ink uppercase tracking-wide mt-0.5">
                          {row.category}
                        </div>
                        {row.requiresReview && (
                          <div
                            role="alert"
                            className="mt-1 border border-status-danger bg-status-danger/10 px-1 py-0.5 text-xs font-bold leading-tight text-status-danger print:border-black print:bg-white print:text-[8px] print:text-black rounded-none"
                          >
                            ⚠ Protocol selection requires review
                          </div>
                        )}
                        {row.underReview && (
                          <div className="mt-1 border border-status-warning bg-status-warning/10 px-1 py-0.5 text-xs font-bold leading-tight text-status-warning print:border-black print:bg-white print:text-[8px] print:text-black rounded-none">
                            <div>⚠ Under review</div>
                            {row.reviewNote && (
                              <div className="font-normal text-[10px] print:text-[8px] mt-0.5 text-muted-foreground print:text-black leading-snug">
                                {row.reviewNote}
                              </div>
                            )}
                          </div>
                        )}
                        {row.needsPharmacyVerification && (
                          <div className="mt-1 border border-status-warning bg-status-warning/10 px-1 py-0.5 text-xs font-bold leading-tight text-status-warning print:border-black print:bg-white print:text-[8px] print:text-black rounded-none">
                            ⚠ Confirm preparation with pharmacy
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5 text-center font-bold text-foreground print:text-black">
                    {row.type}
                  </td>
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5 font-mono text-muted-foreground print-ink leading-tight">
                    <div>{row.concentration}</div>
                    {row.preparation && (
                      <div className="text-[9px] print:text-[8px] text-muted-foreground print-muted-ink mt-0.5 font-sans">
                        {row.preparation}
                      </div>
                    )}
                    {row.diluent && (
                      <div className="text-[9px] print:text-[8px] text-muted-foreground print-muted-ink mt-0.5 font-sans">
                        {row.diluent.startsWith('Neat') ? row.diluent : `in ${row.diluent}`}
                      </div>
                    )}
                  </td>
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5" />
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5" />
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5" />
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5" />
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5 text-center">
                    <span className="text-[9px] print:text-[8px] text-muted-foreground print-muted-ink">mm</span>
                  </td>
                  <td className="border border-border print:border-black px-1.5 py-2 print:py-1.5" />
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="border border-border print:border-black px-3 py-4 text-center text-muted-foreground italic text-sm print:text-xs">
                    No drugs selected.
                  </td>
                </tr>
              )}
              {/* Blank rows for handwritten additions */}
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="border border-border print:border-black px-1.5 py-2 print:py-1.5 print:h-7" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nurse / Time / Date sign-off */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-xs print:text-[10px] pt-4 print:pt-2">
          {[
            { label: 'Date of testing', width: 'min-w-[6rem]' },
            { label: 'Time', width: 'min-w-[4rem]' },
            { label: 'Nurse', width: 'min-w-[10rem]' },
          ].map(({ label, width }) => (
            <span key={label} className="flex items-end gap-1.5">
              <span className="font-semibold text-foreground/80 print-ink">{label}:</span>
              <span className={`border-b border-border dark:border-border print:border-black inline-block print:h-6 ${width}`} />
            </span>
          ))}
        </div>

        {/* Signature Area */}
        <div className="pt-6 border-t border-border print:pt-4 print-signature-block">
          <div className="flex justify-between gap-12 print:gap-6">
            <div className="flex-1">
              <div className="border-b-2 border-foreground print:border-black h-8 print:h-12" />
              <p className="text-xs uppercase font-semibold text-muted-foreground print-muted-ink tracking-wider print:text-[9px] mt-1">Requested By (Name &amp; Signature)</p>
            </div>
            <div className="w-40 print:w-32">
              <div className="border-b-2 border-foreground print:border-black h-8 print:h-12" />
              <p className="text-xs uppercase font-semibold text-muted-foreground print-muted-ink tracking-wider print:text-[9px] mt-1">Date</p>
            </div>
          </div>
        </div>

        {/* Proceed Action (Hidden on Print) */}
        <div className="mt-8 pt-4 border-t border-border print:hidden flex justify-end">
          <Button size="lg" onClick={onProceed} className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground btn-press shadow-md">
            Start Testing Session <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default TestingPlanPrintView;
