import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Database,
  EyeOff,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Printer,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ScreenLayout } from '@core/components/ScreenLayout';
import { Patient, LogFormData } from '@shared/types';
import { showToast } from '@shared/utils';
import { formatClinicalReportAsText, formatPatientHandoutAsText, generateLetterText } from '@shared/utils/reportExporter';
import { RedactProvider, useRedact } from '@features/reports/hooks/useRedact';
import { ScreenChrome } from './types';
import { useResearchSubmit } from '@features/research/hooks/useResearchSubmit';
import { ClinicalContextBar } from '@features/patients/components/ClinicalContextBar';
import { OutboundActionDialog, OutboundActionType } from '@features/reports/components/OutboundActionDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ClinicalWorkContext } from '@shared/types/clinicalWorkContext';

const ClinicalReport = React.lazy(() => import('@features/reports/components/ClinicalReport'));
const PatientHandout = React.lazy(() => import('@features/reports/components/PatientHandout'));
const PowerchartLetter = React.lazy(() => import('@features/reports/components/PowerchartLetter'));

const BACK_BTN = "h-11 min-w-11 px-4 bg-secondary hover:bg-muted text-secondary-foreground hover:text-foreground border border-border shadow-sm transition-[color,background-color,border-color,transform,box-shadow] duration-200 group rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const BACK_ICON = "w-4 h-4 opacity-90 group-hover:opacity-100 transition-opacity";

export type ReportTab = 'report' | 'handout' | 'letter';

function RedactToggle() {
  const { isRedacted, toggleRedact } = useRedact();
  return (
    <div className="flex justify-end mb-2 no-print">
      <button
        type="button"
        onClick={toggleRedact}
        className={`flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
          isRedacted
            ? 'border-status-warning/40 bg-status-warning/10 text-status-warning'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        }`}
        title={isRedacted ? 'Show identifying data' : 'Hide identifying data'}
      >
        <EyeOff className="w-3 h-3" />
        {isRedacted ? 'Show' : 'Redact'}
      </button>
    </div>
  );
}

export interface SummaryScreenProps {
  chrome: ScreenChrome;
  lastSavedRecord: LogFormData;
  workContext?: ClinicalWorkContext | null;
  selectedPatient?: Patient | null;
  activeReportSavedAt: number | null;
  activeReportTab: ReportTab;
  setActiveReportTab: (tab: ReportTab) => void;
  research: ReturnType<typeof useResearchSubmit>;
  onExit: () => void;
  onStartNewLog: () => void;
}

