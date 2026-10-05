import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress } from '../../../../components/ui';
import { Database, Download, RefreshCw, ClipboardList, FlaskConical, TrendingUp, CheckCircle2, BarChart2, Trophy } from 'lucide-react';
import { EmptyState, StatTile } from '@shared/components';
import { ResearchRecord } from '../types';

export interface ResearchStats {
  totalSubmissions: number;
  totalDrugs: number;
  totalPositive: number;
  positiveSessionCount: number;
  avgDrugsPerSession: string | null;
  overallPositivityRate: string;
  challengeCount: number;
  challengeSuccessCount: number;
  challengeSuccessRate: string | null;
  drugStats: Array<{ name: string; tested: number; positive: number; rate: number }>;
}

interface ResearchStatisticsProps {
  records: ResearchRecord[];
  stats: ResearchStats;
  onLoad: () => void;
  onExport: () => void;
}

const positivityColor = (rate: number) => {
  if (rate >= 25) return { text: 'text-destructive' };
  if (rate >= 10) return { text: 'text-status-warning' };
  return { text: 'text-primary' };
};

/**
 * Research database header with stat tiles, plus the positivity-by-drug
 * breakdown (plan 003 / F1). Data and refresh/export handlers are owned by
 * the parent dashboard.
 */
const ResearchStatistics: React.FC<ResearchStatisticsProps> = ({ records, stats, onLoad, onExport }) => {
  return (
    <>
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
                  onClick={onLoad}
                  className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExport}
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
    </>
  );
};

export default ResearchStatistics;
