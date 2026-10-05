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

  it('moves focus to the research status banner when the trigger was removed (R3)', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <button type="button" id="research-trigger">Save to Research Database</button>
    );

    const el = document.getElementById('research-trigger') as HTMLButtonElement;
    el.focus();

    rerender(
      <>
        <button type="button" id="research-trigger">Save to Research Database</button>
        <OutboundActionDialog
          open={true}
          onOpenChange={onOpenChange}
          actionType="research"
          artifactTitle="Clinical Report"
          workContext={mockContext}
          onConfirm={vi.fn()}
        />
      </>
    );

    // Successful submission replaces the trigger with a status banner, then
    // the dialog unmounts — production's conditional-render close path.
    rerender(
      <>
        <div id="research-submission-status" tabIndex={-1}>Submitted to Research Database</div>
      </>
    );

    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    const status = document.getElementById('research-submission-status');
    expect(document.activeElement).toBe(status);
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

  it('displays research transmitted field categories and prevents duplicate submission', () => {
    const onConfirm = vi.fn();
    render(
      <OutboundActionDialog
        open={true}
        onOpenChange={vi.fn()}
        actionType="research"
        artifactTitle="Research Payload"
        workContext={mockContext}
        onConfirm={onConfirm}
        researchAlreadySubmitted={true}
      />
    );

    expect(screen.getByText(/Transmitted Field Categories:/i)).toBeInTheDocument();
    expect(screen.getByText(/Tested drug names and skin\/intradermal test/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Patient direct identifiers \(name, REDCap ID, DOB, contacts\) are omitted/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/De-identified \(patient direct identifiers: name, REDCap ID, DOB, contacts omitted\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fully De-identified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/anonymised/i)).not.toBeInTheDocument();
    expect(screen.getByText(/This record has already been submitted/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Already Submitted/i });
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();
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
