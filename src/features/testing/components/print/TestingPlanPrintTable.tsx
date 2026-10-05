import React from 'react';

export interface TestRow {
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

/**
 * The SPT/IDT protocol table of the printable testing request form:
 * reference controls, the clinical protocol rows, blank handwriting rows,
 * and the nurse sign-off line (plan 003 / F1). Rows never split across
 * pages; the table itself flows and its header repeats (print contract).
 */
const TestingPlanPrintTable: React.FC<{ testRows: TestRow[] }> = ({ testRows }) => {
  return (
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
            <tr key={i} className={row.isFirstForDrug ? 'bg-muted/30 print:bg-white' : 'bg-background print:bg-white'}>
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
    </div>
  );
};

export default TestingPlanPrintTable;
