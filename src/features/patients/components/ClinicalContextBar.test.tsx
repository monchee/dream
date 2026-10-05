import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RedactProvider, useRedact } from '@features/reports/hooks/useRedact';
import { ClinicalContextBar } from './ClinicalContextBar';
import { createClinicalWorkContext } from '@shared/types/clinicalWorkContext';

const baseProps = {
  firstName: 'Jane',
  lastName: 'Doe',
  mrn: 'MrN00aB1',
};

function RedactionToggle() {
  const { toggleRedact } = useRedact();
  return <button onClick={toggleRedact}>Redact identity</button>;
}

/** The desktop rail (CSS-hidden on mobile, but present in the DOM). */
function getDesktopRail(container: HTMLElement) {
  return container.querySelector('.hidden.md\\:block') as HTMLElement;
}

/** The mobile rail. */
function getMobileRail(container: HTMLElement) {
  return container.querySelector('.md\\:hidden') as HTMLElement;
}

describe('ClinicalContextBar', () => {
  it('renders with accessible aria-label "Current patient and encounter"', () => {
    render(<ClinicalContextBar {...baseProps} />);
    const bar = screen.getByLabelText('Current patient and encounter');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveTextContent('DOE, Jane');
  });

  it('renders MRN font-mono without forcing lowercasing in both mobile and desktop rails', () => {
    render(<ClinicalContextBar {...baseProps} />);
    const mrnElements = screen.getAllByText('MrN00aB1');
    // Both the mobile and the desktop rail show the REDCap ID
    expect(mrnElements.length).toBe(2);
    mrnElements.forEach((mrn) => {
      expect(mrn).toBeInTheDocument();
      expect(mrn).toHaveClass('font-mono');
    });
  });

  it('shows the primary identity fields (name, REDCap ID, DOB) in both rails without interaction', () => {
    const { container } = render(<ClinicalContextBar {...baseProps} dob="1985-04-12" />);

    const desktop = getDesktopRail(container);
    expect(within(desktop).getByText('DOE, Jane')).toBeInTheDocument();
    expect(within(desktop).getByText('DOB 12/04/1985')).toBeInTheDocument();

    const mobile = getMobileRail(container);
    expect(within(mobile).getByText('DOE, Jane')).toBeInTheDocument();
    expect(within(mobile).getByText('DOB 12/04/1985')).toBeInTheDocument();
  });

  it('renders accessible Details buttons and opens Popover with secondary context values', () => {
    render(
      <ClinicalContextBar
        {...baseProps}
        dob="1985-04-12"
        reactionDate="2025-06-10"
        visitDate="2026-03-18"
        source="direct"
      />
    );

    const detailsButtons = screen.getAllByRole('button', { name: 'View patient details' });
    // One per rail (mobile + desktop)
    expect(detailsButtons.length).toBe(2);
    detailsButtons.forEach((btn) => expect(btn).toHaveTextContent('Details'));

    // Popover is closed initially
    expect(screen.queryByText('Patient Details')).not.toBeInTheDocument();

    // Click Details button to open Popover
    fireEvent.click(detailsButtons[0]);

    // Verify Popover content displays full patient details
    expect(screen.getByText('Patient Details')).toBeInTheDocument();
    expect(screen.getByText('12/04/1985')).toBeInTheDocument();
    expect(screen.getByText('10/06/2025')).toBeInTheDocument();
    expect(screen.getByText('18/03/2026')).toBeInTheDocument();
    expect(screen.getAllByText('Direct Entry').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps secondary dates out of the rails (they live in the details disclosure)', () => {
    render(
      <ClinicalContextBar
        {...baseProps}
        dob="1985-04-12"
        reactionDate="2025-06-10"
        visitDate="2026-03-18"
      />
    );

    // R2: primary fields are visible in the rail; secondary dates are not
    const desktop = getDesktopRail(document.body);
    expect(within(desktop).queryByText('Reaction 10/06/2025')).not.toBeInTheDocument();
    expect(within(desktop).queryByText('Visit 18/03/2026')).not.toBeInTheDocument();

    // They are available in the disclosure
    fireEvent.click(screen.getAllByRole('button', { name: 'View patient details' })[0]);
    expect(screen.getByText('10/06/2025')).toBeInTheDocument();
    expect(screen.getByText('18/03/2026')).toBeInTheDocument();
  });

  it('renders clear fallbacks when DOB, MRN, and Name are missing', () => {
    render(<ClinicalContextBar />);

    expect(screen.getAllByText('DOB not recorded').length).toBe(2);
    expect(screen.getAllByText('NO IDENTITY ENTERED').length).toBe(2);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);

    // Open Details popover and verify fallbacks
    const detailsBtn = screen.getAllByRole('button', { name: 'View patient details' })[0];
    fireEvent.click(detailsBtn);

    expect(screen.getAllByText('not recorded').length).toBeGreaterThanOrEqual(1);
  });

  it('renders direct-entry badge for direct source and displays REDCap ID label', () => {
    const context = createClinicalWorkContext({
      source: 'direct',
      firstName: 'John',
      lastName: 'Smith',
      mrn: 'DIR100',
    });

    render(<ClinicalContextBar context={context} />);
    expect(screen.getAllByText('Direct Entry').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/REDCap ID/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders manual-entry badge for manual source', () => {
    const context = createClinicalWorkContext({
      source: 'manual',
      firstName: 'Alice',
      lastName: 'Wong',
      mrn: 'MAN200',
    });

    render(<ClinicalContextBar context={context} />);
    expect(screen.getAllByText('Manual Entry').length).toBeGreaterThanOrEqual(1);
  });

  it('respects redaction mode for all demographic values in both rails and Details popover', () => {
    render(
      <RedactProvider>
        <RedactionToggle />
        <ClinicalContextBar
          {...baseProps}
          dob="1980-05-01"
          reactionDate="2025-06-12"
          visitDate="2026-03-18"
        />
      </RedactProvider>
    );

    // Toggle redaction on
    fireEvent.click(screen.getByRole('button', { name: 'Redact identity' }));

    const bar = screen.getByLabelText('Current patient and encounter');
    expect(screen.queryByText('MrN00aB1')).not.toBeInTheDocument();
    expect(bar).not.toHaveTextContent('DOE');
    expect(bar).not.toHaveTextContent('01/05/1980');
    expect(bar).not.toHaveTextContent('12/06/2025');

    // Open Details popover under redaction mode
    const detailsBtn = screen.getAllByRole('button', { name: 'View patient details' })[0];
    fireEvent.click(detailsBtn);

    // Popover must also redact patient identity
    expect(screen.queryByText('DOE, Jane')).not.toBeInTheDocument();
    expect(screen.queryByText('MrN00aB1')).not.toBeInTheDocument();
    expect(screen.queryByText('01/05/1980')).not.toBeInTheDocument();
    expect(screen.queryByText('12/06/2025')).not.toBeInTheDocument();
  });
});
