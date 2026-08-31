import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { NurseNotes } from '@shared/types';

export interface NurseNotesSectionProps {
  nurseNotes?: NurseNotes;
  onChange: (nurseNotes: NurseNotes) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function NurseNotesSection({ nurseNotes, onChange, isOpen, setIsOpen }: NurseNotesSectionProps) {
  return (
    <Card style={{ '--section-index': 5 } as React.CSSProperties} className="animate-section-reveal border-border">
      <CardHeader bordered className="bg-card">
        <button
          type="button"
          className="flex items-center justify-between w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none p-0.5"
          onClick={() => setIsOpen(open => !open)}
          aria-expanded={isOpen}
          aria-controls="nursing-notes-content"
        >
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            Nursing Notes
            <span className="text-xs font-normal text-muted-foreground ml-1">(nursing team only)</span>
          </CardTitle>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent id="nursing-notes-content" className="space-y-4">
          {([
            ['preTesting', 'nurse-pre', 'Pre-Testing Observations', 'e.g. consent obtained, vitals stable, IV access established...'],
            ['duringTesting', 'nurse-during', 'During Testing', 'e.g. patient tolerated well, no adverse events observed...'],
            ['postTesting', 'nurse-post', 'Post-Testing / Discharge', 'e.g. patient discharged in stable condition, instructions given...'],
          ] as const).map(([field, id, label, placeholder]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={id} className="text-foreground font-medium text-sm">{label}</Label>
              <textarea
                id={id}
                className="flex min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={placeholder}
                value={nurseNotes?.[field] || ''}
                onChange={e => onChange({ ...nurseNotes, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="nurse-signed" className="text-foreground font-medium text-sm">Signed by (RN)</Label>
            <Input
              id="nurse-signed"
              className="border-input focus-visible:ring-2 focus-visible:ring-ring rounded-none bg-background text-foreground"
              placeholder="Nurse name..."
              value={nurseNotes?.signedBy || ''}
              onChange={e => onChange({ ...nurseNotes, signedBy: e.target.value })}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
