import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SKIN_TEST_POSITIVE_THRESHOLD } from '@shared/utils/constants';
import { DrugTestGrid } from './DrugTestGrid';

const callbacks = {
  onUpdate: vi.fn(),
  onSelectProtocol: vi.fn(),
  onRemove: vi.fn(),
  onAddCustomIdtStep: vi.fn(),
  onRemoveCustomIdtStep: vi.fn(),
};

const renderGrid = (sptWheal: string) => render(
  <DrugTestGrid
    testPanel={[{
      drugName: 'Rocuronium',
      protocolIndex: 0,
      sptWheal,
      idtResults: ['', ''],
    }]}
    drugToCategoryMap={{ Rocuronium: 'Muscle Relaxants' }}
    {...callbacks}
  />,
);

describe('DrugTestGrid', () => {
  it('shows a +POS badge only when the SPT wheal reaches the positive threshold', () => {
    const { rerender } = renderGrid(String(SKIN_TEST_POSITIVE_THRESHOLD - 1));

    expect(screen.queryByText('+POS')).not.toBeInTheDocument();

    rerender(
      <DrugTestGrid
        testPanel={[{
          drugName: 'Rocuronium',
          protocolIndex: 0,
          sptWheal: String(SKIN_TEST_POSITIVE_THRESHOLD),
          idtResults: ['', ''],
        }]}
        drugToCategoryMap={{ Rocuronium: 'Muscle Relaxants' }}
        {...callbacks}
      />,
    );

    expect(screen.getByText('+POS')).toHaveClass('pointer-events-none');
  });

  it('gives each clinical measurement field an explicit accessible name', () => {
    renderGrid('');

    expect(screen.getByLabelText('Rocuronium SPT wheal measurement in millimetres')).toBeInTheDocument();
    expect(screen.getByLabelText('Rocuronium IDT 1:100 wheal measurement in millimetres')).toBeInTheDocument();
  });
});
