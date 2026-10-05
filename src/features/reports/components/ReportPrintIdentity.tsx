import React from 'react';
import { PrintDocumentIdentity } from '@shared/components/print';

interface ReportPrintIdentityProps {
  patientName: string;
  mrn: string;
  dob?: string;
  reportTitle: string;
  requestDate?: string;
}

/**
 * Compatibility adapter (plan 003 / F3): the report identity now comes from
 * the shared print primitives so one correction covers every document.
 * Existing imports and tests keep working through this wrapper.
 */
export const ReportPrintIdentity: React.FC<ReportPrintIdentityProps> = (props) => (
  <PrintDocumentIdentity {...props} />
);
