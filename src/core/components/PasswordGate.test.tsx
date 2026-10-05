import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PasswordGate from './PasswordGate';

describe('PasswordGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('renders complete lock-station structure including landmarks, headings, and controls with no decorative ambience', () => {
    const { container } = render(
      <PasswordGate>
        <div>Protected Clinical Workspace</div>
      </PasswordGate>
    );

    // Main landmark with accessible name
    const mainElement = screen.getByRole('main', { name: 'Screen lock' });
    expect(mainElement).toBeInTheDocument();

    // R4 quiet lock station: the decorative ambient layers and grid are gone
    expect(container.querySelector('.lock-station-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.ambient-light-field-1')).not.toBeInTheDocument();
    expect(container.querySelector('.ambient-light-field-2')).not.toBeInTheDocument();
    expect(container.querySelector('.ambient-light-field-1, .ambient-light-field-2, .lock-station-grid')).toBeNull();

    // Central lock-station frame carries the 3px masthead-edge identity edge
    const frame = container.querySelector('.shadow-2xl');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveClass('border', 'border-masthead-border', 'border-b-[3px]', 'border-b-masthead-edge');

    // DREAM Wordmark and subtitle
    expect(screen.getByRole('heading', { name: 'DREAM', level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/Drug Reaction Evaluation & Anaesthetic Management/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/RPAH Department of Clinical Immunology & Allergy/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Clinical Workstation/i)).toBeInTheDocument();

    // Title and PIN instructions
    expect(screen.getByText('Screen Lock')).toBeInTheDocument();
    expect(screen.getByText('Enter PIN to continue')).toBeInTheDocument();

    // PIN group
    const pinGroup = screen.getByRole('group', { name: 'PIN entry' });
    expect(pinGroup).toBeInTheDocument();
    expect(pinGroup).toHaveAttribute('aria-describedby', 'pin-instructions pin-status');

    // 4 PIN input fields
    const pinInputs = screen.getAllByLabelText(/PIN digit \d of 4/);
    expect(pinInputs).toHaveLength(4);
    pinInputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'password');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('maxlength', '1');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('aria-describedby', 'pin-instructions pin-status');
    });

    // Unlock button and security disclaimer
    expect(screen.getByRole('button', { name: /Unlock/i })).toBeInTheDocument();
    expect(
      screen.getByText(/This is a screen lock to prevent shoulder-surfing on shared workstations/i)
    ).toBeInTheDocument();

    // Child content should NOT be rendered yet
    expect(screen.queryByText('Protected Clinical Workspace')).not.toBeInTheDocument();
  });

  it('handles automatic focus advance, numeric filtering, and backspace navigation', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    );

    const inputs = screen.getAllByLabelText(/PIN digit \d of 4/) as HTMLInputElement[];
    const focusSpy1 = vi.spyOn(inputs[1], 'focus');
    const focusSpy2 = vi.spyOn(inputs[2], 'focus');
    const focusSpy0 = vi.spyOn(inputs[0], 'focus');

    // Non-numeric input is filtered out
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0].value).toBe('');
    expect(focusSpy1).not.toHaveBeenCalled();

    // Entering a numeric digit advances focus to next input
    fireEvent.change(inputs[0], { target: { value: '2' } });
    expect(inputs[0].value).toBe('2');
    expect(focusSpy1).toHaveBeenCalled();

    // Entering a second digit advances focus to third input
    fireEvent.change(inputs[1], { target: { value: '0' } });
    expect(inputs[1].value).toBe('0');
    expect(focusSpy2).toHaveBeenCalled();

    // Backspace on empty 3rd input navigates back to 2nd input
    const focusSpy1Back = vi.spyOn(inputs[1], 'focus');
    fireEvent.keyDown(inputs[2], { key: 'Backspace' });
    expect(focusSpy1Back).toHaveBeenCalled();

    // Backspace on empty 1st input does not crash
    fireEvent.keyDown(inputs[0], { key: 'Backspace' });
    expect(focusSpy0).not.toHaveBeenCalled();
  });

  it('handles paste of full PIN and partial PIN correctly', () => {
    vi.useFakeTimers();

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    );

    const inputs = screen.getAllByLabelText(/PIN digit \d of 4/) as HTMLInputElement[];

    // Partial paste of 2 digits
    const focusSpy2 = vi.spyOn(inputs[2], 'focus');
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '20' },
    });

    expect(inputs[0].value).toBe('2');
    expect(inputs[1].value).toBe('0');
    expect(inputs[2].value).toBe('');
    expect(inputs[3].value).toBe('');
    expect(focusSpy2).toHaveBeenCalled();

    // Paste full correct PIN (2050)
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '2050' },
    });

    expect(inputs[0].value).toBe('2');
    expect(inputs[1].value).toBe('0');
    expect(inputs[2].value).toBe('5');
    expect(inputs[3].value).toBe('0');

    // Should initiate exit and unlock after timer
    expect(screen.getByRole('main')).toHaveClass('animate-gate-exit');
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(sessionStorage.getItem('dream:unlocked')).toBe('true');
  });

  it('submits on Enter key press', () => {
    vi.useFakeTimers();

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    );

    const inputs = screen.getAllByLabelText(/PIN digit \d of 4/) as HTMLInputElement[];

    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.change(inputs[2], { target: { value: '5' } });
    // Enter key press on incomplete PIN
    fireEvent.keyDown(inputs[2], { key: 'Enter' });

    // Should show error for incomplete PIN
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect PIN');
  });

  it('handles incorrect PIN with alert, field reset, first-field refocus, and clears on new entry', () => {
    vi.useFakeTimers();

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    );

    const inputs = screen.getAllByLabelText(/PIN digit \d of 4/) as HTMLInputElement[];
    const focusSpy0 = vi.spyOn(inputs[0], 'focus');

    // Enter wrong PIN digit by digit
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(inputs[2], { target: { value: '1' } });
    fireEvent.change(inputs[3], { target: { value: '1' } });

    act(() => {
      vi.runAllTimers();
    });

    // Alert rendered with role="alert"
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Incorrect PIN');

    // Digits cleared
    inputs.forEach(input => {
      expect(input.value).toBe('');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    // First field refocused
    expect(focusSpy0).toHaveBeenCalled();

    // Typing a new digit clears the error
    fireEvent.change(inputs[0], { target: { value: '2' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(inputs[0]).toHaveAttribute('aria-invalid', 'false');
  });

  it('unlocks with correct PIN, animates exit, persists to sessionStorage, and renders children', () => {
    vi.useFakeTimers();

    render(
      <PasswordGate>
        <div>Clinical Examination Room</div>
      </PasswordGate>
    );

    const inputs = screen.getAllByLabelText(/PIN digit \d of 4/) as HTMLInputElement[];

    // Enter correct PIN 2050
    fireEvent.change(inputs[0], { target: { value: '2' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.change(inputs[2], { target: { value: '5' } });
    fireEvent.change(inputs[3], { target: { value: '0' } });

    // Gate should enter exit animation
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('animate-gate-exit');
    expect(mainElement).toHaveClass('pointer-events-none');

    // Advance 300ms exit transition
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Child rendered
    expect(screen.getByText('Clinical Examination Room')).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();

    // SessionStorage updated
    expect(sessionStorage.getItem('dream:unlocked')).toBe('true');
  });

  it('bypasses PIN gate immediately when sessionStorage already has unlocked status', () => {
    sessionStorage.setItem('dream:unlocked', 'true');

    render(
      <PasswordGate>
        <div>Bypassed Patient Session</div>
      </PasswordGate>
    );

    expect(screen.getByText('Bypassed Patient Session')).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });
});
