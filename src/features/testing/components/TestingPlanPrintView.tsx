import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { ChevronRight } from 'lucide-react';
import { Patient, TestingPlanData } from '@shared/types';
import { showToast } from '@shared/utils';
import { formatTestingPlanAsText } from '@shared/utils/testingPlanFormatter';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { resolveSelectedProtocol } from '@shared/utils/protocolResolver';
import TestingPlanPrintHeader from './print/TestingPlanPrintHeader';
import TestingPlanPrintTable, { type TestRow } from './print/TestingPlanPrintTable';
import TestingPlanPrintSignatures from './print/TestingPlanPrintSignatures';
import TestingPlanPrintActions from './print/TestingPlanPrintActions';

interface TestingPlanPrintViewProps {
  patient: Patient;
  data: TestingPlanData;
  drugCategories: Record<string, string[]>;
  onProceed: () => void;
}

const TestingPlanPrintView = ({ patient, data, drugCategories, onProceed }: TestingPlanPrintViewProps) => {
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

  return (
    <Card className="overflow-hidden print:overflow-visible print:shadow-none print:border-none print:bg-white">

      <TestingPlanPrintActions
        patient={patient}
        reactionDate={reactionDate}
        onPrint={handleConfirmedPrint}
        onCopy={handleConfirmedCopy}
        onEmail={handleConfirmedEmail}
      />

      <CardContent className="p-4 md:p-6 print:p-4 space-y-4 print:space-y-3">

        <TestingPlanPrintHeader
          patient={patient}
          urgent={urgent}
          reactionDate={reactionDate}
          documentsToChase={documentsToChase}
          notes={notes}
        />

        <TestingPlanPrintTable testRows={testRows} />

        <TestingPlanPrintSignatures />

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
