import React, { useState, useRef, useEffect } from 'react';
import { Lock, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui';

import { UNLOCK_KEY, isAppUnlocked } from '@shared/utils/pwaUpdatePolicy';

const APP_VERSION = __APP_VERSION__;

/**
 * Intentionally hardcoded (decision recorded in plans/README.md, 2026-06-12,
 * reaffirmed 2026-10-05). This PIN is a client-side privacy screen that
 * reduces casual shoulder-surfing on shared hospital terminals — nothing more.
 *
 * What it protects: the visible browser session from casual observation.
 *
 * What it does NOT provide: enterprise authentication, database
 * authorization, encryption, source-code secrecy, bundle secrecy (anyone
 * who inspects the shipped JavaScript can read this constant), or any
 * network security. Unlock state lives in sessionStorage for the current
 * tab session only (see setStoredUnlock below).
 *
 * To change the PIN: replace these four digits, then update the matching
 * literals in PasswordGate.test.tsx (the unlock and wrong-PIN test cases)
 * and run the plan's verification commands.
 *
 * The PIN must never be logged or sent to an external service.
 */
const HARDCODED_PIN = '2050';

function setStoredUnlock(val: boolean) {
  try { if (val) sessionStorage.setItem(UNLOCK_KEY, 'true'); else sessionStorage.removeItem(UNLOCK_KEY); }
  catch { /* Safari private mode */ }
}

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(isAppUnlocked);
  const [isExiting, setIsExiting] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    if (unlocked) setStoredUnlock(true);
  }, [unlocked]);

  const handleUnlock = (currentDigits = digits) => {
    if (currentDigits.join('') === HARDCODED_PIN) {
      setIsExiting(true);
      setTimeout(() => setUnlocked(true), 300);
    } else {
      setError('Incorrect PIN');
      setDigits(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else if (digit && index === 3) {
      handleUnlock(next);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;
    const next = ['', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    setError('');
    if (pasted.length === 4) {
      handleUnlock(next);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <main
      className={`relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden bg-masthead p-4 sm:p-6 md:p-8 lg:p-12 text-masthead-foreground ${
        isExiting ? 'animate-gate-exit pointer-events-none' : ''
      }`}
      aria-label="Screen lock"
    >
      {/* Authored responsive lock-station frame */}
      <div className="relative z-10 w-full max-w-4xl animate-content-enter">
        <div className="grid grid-cols-1 md:grid-cols-12 border border-masthead-border border-b-[3px] border-b-masthead-edge shadow-2xl bg-masthead">
          {/* Left Rail / Lock Station Branding (Desktop side rail, Mobile top brand header) */}
          <div className="md:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col border-b md:border-b-0 md:border-r border-masthead-border bg-masthead">
            <div className="flex flex-col gap-6 md:my-auto">
              <div className="flex flex-col gap-1.5">
                <h1 className="app-wordmark text-3xl sm:text-4xl lg:text-5xl font-bold text-masthead-foreground leading-none">
                  DREAM
                </h1>
                <p className="text-xs font-medium tracking-wider text-masthead-foreground/70 uppercase leading-relaxed">
                  Drug Reaction Evaluation &amp; Anaesthetic Management
                </p>
              </div>

              {/* Lock Rail indicator */}
              <div className="pt-6 border-t border-masthead-border">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-masthead-accent">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  <span>Clinical Workstation</span>
                </div>
              </div>
            </div>

            {/* Institutional attribution */}
            <div className="mt-6 md:mt-0 text-xs tracking-wide text-masthead-foreground/60">
              <span>RPAH Department of Clinical Immunology &amp; Allergy</span>
            </div>
          </div>

          {/* Right Column / Rectangular PIN Module */}
          <div className="md:col-span-7 bg-card text-card-foreground p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="pb-6 text-left">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Screen Lock
                </h2>
                <p id="pin-instructions" className="text-sm text-muted-foreground mt-1">
                  Enter PIN to continue
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <div
                    className="flex gap-2.5 sm:gap-3 justify-center sm:justify-start"
                    role="group"
                    aria-label="PIN entry"
                    aria-describedby="pin-instructions pin-status"
                  >
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digits[i]}
                        autoFocus={i === 0}
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        aria-label={`PIN digit ${i + 1} of 4`}
                        aria-describedby="pin-instructions pin-status"
                        aria-invalid={error ? 'true' : 'false'}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        className={`w-12 h-14 sm:w-14 sm:h-14 text-center text-2xl font-mono tabular-nums rounded-none border transition-colors ${
                          error
                            ? 'border-destructive text-destructive bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:border-destructive'
                            : digits[i]
                              ? 'border-primary bg-primary/[0.04] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring'
                              : 'border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="min-h-6 flex items-center">
                    {error ? (
                      <div
                        id="pin-status"
                        role="alert"
                        aria-live="assertive"
                        className="flex items-center gap-1.5 text-destructive text-sm font-medium"
                      >
                        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                    ) : (
                      <div id="pin-status" role="status" aria-live="polite" className="sr-only">
                        <span>Screen locked. Enter 4-digit PIN.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    type="button"
                    onClick={() => handleUnlock()}
                    className="w-full h-11 sm:h-12 text-sm font-semibold rounded-none btn-press flex items-center justify-center gap-2"
                  >
                    <KeyRound className="size-4 shrink-0" aria-hidden="true" />
                    <span>Unlock</span>
                  </Button>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This is a screen lock to prevent shoulder-surfing on shared workstations. Patient data security is governed separately by the database access controls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version identifier */}
      <span className="fixed bottom-4 right-4 md:bottom-6 md:right-6 text-xs font-mono text-masthead-foreground/50">
        v{APP_VERSION}
      </span>
    </main>
  );
};

export default PasswordGate;
