import React from 'react';
import { Button } from '@/components/ui';
import { Printer } from 'lucide-react';

interface TestingPlanGeneratorActionsProps {
  hasUnresolvedProtocols: boolean;
  onPreview: () => void;
}

/**
 * Footer of the testing plan builder: the blocking review alert and the
 * Preview & Print action. Pure rendering (plan 003 / F1); preview gating is
 * enforced by the parent.
 */
const TestingPlanGeneratorActions: React.FC<TestingPlanGeneratorActionsProps> = ({
  hasUnresolvedProtocols,
  onPreview,
}) => {
  return (
    <div className="pt-4 border-t border-border space-y-3">
      {hasUnresolvedProtocols && (
        <div
          role="alert"
          aria-live="assertive"
          className="border border-status-danger bg-status-danger/10 p-3 rounded-none text-status-danger space-y-1"
          data-testid="protocol-selection-review-alert"
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <span>⚠ Protocol selection requires review</span>
          </div>
          <p className="text-xs font-normal text-foreground/90 leading-relaxed">
            Protocol selection requires review. A valid protocol option must be selected before previewing or printing.
          </p>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={onPreview} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold rounded-none btn-press">
          <Printer className="w-4 h-4 mr-2" /> Preview &amp; Print Request Form
        </Button>
      </div>
    </div>
  );
};

export default TestingPlanGeneratorActions;
