import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { ScreenLayout } from '@core/components/ScreenLayout';
import { DRUG_CATEGORIES, FLAT_DRUG_OPTIONS } from '@shared/utils/constants';
import { LogFormData, Patient } from '@shared/types';
import { ScreenChrome } from './types';

const Dashboard = React.lazy(() => import('@features/dashboard/components/Dashboard'));

interface DashboardScreenProps {
  chrome: ScreenChrome;
  patients: Patient[];
  recentLogs: LogFormData[];
  isLoadingPatients: boolean;
  patientDbSavedAt: number | null;
  onSelectPatient: (patient: Patient) => void;
  onUploadPatients: (newPatients: Patient[], fileLastModified?: number) => boolean | void;
}

export function DashboardScreen({
  chrome,
  patients,
  recentLogs,
  isLoadingPatients,
  patientDbSavedAt,
  onSelectPatient,
  onUploadPatients,
}: DashboardScreenProps) {
  return (
    <ScreenLayout
      chrome={chrome}
      title="Clinical Dashboard"
      icon={<LayoutDashboard className="w-5 h-5" />}
    >
      <h2 className="sr-only">Dashboard analytics and patient records</h2>
      <Dashboard
        existingPatients={patients}
        recentLogs={recentLogs}
        drugOptions={FLAT_DRUG_OPTIONS}
        drugCategories={DRUG_CATEGORIES}
        onSelectPatient={onSelectPatient}
        onUploadPatients={onUploadPatients}
        databaseDate={chrome.databaseDate}
        isCustomData={chrome.isCustomData}
        isLoadingPatients={isLoadingPatients}
        patientDbSavedAt={patientDbSavedAt}
      />
    </ScreenLayout>
  );
}
