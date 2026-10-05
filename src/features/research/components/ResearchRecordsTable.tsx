import React from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';
import { EmptyState } from '@shared/components';
import { ResearchRecord } from '../types';
import ResearchRecordDetails from './ResearchRecordDetails';

interface ResearchRecordsTableProps {
  records: ResearchRecord[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDeleteRecord: (id: string) => void;
}

/**
 * The "All Submissions" list of the research dashboard: expandable rows with
 * visit/REDCap/drug-count/challenge summary and the detail panel beneath
 * (plan 003 / F1). Expansion state is owned by the parent.
 */
const ResearchRecordsTable: React.FC<ResearchRecordsTableProps> = ({
  records,
  expandedId,
  setExpandedId,
  onDeleteRecord,
}) => {
  return (
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
                      <ResearchRecordDetails
                        record={r}
                        onDelete={() => {
                          onDeleteRecord(r.id);
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
  );
};

export default ResearchRecordsTable;
