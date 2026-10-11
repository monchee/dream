import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProtocolDoseTable } from './ProtocolDoseTable';
import { DrugProtocol } from '@features/testing/types';

describe('ProtocolDoseTable', () => {
  it('renders a generated protocol with exact IDT preparation, source deep-link, and under-review note', () => {
    const protocol: DrugProtocol = {
      id: 'iv',
      drugName: 'Pantoprazole',
      category: 'Proton Pump Inhibitors',
      testType: 'skin',
      presentation: '40 mg powder for injection',
      sptNeatConcentration: 'Neat (4 mg/mL)',
      diluent: '0.9% sodium chloride (reconstitute with 10 mL NS)',
      idtSteps: [
        { ratio: '1:1,000', concentration: '0.004 mg/mL', preparation: '0.1 mL of 0.04 mg/mL + 0.9 mL NS' },
        { ratio: '1:100', concentration: '0.04 mg/mL', preparation: '0.1 mL of 0.4 mg/mL + 0.9 mL NS' },
        { ratio: '1:10', concentration: '0.4 mg/mL', preparation: '0.1 mL neat + 0.9 mL NS' },
      ],
      challengeSteps: [],
      protocolLabel: 'IV',
      sourceSlug: 'pantoprazole',
      underReview: true,
      reviewNote: 'The Spreadsheet 2 spreadsheet labels the SPT concentration as "Neat (40 mg/mL)". This is a spreadsheet labelling error — the correct reconstituted concentration is 4 mg/mL (40 mg powder + 10 mL NS).',
      lastReviewed: '2026-03-28',
    };

    render(<ProtocolDoseTable protocol={protocol} />);

    expect(screen.getByText('Pantoprazole')).toBeInTheDocument();
    expect(screen.getByText('IV')).toBeInTheDocument();
    expect(screen.getByText('40 mg powder for injection')).toBeInTheDocument();
    expect(screen.getByText('Neat (4 mg/mL)')).toBeInTheDocument();
    expect(screen.getByText('0.9% sodium chloride (reconstitute with 10 mL NS)')).toBeInTheDocument();

    // Source link
    const sourceLink = screen.getByRole('link', { name: /View Pantoprazole protocol|Protocol/i });
    expect(sourceLink).toHaveAttribute('href', 'https://scratch.yuson.au/drugs/pantoprazole/');
    expect(sourceLink).toHaveAttribute('target', '_blank');
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Under-review badge and exact review note
    expect(screen.getByText(/Under review/i)).toBeInTheDocument();
    expect(screen.getByText('The Spreadsheet 2 spreadsheet labels the SPT concentration as "Neat (40 mg/mL)". This is a spreadsheet labelling error — the correct reconstituted concentration is 4 mg/mL (40 mg powder + 10 mL NS).')).toBeInTheDocument();

    // IDT steps in exact order with preparation strings
    const ratios = screen.getAllByRole('cell').map(c => c.textContent);
    expect(ratios).toContain('1:1,000');
    expect(ratios).toContain('0.004 mg/mL');
    expect(ratios).toContain('0.1 mL of 0.04 mg/mL + 0.9 mL NS');
    expect(ratios).toContain('1:100');
    expect(ratios).toContain('0.04 mg/mL');
    expect(ratios).toContain('0.1 mL of 0.4 mg/mL + 0.9 mL NS');
    expect(ratios).toContain('1:10');
    expect(ratios).toContain('0.4 mg/mL');
    expect(ratios).toContain('0.1 mL neat + 0.9 mL NS');
  });

  it('renders pharmacy verification warning when flagged', () => {
    const protocol: DrugProtocol = {
      id: 'iv',
      drugName: 'Cephalexin',
      category: 'Cephalosporins',
      testType: 'skin',
      presentation: '500 mg powder for injection',
      sptNeatConcentration: 'Neat (50 mg/mL)',
      diluent: '0.9% sodium chloride (reconstitute with 10 mL WFI)',
      idtSteps: [
        { ratio: '1:100', concentration: '0.5 mg/mL' },
        { ratio: '1:10', concentration: '5 mg/mL' },
      ],
      challengeSteps: [],
      protocolLabel: 'IV',
      needsPharmacyVerification: true,
    };

    render(<ProtocolDoseTable protocol={protocol} />);

    expect(screen.getByText(/Confirm preparation with pharmacy/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a DREAM-only protocol without a fake source link', () => {
    const protocol: DrugProtocol = {
      id: 'ppl',
      drugName: 'Penicillin Major',
      category: 'Penicillins',
      testType: 'skin',
      presentation: 'Ampoule + 1 mL diluent',
      sptNeatConcentration: 'Neat (8.6 x 10^-5 M)',
      diluent: 'Phosphate-buffered saline (1 mL supplied diluent — not plain saline)',
      idtSteps: [
        { ratio: '1:100', concentration: '8.6 x 10^-7 M' },
      ],
      challengeSteps: [],
      protocolLabel: 'PPL',
    };

    render(<ProtocolDoseTable protocol={protocol} />);

    expect(screen.getByText('Penicillin Major')).toBeInTheDocument();
    expect(screen.getByText('PPL')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/scratch\.yuson\.au/i)).not.toBeInTheDocument();
  });

  it('renders both under-review and pharmacy-verification warnings when both flags apply', () => {
    const protocol: DrugProtocol = {
      id: 'test',
      drugName: 'Experimental Agent',
      category: 'Others',
      testType: 'experimental',
      presentation: '10 mg/mL vial',
      sptNeatConcentration: 'Neat (10 mg/mL)',
      diluent: '0.9% sodium chloride',
      idtSteps: [],
      challengeSteps: [],
      protocolLabel: 'Test',
      underReview: true,
      reviewNote: 'Safety review in progress for concentration.',
      needsPharmacyVerification: true,
    };

    render(<ProtocolDoseTable protocol={protocol} />);

    expect(screen.getByText(/Under review/i)).toBeInTheDocument();
    expect(screen.getByText('Safety review in progress for concentration.')).toBeInTheDocument();
    expect(screen.getByText(/Confirm preparation with pharmacy/i)).toBeInTheDocument();
  });
});
