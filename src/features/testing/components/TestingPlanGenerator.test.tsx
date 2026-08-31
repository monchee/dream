import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TestingPlanGenerator from './TestingPlanGenerator';
import { createMockPatient } from '@/src/test/factories/patientFactory';
import { TESTING_PLAN_BUILDER_DRAFTS_KEY } from '@shared/utils/ttlStorage';

const drugCategories = {
  'Muscle Relaxants': ['Cis-atracurium'],
  Penicillins: ['Cephalexin'],
  Hypnotics: ['Ketamine'],
  'Proton Pump Inhibitors': ['Pantoprazole'],
  Others: ['Chlorhexidine', 'Latex'],
};

const patient = createMockPatient({
  id: 'PLAN-001',
  history: {
    ...createMockPatient().history,
    date: '2024-03-15',
    testingPlan: [],
    medications: [],
  },
});

function renderGenerator(onPreview = vi.fn(), targetPatient = patient) {
  render(
    <TestingPlanGenerator
      patient={targetPatient}
      drugCategories={drugCategories}
      onPreview={onPreview}
    />
  );
  return { onPreview };
}

describe('TestingPlanGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('opens by default, summarizes selected drugs, and exposes pressed state', () => {
    renderGenerator();

    expect(screen.getByText('Select Drugs for Testing')).toBeInTheDocument();
    expect(screen.getByText('2 drugs selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chlorhexidine/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Date of Reaction')).toHaveAttribute('max');
  });

  it('shows when its plan-builder draft was saved', async () => {
    renderGenerator();

    const indicator = await screen.findByText(/Draft saved · \d{2}:\d{2}/);
    expect(indicator).toHaveAttribute('aria-live', 'polite');
  });

  it('passes the selected protocol index to preview', async () => {
    const { onPreview } = renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: 'Ketamine' }));
    expect(screen.getByText('Protocol Choices')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox', { name: 'Ketamine' }));
    fireEvent.click(await screen.findByRole('option', { name: /1:100 start/i }));

    fireEvent.click(screen.getByRole('button', { name: /Preview & Print Request Form/i }));

    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({
      selectedProtocols: expect.objectContaining({ Ketamine: 1 }),
    }));
  });

  it('shows pharmacy verification only for a selected flagged drug', () => {
    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: 'Cephalexin' }));

    const warning = screen.getAllByText(/Confirm preparation with pharmacy/i);
    expect(warning.length).toBeGreaterThan(0);
    expect(within(screen.getByRole('button', { name: /Cephalexin/i })).getByText(/Confirm preparation with pharmacy/)).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Chlorhexidine/i })).queryByText(/Confirm preparation with pharmacy/)).not.toBeInTheDocument();
  });

  it('restores a per-patient builder draft from TTL storage', async () => {
    localStorage.setItem(TESTING_PLAN_BUILDER_DRAFTS_KEY, JSON.stringify({
      savedAt: Date.now(),
      value: {
        [patient.id]: {
          selectedDrugs: ['Ketamine'],
          selectedProtocols: { Ketamine: 1 },
          customDrugs: [],
          notes: 'Restore this plan',
          urgent: true,
          reactionDate: '2024-02-10',
          documentsToChase: {
            tryptases: true,
            anaestheticChart: false,
            other: false,
            otherText: '',
          },
        },
      },
    }));

    const { onPreview } = renderGenerator();

    await waitFor(() => expect(screen.getByDisplayValue('Restore this plan')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Ketamine' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Preview & Print Request Form/i }));
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({
      selectedDrugs: ['Ketamine'],
      selectedProtocols: { Ketamine: 1 },
      urgent: true,
      reactionDate: '2024-02-10',
    }));
  });

  it('keeps custom drug toggle and remove as separate accessible buttons', () => {
    renderGenerator();

    fireEvent.change(screen.getByPlaceholderText('Add custom drug...'), { target: { value: 'Test Custom' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add custom drug' }));

    expect(screen.getByRole('button', { name: 'Test Custom' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('(not listed)')).not.toBeInTheDocument();
    const removeButton = screen.getByRole('button', { name: 'Remove custom drug Test Custom' });
    expect(removeButton).toBeInTheDocument();

    fireEvent.click(removeButton);
    expect(screen.queryByRole('button', { name: 'Test Custom' })).not.toBeInTheDocument();
  });

  it('deduplicates known drugs entered as custom drugs', () => {
    renderGenerator();

    fireEvent.change(screen.getByPlaceholderText('Add custom drug...'), { target: { value: 'ketamine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add custom drug' }));

    expect(screen.getByText('Ketamine is already in the master list and has been selected from its category.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ketamine' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Remove custom drug ketamine' })).not.toBeInTheDocument();
  });

  it('preselects Cis-atracurium when reaction history uses the unhyphenated REDCap spelling', () => {
    const patientWithReactionDrug = createMockPatient({
      id: 'PLAN-CISATRA',
      history: {
        ...patient.history,
        testingPlan: [],
        medications: ['Cisatracurium'],
      },
    });

    renderGenerator(vi.fn(), patientWithReactionDrug);

    expect(screen.getByRole('button', { name: /Cis-atracurium/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('auto-selects and badges a drug added only as a suspected agent', () => {
    const patientWithManualSuspect = createMockPatient({
      id: 'PLAN-SUSPECT',
      history: {
        ...patient.history,
        medications: [],
        preInductionDrugs: [],
        postInductionDrugs: [],
        suspectedAgents: ['Ketamine'],
      },
    });

    renderGenerator(vi.fn(), patientWithManualSuspect);

    const ketamine = screen.getByRole('button', { name: /Ketamine/i });
    expect(ketamine).toHaveAttribute('aria-pressed', 'true');
    expect(within(ketamine).getByLabelText('Given at time of reaction')).toBeInTheDocument();
  });

  it('surfaces REDCap Others text and adds it as a selected custom item', async () => {
    const patientWithRedcapOther = createMockPatient({
      id: 'PLAN-REDCAP-OTHER',
      history: {
        ...patient.history,
        testingPlanCustom: 'Sodium citrate flush',
      },
    });

    renderGenerator(vi.fn(), patientWithRedcapOther);

    expect(screen.getByText('From REDCap — Others (not listed)')).toBeInTheDocument();
    expect(screen.getByText('Sodium citrate flush')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add as custom item/i }));

    await waitFor(() => {
      expect(screen.queryByText('From REDCap — Others (not listed)')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Sodium citrate flush.*not listed/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('(not listed)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove custom drug Sodium citrate flush' })).toBeInTheDocument();
  });

  it('renders inline protocol dose tables with exact clinical strings and source links for selected listed drugs', () => {
    renderGenerator();

    // Chlorhexidine is preselected by default
    const tableSection = screen.getByTestId('selected-protocol-details');
    expect(tableSection).toBeInTheDocument();

    expect(within(tableSection).getByText('Chlorhexidine')).toBeInTheDocument();
    expect(within(tableSection).getByText('0.02% solution (0.2 mg/mL) or 0.1% solution (1 mg/mL)')).toBeInTheDocument();
    expect(within(tableSection).getByText('Neat (0.2 mg/mL)')).toBeInTheDocument();
    expect(within(tableSection).getByText('0.9% sodium chloride')).toBeInTheDocument();
    expect(within(tableSection).getByText('0.1 mL of 0.02 mg/mL + 0.9 mL NS')).toBeInTheDocument();

    const scratchLink = within(tableSection).getByRole('link', { name: /View Chlorhexidine on SCRATCH/i });
    expect(scratchLink).toHaveAttribute('href', 'https://scratch.yuson.au/drugs/chlorhexidine/');
  });

  it('renders under-review badge, reviewNote, and source link when selecting a generated drug under review', () => {
    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: 'Pantoprazole' }));

    const tableSection = screen.getByTestId('selected-protocol-details');
    expect(within(tableSection).getByText('Pantoprazole')).toBeInTheDocument();
    expect(within(tableSection).getByText(/Under review/i)).toBeInTheDocument();
    expect(within(tableSection).getByText('The Spreadsheet 2 spreadsheet labels the SPT concentration as "Neat (40 mg/mL)". This is a spreadsheet labelling error — the correct reconstituted concentration is 4 mg/mL (40 mg powder + 10 mL NS).')).toBeInTheDocument();

    const scratchLink = within(tableSection).getByRole('link', { name: /View Pantoprazole on SCRATCH/i });
    expect(scratchLink).toHaveAttribute('href', 'https://scratch.yuson.au/drugs/pantoprazole/');

    // IDT steps exact strings
    expect(within(tableSection).getByText('0.1 mL of 0.04 mg/mL + 0.9 mL NS')).toBeInTheDocument();
    expect(within(tableSection).getByText('0.1 mL of 0.4 mg/mL + 0.9 mL NS')).toBeInTheDocument();
    expect(within(tableSection).getByText('0.1 mL neat + 0.9 mL NS')).toBeInTheDocument();
  });

  it('updates the active inline dose table when switching protocol choices on a multi-protocol drug', async () => {
    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: 'Ketamine' }));

    const tableSection = screen.getByTestId('selected-protocol-details');
    expect(within(tableSection).getByText('Ketamine')).toBeInTheDocument();
    expect(within(tableSection).getByText('1:1,000 start')).toBeInTheDocument();
    expect(within(tableSection).getByText('1:1,000')).toBeInTheDocument();

    // Switch protocol to 1:100 start
    fireEvent.click(screen.getByRole('combobox', { name: 'Ketamine' }));
    fireEvent.click(await screen.findByRole('option', { name: /1:100 start/i }));

    expect(within(tableSection).getByText('1:100 start')).toBeInTheDocument();
    expect(within(tableSection).getByText('1:100')).toBeInTheDocument();

    // Ketamine is SCRATCH-sourced since the tranche-1 migration, so its
    // protocol detail links to the handbook page
    const scratchLink = within(tableSection).getByRole('link', { name: /View Ketamine on SCRATCH/i });
    expect(scratchLink).toHaveAttribute('href', 'https://scratch.yuson.au/drugs/ketamine/');
  });

  it('fails closed and shows accessible review alert when restored draft contains invalid protocol index', async () => {
    localStorage.setItem(TESTING_PLAN_BUILDER_DRAFTS_KEY, JSON.stringify({
      savedAt: Date.now(),
      value: {
        [patient.id]: {
          selectedDrugs: ['Ketamine'],
          selectedProtocols: { Ketamine: 99 }, // Out of range
          customDrugs: [],
          notes: '',
          urgent: false,
          reactionDate: '2024-02-10',
          documentsToChase: {
            tryptases: false,
            anaestheticChart: false,
            other: false,
            otherText: '',
          },
        },
      },
    }));

    const { onPreview } = renderGenerator();

    await waitFor(() => {
      expect(screen.getByTestId('protocol-review-required-Ketamine')).toBeInTheDocument();
    });

    const alert = screen.getByTestId('protocol-review-required-Ketamine');
    expect(alert).toHaveTextContent('⚠ Ketamine — Protocol selection requires review');

    // Verify guessed dose table is NOT rendered
    expect(screen.queryByTestId('protocol-dose-table-Ketamine')).not.toBeInTheDocument();

    // Verify dropdown shows review required indicator
    expect(screen.getByText('Review required')).toBeInTheDocument();

    // Verify persistent alert near Preview & Print button is visible
    const buttonAlert = screen.getByTestId('protocol-selection-review-alert');
    expect(buttonAlert).toBeInTheDocument();
    expect(buttonAlert).toHaveTextContent('Protocol selection requires review. A valid protocol option must be selected before previewing or printing.');

    // Verify onPreview is NOT called when clicking Preview & Print with an invalid restored protocol index
    fireEvent.click(screen.getByRole('button', { name: /Preview & Print Request Form/i }));
    expect(onPreview).not.toHaveBeenCalled();

    // Now select a valid protocol option from dropdown
    fireEvent.click(screen.getByRole('combobox', { name: 'Ketamine' }));
    fireEvent.click(await screen.findByRole('option', { name: /1:100 start/i }));

    // Verify review alert near button is cleared and onPreview succeeds
    expect(screen.queryByTestId('protocol-selection-review-alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Preview & Print Request Form/i }));
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({
      selectedDrugs: ['Ketamine'],
      selectedProtocols: expect.objectContaining({ Ketamine: 1 }),
    }));
  });
});