function SummaryScreenContent({
  chrome,
  lastSavedRecord,
  workContext,
  selectedPatient: _selectedPatient,
  activeReportSavedAt,
  activeReportTab,
  setActiveReportTab,
  research,
  onExit,
  onStartNewLog,
}: SummaryScreenProps) {
  const { isRedacted, redact } = useRedact();
  const [activeOutboundAction, setActiveOutboundAction] = useState<OutboundActionType | null>(null);
  const [confirmNewLogOpen, setConfirmNewLogOpen] = useState(false);

  const tabLabel = ({ report: 'Clinical Report', handout: 'Patient Handout', letter: 'Powerchart Letter' } as const)[activeReportTab];
  const patientName = `${lastSavedRecord.firstName} ${lastSavedRecord.lastName}`;
  const visitDate = lastSavedRecord.visitDate ? new Date(lastSavedRecord.visitDate).toLocaleDateString('en-AU') : '';

  // Use snapshot bound to work context if available, otherwise null
  const boundPatient = workContext?.patientSnapshot ?? null;

  const getCopyText = () => {
    const redactFn = isRedacted ? redact : undefined;
    if (activeReportTab === 'report') return formatClinicalReportAsText(lastSavedRecord, redactFn);
    if (activeReportTab === 'handout') return formatPatientHandoutAsText(lastSavedRecord, redactFn);
    return generateLetterText(lastSavedRecord, boundPatient, redactFn);
  };

  const handleConfirmedCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(getCopyText());
      showToast.success(`${tabLabel} copied to clipboard`);
    } catch (err) {
      showToast.error('Failed to copy to clipboard');
      throw err;
    }
  };

  const handleConfirmedEmail = () => {
    try {
      const emailPatientName = isRedacted ? redact(patientName) : patientName;
      const subject = `${tabLabel}: ${emailPatientName}${visitDate ? ` - ${visitDate}` : ''}`;
      // Blank recipient per Phase 4 specification
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(getCopyText())}`;
    } catch (err) {
      showToast.error('Failed to open email client');
      throw err;
    }
  };

  const handleConfirmedPrint = () => {
    window.print();
  };

  const handleConfirmedResearch = async () => {
    await research.submit(lastSavedRecord, boundPatient?.redcapId);
  };

  return (
    <ScreenLayout
      chrome={chrome}
      title="Reports"
      icon={<FileText className="w-5 h-5" />}
      showFooter={false}
      actions={<Button onClick={onExit} variant="ghost" className={BACK_BTN}><LogOut className={BACK_ICON} /> Exit</Button>}
      contextBar={
        <ClinicalContextBar
          context={workContext}
          firstName={lastSavedRecord.firstName}
          lastName={lastSavedRecord.lastName}
          mrn={lastSavedRecord.mrn}
          dob={lastSavedRecord.dob}
          visitDate={lastSavedRecord.visitDate}
        />
      }
      contentClassName="py-4 space-y-4"
    >
      <div className="flex overflow-x-auto border-b border-border no-print -mx-1 px-1" role="tablist" aria-label="Report type">
        {([
          { key: 'report', label: 'Clinical Report', icon: <FileText className="w-4 h-4" /> },
          { key: 'handout', label: 'Patient Handout', icon: <User className="w-4 h-4" /> },
          { key: 'letter', label: 'Powerchart Letter', icon: <ClipboardCopy className="w-4 h-4" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            id={`report-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={activeReportTab === key}
            aria-controls={`report-panel-${key}`}
            onClick={() => setActiveReportTab(key)}
            className={`flex min-h-[44px] items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors rounded-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
              ${activeReportTab === key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <RedactToggle />
      <div id={`report-panel-${activeReportTab}`} role="tabpanel" aria-labelledby={`report-tab-${activeReportTab}`}>
        {activeReportTab === 'report' && <ClinicalReport data={lastSavedRecord} activeReportSavedAt={activeReportSavedAt} />}
        {activeReportTab === 'handout' && <PatientHandout data={lastSavedRecord} activeReportSavedAt={activeReportSavedAt} />}
        {activeReportTab === 'letter' && <PowerchartLetter data={lastSavedRecord} patient={boundPatient} activeReportSavedAt={activeReportSavedAt} />}
      </div>

      {/* Output Action Dialog */}
      {activeOutboundAction && (
        <OutboundActionDialog
          open={Boolean(activeOutboundAction)}
          onOpenChange={(open) => {
            if (!open) setActiveOutboundAction(null);
          }}
          actionType={activeOutboundAction}
          artifactTitle={tabLabel}
          workContext={workContext}
          patientName={`${lastSavedRecord.lastName.toUpperCase()}, ${lastSavedRecord.firstName}`}
          mrn={lastSavedRecord.mrn}
          dob={lastSavedRecord.dob}
          testingDate={lastSavedRecord.visitDate}
          isRedacted={isRedacted}
          researchAlreadySubmitted={research.isSubmitted}
          onConfirm={async () => {
            if (activeOutboundAction === 'print') handleConfirmedPrint();
            else if (activeOutboundAction === 'copy') await handleConfirmedCopy();
            else if (activeOutboundAction === 'email') handleConfirmedEmail();
            else if (activeOutboundAction === 'research') await handleConfirmedResearch();
          }}
        />
      )}

      {/* Output Section */}
      <div className="border border-border bg-card p-4 space-y-3 no-print mt-4 rounded-none">
        <h3 className="section-label">Output this document:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={() => setActiveOutboundAction('print')}
            size="lg"
            className="py-5 h-auto text-sm rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" /> Print (Primary)
          </Button>
          <Button
            onClick={() => setActiveOutboundAction('copy')}
            size="lg"
            variant="outline"
            className="py-5 h-auto text-sm rounded-none"
          >
            <Copy className="w-4 h-4 mr-2" /> Copy as Text
          </Button>
          <Button
            onClick={() => setActiveOutboundAction('email')}
            size="lg"
            variant="outline"
            className="py-5 h-auto text-sm rounded-none"
          >
            <Mail className="w-4 h-4 mr-2" /> Send via Email
          </Button>
        </div>
      </div>

      {/* Research Section */}
      {research.isAvailable && (
        <div className="border border-border bg-card p-4 space-y-3 no-print rounded-none">
          <h3 className="section-label">Research Database:</h3>
          {research.isSubmitted ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-status-success border border-status-success/30 bg-status-success/10 rounded-none">
              <CheckCircle2 className="w-4 h-4" /> Submitted to Research Database
            </div>
          ) : (
            <Button
              onClick={() => setActiveOutboundAction('research')}
              disabled={research.isSubmitting}
              size="lg"
              variant="outline"
              className="w-full py-4 h-auto text-sm rounded-none border-dashed"
            >
              {research.isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving to Research Database…</>
              ) : (
                <><Database className="w-4 h-4 mr-2" /> Save to Research Database</>
              )}
            </Button>
          )}
          {research.error && (
            <p className="mt-1 text-xs text-destructive text-center">{research.error}</p>
          )}
        </div>
      )}

      {/* Neutral Start New Log Action */}
      <div className="no-print border-t border-border pt-4 mt-2">
        <Button
          onClick={() => setConfirmNewLogOpen(true)}
          size="lg"
          variant="outline"
          className="w-full py-5 text-base rounded-none font-semibold border-border hover:bg-muted"
        >
          <Plus className="w-4 h-4 mr-2" /> Start New Log
        </Button>
      </div>

      <ConfirmDialog
        open={confirmNewLogOpen}
        onOpenChange={setConfirmNewLogOpen}
        title="Start new clinical log?"
        message="This will exit the current active report. Any unsaved in-progress testing draft will be cleared. Do you want to proceed?"
        confirmLabel="Start New Log"
        cancelLabel="Cancel"
        variant="info"
        onConfirm={onStartNewLog}
      />
    </ScreenLayout>
  );
}

export function SummaryScreen(props: SummaryScreenProps) {
  return (
    <RedactProvider>
      <SummaryScreenContent {...props} />
    </RedactProvider>
  );
}

export default SummaryScreen;
