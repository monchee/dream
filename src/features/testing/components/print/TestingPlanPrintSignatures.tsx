import React from 'react';

/**
 * Prescriber signature area of the printable testing request form
 * (plan 003 / F1). Kept together across print pages via the shared
 * print-signature-block policy.
 */
const TestingPlanPrintSignatures: React.FC = () => {
  return (
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
  );
};

export default TestingPlanPrintSignatures;
