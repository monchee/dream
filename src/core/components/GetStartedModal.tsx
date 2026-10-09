import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronLeft, PlayCircle, Sparkles } from 'lucide-react';
import { useRedcapCsvUpload } from '@shared/hooks/useRedcapCsvUpload';
import { GetStartedActions } from './GetStartedActions';
import { RedcapExportSteps } from '@features/dashboard/components/RedcapExportSteps';
import { Patient, Screen } from '@shared/types';
import latestReleaseData from '@shared/data/latest-release.json';

const _latestReleases = latestReleaseData as Array<{
  version: string;
  codename: string;
  skipBanner?: boolean;
}>;
const CURRENT_VERSION = _latestReleases[0]?.version ?? '';
// skipBanner allows a meta/tooling patch to be skipped in the banner
// so it highlights the most recent substantive release instead.
const DISPLAY_ENTRY = _latestReleases.find((e) => !e.skipBanner) ?? _latestReleases[0] ?? { version: '', codename: '' };
const CURRENT_CODENAME = DISPLAY_ENTRY.codename;
const LAST_SEEN_KEY = 'dream:last_seen_version';
const GET_STARTED_SEEN_KEY = 'dream:get_started_seen';

type GetStartedStep = 'choose' | 'import';

export interface GetStartedModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUploadPatients?: (patients: Patient[], fileLastModified?: number) => boolean | void;
  onUploadComplete?: () => void;
  setScreen?: (screen: Screen) => void;
  onStartDirectTesting?: () => void;
  isTestingDraftDirty?: boolean;
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen: controlledIsOpen,
  onOpenChange,
  onUploadPatients,
  onUploadComplete,
  setScreen,
  onStartDirectTesting,
  isTestingDraftDirty = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [step, setStep] = useState<GetStartedStep>('choose');
  const isControlled = typeof controlledIsOpen === 'boolean';
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalIsOpen(nextOpen);
    }
  };

  const [confirmDiscardDraftOpen, setConfirmDiscardDraftOpen] = useState(false);
  const [isNewVersion, setIsNewVersion] = useState(() => {
    try {
      return localStorage.getItem(LAST_SEEN_KEY) !== CURRENT_VERSION;
    } catch {
      return false;
    }
  });

  const markSeen = () => {
    try {
      localStorage.setItem(LAST_SEEN_KEY, CURRENT_VERSION);
      localStorage.setItem(GET_STARTED_SEEN_KEY, '1');
    } catch {
      // storage not available
    }
    setIsNewVersion(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      markSeen();
      setStep('choose');
    }
    setOpen(newOpen);
  };

  React.useEffect(() => {
    if (!open) {
      setStep('choose');
    }
  }, [open]);

  const { isUploading, handleFileChange } = useRedcapCsvUpload({
    onParsed: (patients, lastModified) => {
      const persisted = onUploadPatients?.(patients, lastModified);
      markSeen();
      if (persisted === false) {
        // Keep the import surface open with the in-memory data; the hook's
        // toast explains the storage failure.
        setStep('choose');
        return false;
      }
      setStep('choose');
      setOpen(false);
      return persisted;
    },
    onComplete: () => {
      onUploadComplete?.();
    },
  });

  const handleDirectTestingClick = () => {
    if (isTestingDraftDirty) {
      setConfirmDiscardDraftOpen(true);
    } else {
      markSeen();
      setStep('choose');
      setOpen(false);
      onStartDirectTesting?.();
    }
  };

  const handleConfirmDirectTesting = () => {
    setConfirmDiscardDraftOpen(false);
    markSeen();
    setStep('choose');
    setOpen(false);
    onStartDirectTesting?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-full sm:!max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-none">
          {step === 'choose' ? (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <PlayCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                  Get Started
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Choose how to begin. All patient data stays on this device.
                </DialogDescription>
              </DialogHeader>

              {/* Action grid */}
              <GetStartedActions
                variant="modal"
                isUploading={isUploading}
                onUpload={() => setStep('import')}
                onStartTesting={handleDirectTestingClick}
              />
            </>
          ) : (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <PlayCircle className="w-5 h-5 text-primary" aria-hidden="true" />
                  Import REDCap export
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Follow these steps to export from REDCap, then upload the CSV file.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('choose')}
                    className="rounded-none min-h-[44px] text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    Back
                  </Button>
                </div>

                <RedcapExportSteps onUpload={handleFileChange} isUploading={isUploading} />
              </div>
            </>
          )}

          {/* Footer row */}
          <div className="mt-4 pt-3 border-t border-border flex flex-col items-start gap-2 min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs min-w-0 max-w-full">
              {isNewVersion && (
                <Sparkles className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
              )}
              <span
                className={
                  isNewVersion
                    ? 'text-foreground font-semibold truncate'
                    : 'text-muted-foreground truncate'
                }
              >
                {DISPLAY_ENTRY.version}
                {CURRENT_CODENAME ? ` · ${CURRENT_CODENAME}` : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  markSeen();
                  setStep('choose');
                  setOpen(false);
                  setScreen?.(Screen.CHANGELOG);
                }}
                className="text-primary hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
              >
                View changelog →
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              aria-label="Close Get Started"
              onClick={() => {
                markSeen();
                setStep('choose');
                setOpen(false);
              }}
              className="rounded-none min-h-[44px] text-muted-foreground hover:text-foreground text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscardDraftOpen}
        onOpenChange={setConfirmDiscardDraftOpen}
        title="Start fresh testing session?"
        message="You have unsaved changes in your current testing session. Starting a fresh session will discard these changes. This cannot be undone."
        confirmLabel="Start fresh session"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDirectTesting}
      />
    </>
  );
};

export default GetStartedModal;
