import React from 'react';
import { Button } from '@/components/ui';
import { ChevronRight } from 'lucide-react';
import PatientHistory from '@features/patients/components/PatientHistory';
import TestingPlanGenerator from '@features/testing/components/TestingPlanGenerator';
import { DRUG_CATEGORIES } from '@shared/utils/constants';
import { Patient, Screen, TestingPlanData } from '@shared/types';
import { ScreenChrome } from '../types';

interface LogHistoryPanelProps {
  chrome: ScreenChrome;
  selectedPatient: Patient;
  onToggleSuspectedAgent: (patientId: string, drugName: string) => void;
  onSetTestingPlanData: (data: TestingPlanData | null) => void;
  onProceedToTesting: () => void;
}

/**
 * The selected-patient workspace of the home screen: history panel, plan
 * generator, and the "Start Testing Session" action (plan 003 / F1).
 * Plan data and navigation are owned by the parent.
 */
const LogHistoryPanel: React.FC<LogHistoryPanelProps> = ({
  chrome,
  selectedPatient,
  onToggleSuspectedAgent,
  onSetTestingPlanData,
  onProceedToTesting,
}) => {
  return (
    <div key={selectedPatient.id} className="space-y-8">
      {selectedPatient.id !== 'manual' && (
        <div style={{ '--section-index': 0 } as React.CSSProperties} className="animate-section-reveal">
          <PatientHistory
            patient={selectedPatient}
            onToggleSuspectedAgent={(drugName) => onToggleSuspectedAgent(selectedPatient.id, drugName)}
          />
        </div>
      )}
      <div style={{ '--section-index': selectedPatient.id !== 'manual' ? 1 : 0 } as React.CSSProperties} className="animate-section-reveal">
        <TestingPlanGenerator
          patient={selectedPatient}
          drugCategories={DRUG_CATEGORIES}
          onPreview={(data) => {
            onSetTestingPlanData(data);
            if (chrome.navigate) {
              chrome.navigate(Screen.PRINT_PLAN);
            } else {
              chrome.setScreen(Screen.PRINT_PLAN);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
      <div style={{ '--section-index': selectedPatient.id !== 'manual' ? 2 : 1 } as React.CSSProperties} className="animate-section-reveal">
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="w-full sm:w-auto text-base py-6 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onProceedToTesting}
          >
            Start Testing Session <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogHistoryPanel;
