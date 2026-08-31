import React, { useEffect, useState, useMemo } from 'react';
import {
  Download,
  RefreshCw,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Database,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  BarChart2,
  Trophy,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress, Skeleton } from '../../../../components/ui';
import { fetchAllResults, exportToCsv, deleteResult } from '../services/ResearchService';
import { ResearchRecord } from '../types';
import { Screen } from '@shared/types';
import { EmptyState, StatTile } from '@shared/components';
import { toast } from 'sonner';

function SubmissionDetail({ record, onDelete }: { record: ResearchRecord; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteResult(record.id);
      toast.success('Research record deleted');
      onDelete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete record.';
      setDeleteError(message);
      toast.error('Failed to delete record', { description: message, duration: 8000 });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="px-4 py-4 bg-muted/30 dark:bg-card/40 border-t border-border space-y-4">
      {/* Controls */}
      <div>
        <p className="section-label mb-1.5">Controls</p>
        <div className="flex flex-wrap gap-4 text-xs text-foreground/85">
          <span>Histamine SPT: <strong className="font-mono text-foreground">{record.histamine_spt || '—'}</strong></span>
          <span>Saline SPT: <strong className="font-mono text-foreground">{record.saline_spt || '—'}</strong></span>
          <span>Saline IDT: <strong className="font-mono text-foreground">{record.saline_idt || '—'}</strong></span>
        </div>
      </div>

      {/* Test Panel */}
      {record.test_panel.length > 0 && (
        <div>
          <p className="section-label mb-1.5">Test panel</p>
          <div className="border border-border overflow-x-auto rounded-none">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Drug', 'SPT', 'IDT Results', 'Result'].map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {record.test_panel.map((d, i) => (
                  <tr key={i} className={d.is_positive ? 'bg-status-danger/10' : 'hover:bg-muted/30 transition-colors'}>
                    <td className="px-3 py-1.5 font-medium text-foreground">{d.drug_name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground font-mono tabular-nums">{d.spt_wheal || '—'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground font-mono tabular-nums">{d.idt_results || '—'}</td>
                    <td className="px-3 py-1.5">
                      {d.is_positive ? (
                        <span className="text-status-danger font-semibold">Positive</span>
                      ) : (
                        <span className="text-muted-foreground">Negative</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Challenge */}
      {record.proceed_to_challenge && (
        <div>
          <p className="section-label mb-1.5">Challenge test</p>
          <div className="flex flex-wrap gap-4 text-xs text-foreground/85">
            <span>Drug: <strong className="text-foreground">{record.challenge_drug || '—'}</strong></span>
            <span>
              Outcome:{' '}
              <strong
                className={
                  record.challenge_outcome === 'SUCCESS'
                    ? 'text-status-grade1 dark:text-emerald-400 font-semibold'
                    : record.challenge_outcome === 'UNSUCCESS'
                    ? 'text-destructive dark:text-red-400 font-semibold'
                    : 'text-muted-foreground'
                }
              >
                {record.challenge_outcome === 'SUCCESS' ? 'Pass' : record.challenge_outcome === 'UNSUCCESS' ? 'Fail' : '—'}
              </strong>
            </span>
            {record.reaction_time && (
              <span>
                Reaction time: <strong className="font-mono text-foreground">{record.reaction_time}</strong>
              </span>
            )}
            {record.intervention_type && (
              <span>
                Intervention: <strong className="text-foreground">{record.intervention_type}</strong>
              </span>
            )}
          </div>
          {record.symptoms.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              Symptoms: {record.symptoms.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Plan */}
      {record.plan && (
        <div>
          <p className="section-label mb-1">Plan</p>
          <p className="text-xs text-foreground/85 whitespace-pre-wrap">{record.plan}</p>
        </div>
      )}

      {/* Delete */}
      <div className="flex flex-col items-end gap-1 pt-1">
        {deleteError && (
          <p className="text-xs text-destructive">{deleteError}</p>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive">Delete this record?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-none text-xs h-7 px-2.5 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              className="rounded-none text-xs h-7 px-2.5 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="rounded-none text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete record
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ResearchDashboard({ setScreen }: { setScreen?: (screen: Screen) => void } = {}) {
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllResults();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load research data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const totalDrugs = records.reduce((s, r) => s + r.total_drugs_tested, 0);
    const totalPositive = records.reduce((s, r) => s + r.positive_count, 0);
    const challenges = records.filter((r) => r.proceed_to_challenge);
    const successfulChallenges = challenges.filter((r) => r.challenge_outcome === 'SUCCESS');
    const positiveSessionCount = records.filter((r) => r.positive_count > 0).length;
    const avgDrugsPerSession = records.length > 0 ? (totalDrugs / records.length).toFixed(1) : null;

    const drugMap: Record<string, { tested: number; positive: number }> = {};
    for (const record of records) {
      for (const drug of record.test_panel) {
        if (!drugMap[drug.drug_name]) drugMap[drug.drug_name] = { tested: 0, positive: 0 };
        drugMap[drug.drug_name].tested += 1;
        if (drug.is_positive) drugMap[drug.drug_name].positive += 1;
      }
    }
    const drugStats = Object.entries(drugMap)
      .map(([name, v]) => ({
        name,
        tested: v.tested,
        positive: v.positive,
        rate: v.tested > 0 ? (v.positive / v.tested) * 100 : 0,
      }))
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 10);

    return {
      totalSubmissions: records.length,
      totalDrugs,
      totalPositive,
      positiveSessionCount,
      avgDrugsPerSession,
      overallPositivityRate: totalDrugs > 0 ? ((totalPositive / totalDrugs) * 100).toFixed(1) : '0.0',
      challengeCount: challenges.length,
      challengeSuccessCount: successfulChallenges.length,
      challengeSuccessRate:
        challenges.length > 0
          ? ((successfulChallenges.length / challenges.length) * 100).toFixed(0)
          : null,
      drugStats,
    };
  }, [records]);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none" />
        ))}
      </div>
    );
  }

  if (error) {
    const isUnconfigured = error.includes('not configured') || error.includes('Failed to fetch');
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-border bg-card rounded-none shadow-sm">
          <Database className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="heading-subsection">
          {isUnconfigured ? 'Research database is not configured' : 'Could not load research data'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {isUnconfigured
            ? 'The clinical dashboard can run from local demo or uploaded REDCap data, but the Research screen needs a connected Supabase research database.'
            : error}
        </p>

        {isUnconfigured && (
          <div className="mt-5 grid w-full max-w-md gap-2 text-left text-xs">
            <div className="flex items-center justify-between gap-4 border border-border bg-card px-3 py-2 rounded-none">
              <span className="font-medium text-muted-foreground">Research database</span>
              <span className="font-semibold text-foreground">Not configured</span>
            </div>
            <div className="flex items-center justify-between gap-4 border border-border bg-card px-3 py-2 rounded-none">
              <span className="font-medium text-muted-foreground">Demo mode</span>
              <span className="font-semibold text-foreground">Local patient dataset only</span>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {!isUnconfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </Button>
          )}
          {isUnconfigured && setScreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScreen(Screen.TECHNICAL_DOCUMENTATION)}
              className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Learn about research setup →
            </Button>
          )}
        </div>
      </div>
    );
  }

  const positivityColor = (rate: number) => {
    if (rate >= 25) return { bar: 'bg-destructive', text: 'text-destructive', badge: 'destructive' as const };
    if (rate >= 10) return { bar: 'bg-status-warning', text: 'text-status-warning', badge: 'warning' as const };
    return { bar: 'bg-primary', text: 'text-primary', badge: 'secondary' as const };
  };

  return (
    <div className="space-y-6">

      {/* Header + stat cards */}
      <div style={{ '--section-index': 0 } as React.CSSProperties} className="animate-section-reveal">
        <Card elevation="raised">
          <CardHeader bordered className="bg-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base text-foreground">Research Database</CardTitle>
                  <p className="text-xs text-muted-foreground">{records.length} de-identified session{records.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={load}
                  className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCsv(records)}
                  disabled={records.length === 0}
                  className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Sessions */}
              <StatTile
                label="Sessions"
                icon={<ClipboardList />}
                tone="primary"
                value={stats.totalSubmissions}
                hint={stats.avgDrugsPerSession ? `avg ${stats.avgDrugsPerSession} drugs/session` : 'no data yet'}
              />

              {/* Drugs tested */}
              <StatTile
                label="Drugs Tested"
                icon={<FlaskConical />}
                tone="primary"
                value={stats.totalDrugs}
                hint={stats.totalPositive > 0 ? `${stats.totalPositive} positive result${stats.totalPositive !== 1 ? 's' : ''}` : 'across all sessions'}
              />

              {/* Overall positivity */}
              <StatTile
                label="Positivity Rate"
                icon={<TrendingUp />}
                tone="warning"
                value={stats.totalDrugs > 0 ? `${stats.overallPositivityRate}%` : '—'}
                hint={stats.positiveSessionCount > 0
                  ? `${stats.positiveSessionCount} session${stats.positiveSessionCount !== 1 ? 's' : ''} with positives`
                  : 'no positive results yet'}
              />

              {/* Challenge pass rate */}
              <StatTile
                label="Challenge Pass"
                icon={<CheckCircle2 />}
                tone="primary"
                value={stats.challengeSuccessRate !== null ? `${stats.challengeSuccessRate}%` : '—'}
                hint={stats.challengeCount > 0
                  ? `${stats.challengeSuccessCount}/${stats.challengeCount} challenge${stats.challengeCount !== 1 ? 's' : ''} passed`
                  : 'no challenges recorded'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drug positivity breakdown */}
      <div style={{ '--section-index': 1 } as React.CSSProperties} className="animate-section-reveal">
        <Card elevation="raised">
          <CardHeader bordered className="bg-card">
            <CardTitle as="h2" className="flex items-center gap-2 text-base text-foreground">
              <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
                <BarChart2 className="w-4 h-4 text-primary" />
              </div>
              Positivity by Drug
              {stats.drugStats.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground ml-1">top {stats.drugStats.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.drugStats.length > 0 ? (
              <div className="divide-y divide-border">
                {stats.drugStats.map((d, i) => {
                  const { text } = positivityColor(d.rate);
                  const isTop = i === 0 && d.positive > 0;
                  return (
                    <div key={d.name} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <span className="w-5 text-xs font-semibold text-muted-foreground tabular-nums text-right shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium text-sm text-foreground flex items-center gap-2 min-w-0 truncate">
                        <span className="truncate">{d.name}</span>
                        {isTop && <Trophy className="w-3.5 h-3.5 text-status-warning shrink-0" aria-label="Highest positivity count" />}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0 hidden sm:block">
                        {d.positive}/{d.tested}
                      </span>
                      <div className="w-28 sm:w-36 shrink-0">
                        <Progress value={Math.min(d.rate, 100)} className="h-2 rounded-none bg-muted" />
                      </div>
                      <span className={`w-12 text-right text-xs font-bold tabular-nums shrink-0 ${text}`}>
                        {d.rate.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<BarChart2 className="w-8 h-8 opacity-40" aria-hidden="true" />}
                title="No data yet. Save a testing session to populate this chart."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records list */}
      <div style={{ '--section-index': 2 } as React.CSSProperties} className="animate-section-reveal">
        <Card elevation="raised">
          <CardHeader bordered className="bg-card">
            <CardTitle as="h2" className="flex items-center justify-between gap-2 text-base text-foreground">
              <span className="flex items-center gap-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                All Submissions
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {records.length === 0 ? (
              <EmptyState
                icon={<Database className="w-8 h-8 opacity-40" aria-hidden="true" />}
                title="No submissions yet."
                description='Complete a testing session and click "Save to Research Database".'
              />
            ) : (
              <div className="divide-y divide-border">
                {records.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <div key={r.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        aria-expanded={isExpanded}
                        className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      >
                        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs">
                          <div>
                            <span className="text-muted-foreground">Visit </span>
                            <span className="font-medium text-foreground font-mono">
                              {r.visit_date ? new Date(r.visit_date).toLocaleDateString('en-AU') : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">REDCap </span>
                            <span className="font-medium text-foreground font-mono">{r.redcap_id ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground font-mono">{r.total_drugs_tested} drugs</span>
                            {r.positive_count > 0 ? (
                              <Badge variant="destructive" className="text-xs h-4 px-1.5 rounded-none font-mono">
                                {r.positive_count} +
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs h-4 px-1.5 rounded-none font-mono">all −</Badge>
                            )}
                          </div>
                          <div>
                            {r.proceed_to_challenge ? (
                              <span
                                className={`font-medium ${
                                  r.challenge_outcome === 'SUCCESS'
                                    ? 'text-status-grade1 dark:text-emerald-400 font-semibold'
                                    : r.challenge_outcome === 'UNSUCCESS'
                                    ? 'text-destructive dark:text-red-400 font-semibold'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                Challenge: {r.challenge_outcome === 'SUCCESS' ? 'Pass' : r.challenge_outcome === 'UNSUCCESS' ? 'Fail' : '—'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No challenge</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <SubmissionDetail
                          record={r}
                          onDelete={() => {
                            setRecords((prev) => prev.filter((x) => x.id !== r.id));
                            setExpandedId(null);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
