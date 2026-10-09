import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { Patient, LogFormData } from '@shared/types';

vi.mock('@shared/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/utils')>();
  return {
    ...actual,
    parseRedcapCSV: vi.fn(() => ({ success: true, data: [] })),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/hooks/useCountUp', () => ({
  useCountUp: (value: number) => value,
}));

const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dob: '1980-01-01',
    mrn: 'MRN001',
    gender: 'Male',
    city: 'Sydney',
    history: {
      date: '2023-01-01',
      grade: '3',
      reactionSummary: 'Severe reaction to Rocuronium',
      symptoms: [{ label: 'Anaphylaxis' }],
      treatment: ['Adrenaline'],
      suspectedAgents: ['Rocuronium'],
      procedure: 'Surgery',
      anaesthetist: 'Dr. Smith',
    },
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dob: '1990-05-15',
    mrn: 'MRN002',
    gender: 'Female',
    city: 'Melbourne',
    history: {
      date: '',
      grade: '',
      reactionSummary: '',
      symptoms: [],
      treatment: [],
      suspectedAgents: [],
      procedure: '',
      anaesthetist: '',
    },
  },
];

const mockLogs: LogFormData[] = [
  {
    mrn: 'MRN001',
    firstName: 'John',
    lastName: 'Doe',
    visitDate: new Date().toISOString().split('T')[0],
    controls: {
      histamineSpt: '5',
      salineSpt: '0',
      salineIdt: '0',
    },
    testPanel: [
      {
        drugName: 'Rocuronium',
        sptWheal: '8',
        idtResults: ['5', '0', '0'],
        protocolIndex: 0,
      },
    ],
    proceedToChallenge: false,
    challengeDrug: '',
    outcome: null,
    reactionTime: '',
    symptoms: [],
    symptomsOther: '',
    interventionType: '',
    interventionOther: '',
    plan: '',
  },
];

const mockDrugOptions = ['Rocuronium', 'Propofol', 'Fentanyl'];
const mockDrugCategories = {
  'Muscle Relaxants': ['Rocuronium', 'Suxamethonium'],
  'Anaesthetics': ['Propofol', 'Fentanyl'],
};

