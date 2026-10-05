import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Screen } from '@shared/types';
import { createMockPatient } from '@/src/test/factories/patientFactory';
import { createMockLogFormData } from '@/src/test/factories/testingDataFactory';
import { TestingScreen } from './TestingScreens';

vi.mock('@core/components/ScreenLayout', () => ({
  ScreenLayout: ({ children, contextBar }: { children: React.ReactNode; contextBar?: React.ReactNode }) => (
    <React.Suspense fallback={<div>Loading</div>}>{contextBar}{children}</React.Suspense>
  ),
}));

vi.mock('@features/testing/components/TestingLogForm', () => ({
  default: ({ isDirectEntry }: { isDirectEntry?: boolean }) => (
    <div data-testid="testing-log-form" data-direct-entry={isDirectEntry ? 'true' : 'false'}>
      Testing log form
    </div>
  ),
}));

const chrome = {
  setScreen: vi.fn(),
  currentScreen: Screen.TESTING,
  databaseDate: '',
  showDisclaimer: false,
  isCustomData: false,
  onDismissDisclaimer: vi.fn(),
  onUploadPatients: vi.fn(),
  csvUploadSheetOpen: false,
  onCSVUploadSheetOpenChange: vi.fn(),
};

function renderTestingScreen(selectedPatient: ReturnType<typeof createMockPatient> | null) {
  render(
    <TestingScreen
      chrome={chrome}
      selectedPatient={selectedPatient}
      formData={createMockLogFormData({ firstName: 'Manual', lastName: 'Patient', mrn: 'M-001' })}
      setFormData={vi.fn()}
      lastDraftSavedAt={null}
      isSavingDraft={false}
      onBack={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
}

describe('TestingScreen clinical context and identity display', () => {
  it('renders read-only identity bar and high-risk chips for selected patients', async () => {
    renderTestingScreen(createMockPatient({
      history: {
        ...createMockPatient().history,
        highRiskMeds: ['beta-blocker'],
        conditions: ['asthmatic'],
      },
    }));

    const identityBar = await screen.findByLabelText('Active patient identity');
    const context = await screen.findByRole('region', { name: 'High-risk clinical context' });
    expect(identityBar.compareDocumentPosition(context) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(context).getByText('Beta-blocker')).toBeInTheDocument();
    expect(within(context).getByText('Asthma')).toBeInTheDocument();
    expect(screen.getByTestId('testing-log-form')).toHaveAttribute('data-direct-entry', 'false');
  });

  it('renders direct-entry testing form when no patient is selected', async () => {
    renderTestingScreen(null);

    const directBar = await screen.findByLabelText('Active patient identity');
    expect(directBar).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'High-risk clinical context' })).not.toBeInTheDocument();
    expect(screen.getByTestId('testing-log-form')).toHaveAttribute('data-direct-entry', 'true');
  });
});
