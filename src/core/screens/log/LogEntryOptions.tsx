import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui';
import { Info, Shield, Stethoscope, Target, Users } from 'lucide-react';
import { GetStartedActions } from '@core/components/GetStartedActions';
import { ScreenChrome } from '../types';

interface LogEntryOptionsProps {
  chrome: ScreenChrome;
  onStartTesting: () => void;
}

/**
 * Empty-state content of the home screen: quick-start actions, the welcome
 * steps, and the product info cards (plan 003 / F1). Shown only when no
 * patient is selected; upload/direct-entry routing is owned by the parent.
 */
const LogEntryOptions: React.FC<LogEntryOptionsProps> = ({ chrome, onStartTesting }) => {
  return (
    <>
      <GetStartedActions
        variant="page"
        onUpload={() => (chrome.onCSVUploadSheetOpenChange ? chrome.onCSVUploadSheetOpenChange(true) : undefined)}
        onStartTesting={onStartTesting}
      />
      <Card elevation="raised" className="border-primary/20 bg-primary/5 dark:bg-card/40">
        <CardContent>
          <div className="flex gap-3">
            <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none h-fit mt-0.5">
              <Info className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <CardTitle as="h2" className="text-sm text-foreground">
                Welcome — here's how to get started
              </CardTitle>
              <ol className="space-y-1.5 text-sm text-foreground/85">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">1.</span>
                  <span>
                    Select a patient from the dropdown above — search by name, ID, or date of birth. Choose <strong>New Patient (Manual Entry)</strong> if the patient is not in the database.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">2.</span>
                  <span>
                    If your patient database isn't loaded yet,{' '}
                    <button
                      onClick={() => (chrome.onCSVUploadSheetOpenChange ? chrome.onCSVUploadSheetOpenChange(true) : undefined)}
                      className="underline text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      upload a patient CSV
                    </button>
                    .
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">3.</span>
                  <span>
                    Once a patient is selected, review their allergy history and generate a personalised drug testing plan.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card elevation="flat">
          <CardContent>
            <div className="flex items-start gap-3">
              <Stethoscope className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <CardTitle as="h2" className="text-sm text-foreground mb-1">The DREAM App</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A specialist service for patients who have experienced a suspected allergic reaction
                  during an anaesthetic. Our team investigates these reactions to identify the drug
                  responsible and help plan safe anaesthesia for future procedures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card elevation="flat">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                <CardTitle as="h2" className="text-sm text-foreground">Purpose</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Helps clinicians prepare for allergy clinic appointments — reviewing patient histories,
                recording test results, and generating reports and testing plans.
              </p>
            </CardContent>
          </Card>
          <Card elevation="flat">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
                <CardTitle as="h2" className="text-sm text-foreground">Data Privacy</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Patient data is processed on your own device and never sent to external servers.
                Anything held locally is automatically cleared after 6 hours, so nothing lingers
                on a shared workstation.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card elevation="flat">
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <CardTitle as="h2" className="text-sm text-foreground">Key Features</CardTitle>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {[
                'Dashboard showing patient statistics at a glance',
                'Search and filter patients by name, reaction grade, and date',
                'Detailed patient history and timeline views',
                'Skin test and drug challenge result recording',
                'Three report types: clinical report, patient handout, and Powerchart Letter',
                'Create and print testing plan request forms for nursing staff',
                'Import patient records from your clinic database',
                'Works offline — use the app without internet access',
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                    •
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LogEntryOptions;
