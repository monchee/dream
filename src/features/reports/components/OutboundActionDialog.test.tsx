import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OutboundActionDialog } from './OutboundActionDialog';
import { createClinicalWorkContext } from '@shared/types/clinicalWorkContext';

const mockContext = createClinicalWorkContext({
  source: 'database',
  firstName: 'Jane',
  lastName: 'Doe',
  mrn: 'MRN12345',
  dob: '1980-05-15',
  testingVisitDate: '2026-03-18',
});

describe('OutboundActionDialog', () => {
  it('does not trigger onConfirm before user confirms', () => {
    const onConfirm = vi.fn();
    render(
      <OutboundActionDialog
        open={true}
        onOpenChange={vi.fn()}
        actionType="print"
        artifactTitle="Clinical Report"
        workContext={mockContext}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Confirm Print: Clinical Report')).toBeInTheDocument();
    expect(screen.getByText('DOE, Jane')).toBeInTheDocument();
    expect(screen.getByText('MRN12345')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('restores focus to the triggering control when the dialog unmounts on close (R3)', async () => {
    const onOpenChange = vi.fn();
    // Production sequence: the trigger exists and holds focus BEFORE the
    // dialog appears, then the dialog is added, then closed by unmounting it.
    const { rerender } = render(
      <button type="button" id="email-trigger">Send via Email</button>
    );

    const el = document.getElementById('email-trigger') as HTMLButtonElement;
    el.focus();
    expect(document.activeElement).toBe(el);

    rerender(
      <>
        <button type="button" id="email-trigger">Send via Email</button>
        <OutboundActionDialog
          open={true}
          onOpenChange={onOpenChange}
          actionType="email"
          artifactTitle="Clinical Report"
          workContext={mockContext}
          onConfirm={vi.fn()}
        />
      </>
    );

    rerender(
      <>
        <button type="button" id="email-trigger">Send via Email</button>
      </>
    );

    // Focus restoration happens on the next animation frame after unmount
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    expect(document.activeElement).toBe(el);
  });

  it('restores focus to the email trigger when the dialog unmounts on close (R3)', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <button type="button" id="email-trigger">Send via Email</button>
    );

    const el = document.getElementById('email-trigger') as HTMLButtonElement;
    el.focus();

    rerender(
      <>
        <button type="button" id="email-trigger">Send via Email</button>
        <OutboundActionDialog
          open={true}
          onOpenChange={onOpenChange}
          actionType="email"
          artifactTitle="Clinical Report"
          workContext={mockContext}
          onConfirm={vi.fn()}
        />
      </>
    );

    rerender(
      <>
        <button type="button" id="email-trigger">Send via Email</button>
      </>
    );

    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    expect(document.activeElement).toBe(el);
  });

  it('triggers onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <OutboundActionDialog
        open={true}
        onOpenChange={onOpenChange}
        actionType="copy"
        artifactTitle="Patient Handout"
        workContext={mockContext}
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Copy to Clipboard/i });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel button is clicked without side effects', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <OutboundActionDialog
        open={true}
        onOpenChange={onOpenChange}
        actionType="email"
        artifactTitle="Powerchart Letter"
        workContext={mockContext}
        onConfirm={onConfirm}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
