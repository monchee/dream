import React, { useEffect, useState, useMemo } from 'react';
import { Button, Skeleton } from '../../../../components/ui';
import { Database } from 'lucide-react';
import { fetchAllResults, exportToCsv } from '../services/ResearchService';
import { ResearchRecord } from '../types';
import { Screen } from '@shared/types';
import ResearchStatistics from './ResearchStatistics';
import ResearchRecordsTable from './ResearchRecordsTable';

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

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((x) => x.id !== id));
  };

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

  return (
    <div className="space-y-6">
      <ResearchStatistics
        records={records}
        stats={stats}
        onLoad={load}
        onExport={() => exportToCsv(records)}
      />

      <ResearchRecordsTable
        records={records}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        onDeleteRecord={handleDeleteRecord}
      />
    </div>
  );
}
