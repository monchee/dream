import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Pencil, User } from 'lucide-react';
import PatientSelector from '@features/patients/components/PatientSelector';
import { Patient } from '@shared/types';

interface LogPatientSelectorProps {
  selectedPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (candidate: Patient) => void;
  onEditDetails: () => void;
}

/**
 * The "Patient Selection" card of the home screen (plan 003 / F1).
 * Pure rendering: patient-switch confirmation is handled by the parent.
 */
const LogPatientSelector: React.FC<LogPatientSelectorProps> = ({
  selectedPatient,
  patients,
  onSelectPatient,
  onEditDetails,
}) => {
  return (
    <Card elevation="raised">
      <CardHeader bordered className="bg-card">
        <CardTitle as="h2" className="flex items-center gap-2 text-base text-foreground">
          <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
            <User className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          Patient Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-end gap-2 w-full">
            <PatientSelector
              onSelectPatient={onSelectPatient}
              selectedPatientId={selectedPatient?.id}
              patients={patients}
            />
            {selectedPatient?.id === 'manual' && (
              <Button
                variant="outline"
                size="icon"
                onClick={onEditDetails}
                className="mb-[1px] shrink-0 h-10 w-10 rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Edit Details"
                aria-label="Edit manual patient details"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogPatientSelector;
