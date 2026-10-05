import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Patient } from '@shared/types';

export type TryptaseSample = NonNullable<Patient['history']['tryptases']>[number];

export function getTryptasePeak(samples?: TryptaseSample[]): { index: number; value: number; display: string } | null {
  if (!samples?.length) return null;

  return samples.reduce<{ index: number; value: number; display: string } | null>((peak, sample, index) => {
    const value = parseFloat(sample.result);
    if (Number.isNaN(value)) return peak;
    if (!peak || value > peak.value) {
      return { index, value, display: String(value) };
    }
    return peak;
  }, null);
}

export function formatTimeHHmm(time?: string): string {
  if (!time) return '--:--';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

export function splitGrade(grade: string): { label: string; description: string } {
  if (!grade) return { label: 'Ungraded', description: 'No grade recorded' };
  const parts = grade.split(' - ');
  const label = parts[0];
  const description = parts.slice(1).join(' - ');
  return { label, description: description || label };
}

export function getOutcomeConfig(outcome?: string): { text: string; color: string; icon: typeof HelpCircle } {
  if (!outcome) return { text: 'Not recorded', color: 'text-muted-foreground', icon: HelpCircle };
  const lower = outcome.toLowerCase();
  if (lower.includes('completed') || lower === '2') return { text: 'Completed', color: 'text-status-success', icon: CheckCircle2 };
  if (lower.includes('abandoned') || lower.includes('adandoned') || lower === '1') return { text: 'Abandoned', color: 'text-status-danger', icon: AlertCircle };
  return { text: outcome, color: 'text-foreground', icon: HelpCircle };
}
