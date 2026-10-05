import React from 'react';
import { formatDate } from '@shared/utils';

/**
 * Shared print document primitives (plan 003 / F3).
 *
 * One correction here improves every letter, handout, and nurse sheet.
 * These primitives render the monochrome print classes defined in
 * index.css (--print-* tokens) and must never introduce screen styling
 * beyond what the clinical documents already apply.
 */

/** Print-only patient identity header/footer pair. */
export const PrintDocumentIdentity: React.FC<{
  patientName: string;
  mrn: string;
  dob?: string;
  reportTitle: string;
  requestDate?: string;
}> = ({ patientName, mrn, dob, reportTitle, requestDate }) => {
  const patientIdentifier = `${patientName} · REDCap ID ${mrn}${dob ? ` · DOB ${formatDate(dob)}` : ''}`;
  const footerDate = requestDate || new Date().toISOString();

  return (
    <>
      <div className="hidden print:flex print:items-center print:justify-between print:border-b print:border-black print:bg-white print:pb-[3mm] print:text-[10px] print:font-semibold print:text-black">
        <span>{patientIdentifier}</span>
        <span>{reportTitle}</span>
      </div>
      <div className="hidden print:flex print:items-center print:justify-between print:border-t print:border-black print:bg-white print:pt-[3mm] print:text-[10px] print:font-semibold print:text-black">
        <span>{patientName} · REDCap ID {mrn}</span>
        <span>Date of report: {formatDate(footerDate)}</span>
      </div>
    </>
  );
};

/** A clinical document section that must not split across pages. */
export const PrintSection: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={`section-card print-keep-together ${className ?? ''}`} {...props}>
    {children}
  </div>
);

/** Monochrome status label (e.g. AVOID / SAFE chips) legible in black-and-white. */
export const PrintStatusLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  children,
  ...props
}) => (
  <span className={`print-ink ${className ?? ''}`} {...props}>
    {children}
  </span>
);

/** A clinical entry (row, warning block) that must stay on one page. */
export const PrintKeepTogether: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={`print-keep-together ${className ?? ''}`} {...props}>
    {children}
  </div>
);

/** Signature block: rules and labels that must never detach across pages. */
export const PrintSignatureBlock: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={`print-signature-block ${className ?? ''}`} {...props}>
    {children}
  </div>
);
