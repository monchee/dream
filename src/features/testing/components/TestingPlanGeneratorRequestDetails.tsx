import React from 'react';
import { Checkbox, Input, Label, Switch } from '@/components/ui';
import { DocumentsToChase } from '@shared/types';

interface RequestDetailsSectionProps {
  urgent: boolean;
  reactionDate: string;
  today: string;
  setUrgent: (value: boolean) => void;
  setReactionDate: (value: string) => void;
}

/**
 * "Request Details" block of the testing plan builder: reaction date and the
 * urgent flag. Pure rendering (plan 003 / F1); state is owned by the parent.
 */
export const RequestDetailsSection: React.FC<RequestDetailsSectionProps> = ({
  urgent,
  reactionDate,
  today,
  setUrgent,
  setReactionDate,
}) => {
  return (
    <div className={`space-y-2 rounded-none p-3 transition-colors duration-150 ${
        urgent
          ? 'bg-status-danger/10 ring-1 ring-status-danger/30'
          : ''
      }`}>
      <div className={`flex items-center border-b border-dashed pb-1 mb-2 ${
          urgent ? 'border-status-danger/30' : 'border-border'
        }`}>
        <h3 className={`section-label ${
            urgent ? 'text-status-danger' : ''
          }`}>Request Details</h3>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="reaction-date" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider whitespace-nowrap">Date of Reaction</Label>
          <Input
            id="reaction-date"
            type="date"
            value={reactionDate ? reactionDate.slice(0, 10) : ''}
            max={today}
            onChange={e => setReactionDate(e.target.value)}
            className="h-11 xl:h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
          <Label
            htmlFor="urgent"
            className={`text-sm font-bold uppercase tracking-wide cursor-pointer ${
              urgent ? 'text-status-danger' : 'text-muted-foreground'
            }`}
          >
            Urgent
          </Label>
        </div>
      </div>
    </div>
  );
};

interface DocumentsToChaseSectionProps {
  documentsToChase: DocumentsToChase;
  toggleDoc: (key: 'tryptases' | 'anaestheticChart' | 'other') => void;
  setDocumentsToChase: React.Dispatch<React.SetStateAction<DocumentsToChase>>;
}

/**
 * "Documents to Chase" block of the testing plan builder. Pure rendering
 * (plan 003 / F1); state is owned by the parent.
 */
export const DocumentsToChaseSection: React.FC<DocumentsToChaseSectionProps> = ({
  documentsToChase,
  toggleDoc,
  setDocumentsToChase,
}) => {
  return (
    <div className="space-y-2 rounded-none p-3 transition-colors duration-150">
      <div className="flex items-center border-b border-dashed border-border pb-1 mb-2">
        <h3 className="section-label">Documents to Chase</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id="doc-tryptases" checked={documentsToChase.tryptases} onCheckedChange={() => toggleDoc('tryptases')} />
          <Label htmlFor="doc-tryptases" className="text-sm cursor-pointer">Tryptases</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="doc-anaesthetic" checked={documentsToChase.anaestheticChart} onCheckedChange={() => toggleDoc('anaestheticChart')} />
          <Label htmlFor="doc-anaesthetic" className="text-sm cursor-pointer">Anaesthetic Chart</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="doc-other" checked={documentsToChase.other} onCheckedChange={() => toggleDoc('other')} />
          <Label htmlFor="doc-other" className="text-sm cursor-pointer">Other</Label>
        </div>
        {documentsToChase.other && (
          <Input
            placeholder="Specify..."
            aria-label="Specify other document to chase"
            value={documentsToChase.otherText}
            onChange={e => setDocumentsToChase(prev => ({ ...prev, otherText: e.target.value }))}
            className="flex-1 min-w-[160px] h-11 xl:h-8"
          />
        )}
      </div>
    </div>
  );
};
