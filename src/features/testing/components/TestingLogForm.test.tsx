import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestingLogForm from './TestingLogForm';
import { LogFormData } from '@shared/types';

const mockFormData: LogFormData = {
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
      sptWheal: '3',
      idtResults: ['5', '8', '10'],
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
  plan: 'Normal plan',
};

const mockDrugCategories = {
  'Muscle Relaxants': ['Rocuronium', 'Suxamethonium'],
  'Anaesthetics': ['Propofol', 'Fentanyl'],
  'Others': [],
};

const mockSymptomOptions = ['Rash', 'Urticaria', 'Bronchospasm', 'Hypotension'];
const mockInterventionOptions = ['Adrenaline', 'Antihistamine', 'Corticosteroid', 'Fluids'];

const TestWrapper = ({ initialData, props }: { initialData: LogFormData; props: any }) => {
  const [formData, setFormData] = React.useState(initialData);
  const handleSetFormData = (update: any) => {
    if (typeof update === 'function') {
      setFormData(prev => {
        const next = update(prev);
        props.setFormData?.(next);
        return next;
      });
    } else {
      setFormData(update);
      props.setFormData?.(update);
    }
  };

  return <TestingLogForm {...props} formData={formData} setFormData={handleSetFormData as any} />;
};

describe('TestingLogForm (Indexed Workflow)', () => {
  const mockProps = {
    formData: mockFormData,
    setFormData: vi.fn(),
    onSubmit: vi.fn(),
    drugCategories: mockDrugCategories,
    symptomOptions: mockSymptomOptions,
    interventionOptions: mockInterventionOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Index & Navigation', () => {
    it('renders all 7 workflow sections in the navigation index', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      expect(screen.getByRole('button', { name: /1\.\s*Patient and visit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2\.\s*SPT and IDT/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /3\.\s*Drug challenge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /4\.\s*Serial serum tryptase/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /5\.\s*Assessment and plan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /6\.\s*Nursing notes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /7\.\s*Review and save/i })).toBeInTheDocument();
    });

    it('sets aria-current="step" on the active section', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      const firstSectionBtn = screen.getByRole('button', { name: /1\.\s*Patient and visit/i });
      expect(firstSectionBtn).toHaveAttribute('aria-current', 'step');

      const secondSectionBtn = screen.getByRole('button', { name: /2\.\s*SPT and IDT/i });
      expect(secondSectionBtn).not.toHaveAttribute('aria-current');

      fireEvent.click(secondSectionBtn);
      expect(secondSectionBtn).toHaveAttribute('aria-current', 'step');
      expect(firstSectionBtn).not.toHaveAttribute('aria-current');
    });

    it('navigates between sections without mutating or validating formData', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      // Step to Section 2 (SPT and IDT)
      const nextBtns = screen.getAllByRole('button', { name: /Next Section/i });
      fireEvent.click(nextBtns[0]);

      expect(screen.getByText(/SPT & IDT Panel/i)).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();

      // Step back
      const prevBtns = screen.getAllByRole('button', { name: /Previous Section/i });
      fireEvent.click(prevBtns[0]);

      expect(screen.getByText('Doe, John')).toBeInTheDocument();
    });
  });

  describe('Section 1: Patient and Visit', () => {
    it('keeps Next Section on the initial section 1 visit', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      expect(screen.getByRole('button', { name: /^Next Section/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Save Clinical Record/i })).not.toBeInTheDocument();
    });

    it('renders form with patient information', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      expect(screen.getByText('Doe, John')).toBeInTheDocument();
      expect(screen.getByText(/MRN001/)).toBeInTheDocument();
    });

    it('renders an alphanumeric MRN verbatim, never lowercased', () => {
      const mixedCaseData = { ...mockFormData, mrn: 'MrN00aB1' };
      render(<TestWrapper initialData={mixedCaseData} props={mockProps} />);

      const mrnElement = screen.getByText('MrN00aB1');
      expect(mrnElement).toBeInTheDocument();
      expect(mrnElement.className).not.toMatch(/\blowercase\b/);
    });

    it('renders editable identity fields when isDirectEntry is true', () => {
      render(<TestWrapper initialData={mockFormData} props={{ ...mockProps, isDirectEntry: true }} />);

      expect(screen.getByLabelText(/REDCap ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    });

    it('updates form state when typing into direct entry identity fields', () => {
      const emptyData: LogFormData = {
        ...mockFormData,
        mrn: '',
        firstName: '',
        lastName: '',
        dob: '',
      };
      render(<TestWrapper initialData={emptyData} props={{ ...mockProps, isDirectEntry: true }} />);

      fireEvent.change(screen.getByLabelText(/^REDCap ID/i), { target: { value: 'MRN999' } });
      fireEvent.change(screen.getByLabelText(/^First Name/i), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText(/^Last Name/i), { target: { value: 'Smith' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1985-05-12' } });

      expect(mockProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({
        mrn: 'MRN999',
      }));
    });
  });

  describe('Section 2: SPT and IDT', () => {
    it('renders drug test rows and controls', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /2\.\s*SPT and IDT/i }));

      expect(screen.getAllByText('Rocuronium').length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/Histamine \(SPT\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Saline \(SPT\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Saline \(IDT\)/i)).toBeInTheDocument();
    });

    it('allows adding drugs from categories and "Other" drug', async () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /2\.\s*SPT and IDT/i }));

      const suxButton = screen.getByText('Suxamethonium');
      fireEvent.click(suxButton);

      await waitFor(() => {
        const panelRows = screen.getAllByText('Suxamethonium');
        expect(panelRows.length).toBeGreaterThan(0);
      });

      const otherButton = screen.getByRole('button', { name: /^Other$/ });
      fireEvent.click(otherButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Specify name/i)).toBeInTheDocument();
      });
    });

    it('highlights positive tests (≥3mm) with positive indicators', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /2\.\s*SPT and IDT/i }));

      expect(screen.getAllByText('+POS').length).toBeGreaterThan(0);
    });

    it('clears all selected drugs when Clear All is clicked', async () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /2\.\s*SPT and IDT/i }));

      const rocuroniumBtn = screen.getByRole('button', { name: 'Rocuronium' });
      expect(rocuroniumBtn).toHaveAttribute('aria-pressed', 'true');

      const clearAllButton = screen.getByRole('button', { name: /Clear All/i });
      fireEvent.click(clearAllButton);

      await waitFor(() => {
        expect(rocuroniumBtn).toHaveAttribute('aria-pressed', 'false');
      });
      expect(mockProps.setFormData).toHaveBeenCalledWith(expect.objectContaining({
        testPanel: [],
      }));
    });
  });

  describe('Section 3: Drug Challenge', () => {
    it('renders challenge toggle and shows challenge fields when enabled', async () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /3\.\s*Drug challenge/i }));

      const challengeToggle = screen.getByRole('switch', { name: /Drug Challenge/i });
      expect(challengeToggle).toBeInTheDocument();

      fireEvent.click(challengeToggle);

      await waitFor(() => {
        expect(screen.getByText(/Select Challenge Drug/i)).toBeInTheDocument();
      });
    });

    it('allows documenting observed symptoms and interventions on reaction', async () => {
      const challengeData = {
        ...mockFormData,
        proceedToChallenge: true,
      };
      render(<TestWrapper initialData={challengeData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /3\.\s*Drug challenge/i }));

      const reactionButton = screen.getByText('Reaction Occurred');
      fireEvent.click(reactionButton);

      await waitFor(() => {
        expect(screen.getByText(/Observed Symptoms/i)).toBeInTheDocument();
        expect(screen.getByText(/Treatment Required/i)).toBeInTheDocument();
      });

      const rashButton = screen.getByText('Rash');
      fireEvent.click(rashButton);

      await waitFor(() => {
        expect(rashButton).toHaveClass('bg-status-danger');
      });
    });
  });

  describe('Section 7: Review and Save / Form Submission', () => {
    it('calls onSubmit when valid form is saved in Review and Save', async () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);
      fireEvent.click(screen.getByRole('button', { name: /7\.\s*Review and save/i }));

      const saveButtons = screen.getAllByRole('button', { name: /Save Clinical Record/i });
      fireEvent.click(saveButtons[0]);

      expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('redirects to section 1 and exposes a direct save action after missing patient details', async () => {
      const invalidData = {
        ...mockFormData,
        mrn: '',
        firstName: '',
        lastName: '',
      };
      render(<TestWrapper initialData={invalidData} props={{ ...mockProps, isDirectEntry: true }} />);

      // Go to review & save section
      fireEvent.click(screen.getByRole('button', { name: /7\.\s*Review and save/i }));

      const saveButtons = screen.getAllByRole('button', { name: /Save Clinical Record/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Patient Identity')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Save Clinical Record/i })).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('saves immediately from section 1 after completing patient details', async () => {
      const invalidData = {
        ...mockFormData,
        mrn: '',
        firstName: '',
        lastName: '',
      };
      render(<TestWrapper initialData={invalidData} props={{ ...mockProps, isDirectEntry: true }} />);

      fireEvent.click(screen.getByRole('button', { name: /7\.\s*Review and save/i }));
      fireEvent.click(screen.getAllByRole('button', { name: /Save Clinical Record/i })[0]);

      await waitFor(() => {
        expect(screen.getByText('Patient Identity')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/^REDCap ID/i), { target: { value: 'MRN999' } });
      fireEvent.change(screen.getByLabelText(/^First Name/i), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText(/^Last Name/i), { target: { value: 'Smith' } });
      fireEvent.click(screen.getByRole('button', { name: /Save Clinical Record/i }));

      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    it('redirects to the remaining invalid section from the direct save action', async () => {
      const invalidData = {
        ...mockFormData,
        mrn: '',
        firstName: '',
        lastName: '',
        testPanel: [],
      };
      render(<TestWrapper initialData={invalidData} props={{ ...mockProps, isDirectEntry: true }} />);

      fireEvent.click(screen.getByRole('button', { name: /7\.\s*Review and save/i }));
      fireEvent.click(screen.getAllByRole('button', { name: /Save Clinical Record/i })[0]);

      await waitFor(() => {
        expect(screen.getByText('Patient Identity')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/^REDCap ID/i), { target: { value: 'MRN999' } });
      fireEvent.change(screen.getByLabelText(/^First Name/i), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText(/^Last Name/i), { target: { value: 'Smith' } });
      fireEvent.click(screen.getByRole('button', { name: /Save Clinical Record/i }));

      await waitFor(() => {
        expect(screen.getByText(/SPT & IDT Panel/i)).toBeInTheDocument();
      });
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('jumps to drug test panel when panel is invalid', async () => {
      const invalidPanelData = { ...mockFormData, testPanel: [] };
      render(<TestWrapper initialData={invalidPanelData} props={mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /7\.\s*Review and save/i }));
      const saveButtons = screen.getAllByRole('button', { name: /Save Clinical Record/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        // Section 2 (SPT/IDT) active
        expect(screen.getByText(/SPT & IDT Panel/i)).toBeInTheDocument();
      });
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and minimum 44px touch targets on navigation controls', () => {
      render(<TestWrapper initialData={mockFormData} props={mockProps} />);

      const sectionBtns = screen.getAllByRole('button', { name: /^[1-7]\.\s/i });
      expect(sectionBtns.length).toBe(7);
      sectionBtns.forEach(btn => {
        expect(btn.className).toMatch(/min-h-\[44px\]/);
      });
    });
  });
});