describe('Dashboard', () => {
  const mockProps = {
    setScreen: vi.fn(),
    existingPatients: mockPatients,
    recentLogs: mockLogs,
    drugOptions: mockDrugOptions,
    drugCategories: mockDrugCategories,
    onSelectPatient: vi.fn(),
    onUploadPatients: vi.fn(),
    databaseDate: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Severity provenance labeling (plan 004 M3)', () => {
    it('labels session-log grades as inferred in the severity distribution', () => {
      render(<Dashboard {...mockProps} />);

      // mockLogs include session logs → inferred copy must appear.
      const note = screen.getByText(/session-log grades are inferred from outcome and intervention/i);
      expect(note).toBeInTheDocument();

      const chart = screen.getByRole('img', { name: /severity distribution.*inferred/i });
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('shows the imported cohort count and six-hour expiry time', () => {
      const savedAt = new Date(2026, 6, 14, 10, 30).getTime();
      render(
        <Dashboard
          {...mockProps}
          isCustomData
          patientDbSavedAt={savedAt}
        />
      );

      expect(screen.getByText('Imported database · 2 patients · expires 16:30')).toBeInTheDocument();
    });

    it('exposes dashboard sections as level-two headings', () => {
      render(<Dashboard {...mockProps} />);

      [
        'Overview',
        'Severity Distribution',
        'Top Suspected Agents',
        'REDCap Record Database',
        'Positive Skin Test Breakdown',
      ].forEach((name) => {
        expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
      });
    });

    it('renders dashboard with patient statistics', () => {
      render(<Dashboard {...mockProps} />);

      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
      // Use getAllByText and check for '3' since it appears in both stats and count header
      const statElements = screen.getAllByText('3');
      expect(statElements.length).toBeGreaterThan(0);

      // Be more specific for the severe count
      expect(screen.getByText('Severe').parentElement?.parentElement?.querySelector('.text-2xl')).toHaveTextContent('0');
    });

    it('shows REDCap records and session logs as separate figures', () => {
      render(<Dashboard {...mockProps} />);

      // Records KPI shows the REDCap record count (2 mock patients), matching the table below
      const recordsValue = screen.getByText('Records').parentElement?.parentElement?.querySelector('.text-2xl');
      expect(recordsValue).toHaveTextContent('2');
      // Session logs (1 mock log) are shown separately, not summed into the headline
      expect(screen.getByText('+1 this session')).toBeInTheDocument();
    });

    it('has proper ARIA labels on buttons', () => {
      render(<Dashboard {...mockProps} />);
      expect(screen.getByRole('button', { name: /Upload CSV/i })).toBeInTheDocument();
    });

    it('displays analytics cards', () => {
      render(<Dashboard {...mockProps} />);

      expect(screen.getAllByText('Severe').length).toBeGreaterThan(0);
      expect(screen.getByText('Abandoned')).toBeInTheDocument();
    });

    it('renders patient table', () => {
      render(<Dashboard {...mockProps} />);

      expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Smith, Jane/i).length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('filters patients by search term', async () => {
      render(<Dashboard {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Search by Name, REDCap ID/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Smith, Jane/i)).not.toBeInTheDocument();
      });
    });

    it('filters patients by MRN', async () => {
      render(<Dashboard {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Search by Name, REDCap ID/i);
      fireEvent.change(searchInput, { target: { value: 'MRN001' } });

      await waitFor(() => {
        expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Smith, Jane/i)).not.toBeInTheDocument();
      });
    });

    it('clears search when input is cleared', async () => {
      render(<Dashboard {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Search by Name, REDCap ID/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getAllByText(/Smith, Jane/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('File Upload', () => {
    it('opens upload dialog when upload button clicked', () => {
      render(<Dashboard {...mockProps} />);

      const uploadButton = screen.getByRole('button', { name: /Upload CSV/i });
      fireEvent.click(uploadButton);

      // Dialog should be visible
      expect(screen.getByText(/Update Database/i)).toBeInTheDocument();
    });

    it('handles CSV file upload', async () => {
      const { parseRedcapCSV } = await import('@shared/utils');
      (parseRedcapCSV as any).mockReturnValue({
        success: true,
        data: [{
          id: '3',
          firstName: 'New',
          lastName: 'Patient',
          dob: '1995-01-01',
          mrn: 'MRN003',
          gender: 'Male',
          city: 'Brisbane',
          history: {
            date: '',
            grade: '',
            reactionSummary: '',
            symptoms: [],
            treatment: [],
            suspectedAgents: [],
            procedure: '',
            anaesthetist: '',
          },
        }],
        details: ['Skipped 2 empty or malformed row(s): 4, 8'],
      });

      render(<Dashboard {...mockProps} />);

      const uploadButton = screen.getByRole('button', { name: /Upload CSV/i });
      fireEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['mock,csv,data'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByRole('status')).toHaveTextContent('Parsing…');

      await waitFor(() => {
        expect(mockProps.onUploadPatients).toHaveBeenCalled();
      });

      const { toast } = await import('sonner');
      expect(toast.success).toHaveBeenCalledWith('Database updated', {
        description: 'Imported 1 record(s). Skipped 2 empty or malformed row(s): 4, 8',
      });
    });

    it('offers to replace the database when the CSV contains a duplicate record ID', async () => {
      const { parseRedcapCSV } = await import('@shared/utils');
      const replacementPatients = [
        mockPatients[0],
        { ...mockPatients[1], id: '3', mrn: 'MRN003' },
      ];
      (parseRedcapCSV as any).mockReturnValue({
        success: true,
        data: replacementPatients,
        details: ['Skipped 1 empty row: 4'],
      });

      render(<Dashboard {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Upload CSV/i }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['mock,csv,data'], 'replacement.csv', {
        type: 'text/csv',
        lastModified: 1_720_000_000_000,
      });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const dialog = await screen.findByRole('dialog', { name: 'Replace existing database?' });
      expect(within(dialog).getByText(
        'Replace existing database (2 records) with this export (2 records)? Unsaved testing drafts are kept.'
      )).toBeInTheDocument();
      expect(mockProps.onUploadPatients).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Replace database' }));

      await waitFor(() => {
        expect(mockProps.onUploadPatients).toHaveBeenCalledWith(
          replacementPatients,
          1_720_000_000_000
        );
      });
      const { toast } = await import('sonner');
      expect(toast.success).toHaveBeenCalledWith('Database updated', {
        description: 'Imported 2 record(s). Skipped 1 empty row: 4',
      });
      expect(screen.queryByRole('dialog', { name: 'Replace existing database?' })).not.toBeInTheDocument();
      expect(screen.queryByText('Update Database')).not.toBeInTheDocument();
    });

    it('keeps the existing database when duplicate replacement is cancelled', async () => {
      const { parseRedcapCSV } = await import('@shared/utils');
      (parseRedcapCSV as any).mockReturnValue({
        success: true,
        data: [mockPatients[0]],
      });

      render(<Dashboard {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Upload CSV/i }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['mock,csv,data'], 'duplicate.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const dialog = await screen.findByRole('dialog', { name: 'Replace existing database?' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Replace existing database?' })).not.toBeInTheDocument();
      });
      expect(mockProps.onUploadPatients).not.toHaveBeenCalled();
      const { toast } = await import('sonner');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows error message on failed CSV parse', async () => {
      const { parseRedcapCSV } = await import('@shared/utils');
      (parseRedcapCSV as any).mockReturnValue({
        success: false,
        error: 'Invalid CSV format',
      });

      render(<Dashboard {...mockProps} />);

      const uploadButton = screen.getByRole('button', { name: /Upload CSV/i });
      fireEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['invalid,data'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(async () => {
        const { toast } = await import('sonner');
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('displays correct number of patients per page', () => {
      const manyPatients = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        firstName: `${i + 1}`,
        lastName: `Patient`,
        dob: '1980-01-01',
        mrn: `MRN${String(i + 1).padStart(3, '0')}`,
        gender: 'Male',
        city: 'Sydney',
        history: {
          date: '',
          grade: '',
          reactionSummary: '',
          symptoms: [],
          treatment: [],
          suspectedAgents: [],
          procedure: '',
          anaesthetist: '',
        },
      }));

      render(<Dashboard {...mockProps} existingPatients={manyPatients} />);

      // Should show 10 patients (ITEMS_PER_PAGE) in the table
      const table = screen.getByRole('table', { name: /Patient database/i });
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeLessThanOrEqual(10);
    });

    it('navigates to next page', async () => {
      const manyPatients = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        firstName: `${i + 1}`,
        lastName: `Patient`,
        dob: '1980-01-01',
        mrn: `MRN${String(i + 1).padStart(3, '0')}`,
        gender: 'Male',
        city: 'Sydney',
        history: {
          date: '',
          grade: '',
          reactionSummary: '',
          symptoms: [],
          treatment: [],
          suspectedAgents: [],
          procedure: '',
          anaesthetist: '',
        },
      }));

      render(<Dashboard {...mockProps} existingPatients={manyPatients} />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getAllByText('Patient, 11').length).toBeGreaterThan(0);
        expect(screen.queryByText('Patient, 1')).not.toBeInTheDocument();
      });
    });

    it('navigates to previous page', async () => {
      const manyPatients = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        firstName: `${i + 1}`,
        lastName: `Patient`,
        dob: '1980-01-01',
        mrn: `MRN${String(i + 1).padStart(3, '0')}`,
        gender: 'Male',
        city: 'Sydney',
        history: {
          date: '',
          grade: '',
          reactionSummary: '',
          symptoms: [],
          treatment: [],
          suspectedAgents: [],
          procedure: '',
          anaesthetist: '',
        },
      }));

      render(<Dashboard {...mockProps} existingPatients={manyPatients} />);

      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getAllByText('Patient, 11').length).toBeGreaterThan(0);
      });

      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /Previous/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getAllByText('Patient, 1').length).toBeGreaterThan(0);
        expect(screen.queryByText('Patient, 11')).not.toBeInTheDocument();
      });
    });
  });

  describe('Patient Interactions', () => {
    it('calls onSelectPatient when patient is clicked', async () => {
      render(<Dashboard {...mockProps} />);

      const table = screen.getByRole('table', { name: /Patient database/i });
      const patientRow = within(table).getAllByText(/Doe, John/i)[0];
      fireEvent.click(patientRow);

      await waitFor(() => {
        expect(mockProps.onSelectPatient).toHaveBeenCalledWith(mockProps.existingPatients[0]);
      });
    });
  });

  describe('Advanced Filters', () => {
    it('toggles advanced filters panel', () => {
      render(<Dashboard {...mockProps} />);

      const filtersButton = screen.getByText(/Filters/i);
      fireEvent.click(filtersButton);

      expect(screen.getByRole('button', { name: /Severity/i })).toBeInTheDocument();
    });

    it('filters patients by grade', async () => {
      render(<Dashboard {...mockProps} />);

      const filtersButton = screen.getByText(/Filters/i);
      fireEvent.click(filtersButton);

      const severityTrigger = screen.getByRole('button', { name: /Severity/i });
      fireEvent.click(severityTrigger);

      const grade3Checkbox = await screen.findByRole('button', { name: /Grade III/i });
      fireEvent.click(grade3Checkbox);

      await waitFor(() => {
        expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Smith, Jane/i)).not.toBeInTheDocument();
      });
    });

    it('clears all filters', async () => {
      render(<Dashboard {...mockProps} />);

      const filtersButton = screen.getByText(/Filters/i);
      fireEvent.click(filtersButton);

      const severityTrigger = screen.getByRole('button', { name: /Severity/i });
      fireEvent.click(severityTrigger);

      const grade3Checkbox = await screen.findByRole('button', { name: /Grade III/i });
      fireEvent.click(grade3Checkbox);

      await waitFor(() => {
        expect(screen.getAllByText(/Doe, John/i).length).toBeGreaterThan(0);
      });

      const clearButton = screen.getByRole('button', { name: /Clear All/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getAllByText(/Smith, Jane/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on search input', () => {
      render(<Dashboard {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Search by Name, REDCap ID/i);
      expect(searchInput).toHaveAttribute('aria-label');
    });

    it('has proper ARIA labels on buttons', () => {
      render(<Dashboard {...mockProps} />);

      const uploadButton = screen.getAllByRole('button', { name: /Upload/i })[0];
      expect(uploadButton).toBeInTheDocument();
    });

    it('is keyboard navigable', () => {
      render(<Dashboard {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Search by Name, REDCap ID/i);
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Tab to patient
      fireEvent.keyDown(searchInput, { key: 'Tab', code: 'Tab' });
    });

    it('exposes skin test category expansion state', () => {
      render(<Dashboard {...mockProps} />);

      const categoryButton = screen.getByRole('button', {
        name: /Expand Muscle Relaxants skin test results/i,
      });
      expect(categoryButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(categoryButton);
      expect(categoryButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Analytics definitions', () => {
    it('uses the REDCap record denominator for headline severe and abandoned rates', () => {
      const patients: Patient[] = [
        {
          ...mockPatients[0],
          history: {
            ...mockPatients[0].history,
            grade: 'Grade III',
            procedureOutcome: '',
          },
        },
        {
          ...mockPatients[1],
          history: {
            ...mockPatients[1].history,
            procedureOutcome: 'Abandoned',
          },
        },
      ];
      const severeSessionLog: LogFormData = {
        ...mockLogs[0],
        outcome: 'UNSUCCESS',
        interventionType: 'Adrenaline',
      };

      render(<Dashboard {...mockProps} existingPatients={patients} recentLogs={[severeSessionLog]} />);

      const severeLabel = screen.getByText('Severe');
      const severeCard = severeLabel.closest('.border') as HTMLElement;
      expect(within(severeCard).getByText('1')).toBeInTheDocument();
      expect(within(severeCard).getByText('50.0%')).toBeInTheDocument();

      const abandonedLabel = screen.getByText('Abandoned');
      const abandonedCard = abandonedLabel.closest('.border') as HTMLElement;
      expect(within(abandonedCard).getByText('1')).toBeInTheDocument();
      expect(within(abandonedCard).getByText('50.0%')).toBeInTheDocument();
    });
  });
});
