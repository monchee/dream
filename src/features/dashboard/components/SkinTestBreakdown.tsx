import React from 'react';
import { Card, CardHeader, CardTitle, Button } from '@/components/ui';
import { Thermometer, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { EmptyState, TableEmptyRow } from '@shared/components/states';

interface DrugStat {
  name: string;
  spt: number;
  idt100: number;
  idt10: number;
  idtNeat: number;
  challenge: number;
  total: number;
}

interface CategoryGroup {
  category: string;
  stats: DrugStat[];
}

interface SkinTestBreakdownProps {
  statsByCategory: CategoryGroup[];
  expandedCategories: string[];
  toggleCategory: (category: string) => void;
  toggleAllCategories: () => void;
}

const SkinTestBreakdown: React.FC<SkinTestBreakdownProps> = ({
  statsByCategory,
  expandedCategories,
  toggleCategory,
  toggleAllCategories,
}) => {
  const allCategories = statsByCategory.map(c => c.category);
  const areAllExpanded = allCategories.length > 0 && expandedCategories.length === allCategories.length;

  return (
    <Card elevation="raised" className="w-full animate-enter-subtle">
      <CardHeader bordered className="py-4 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle as="h2" className="text-base flex items-center gap-2 text-foreground">
              <Thermometer className="w-4 h-4 text-primary" /> Positive Skin Test Breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground">Number of positive patient reactions by drug (SPT/IDT &gt; 3mm or Positive Challenge).</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleAllCategories} className="shrink-0 h-8">
            {areAllExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1.5" /> Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1.5" /> Expand All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[760px] md:min-w-full text-sm relative border-collapse">
          <thead className="bg-card text-xs uppercase text-muted-foreground font-semibold">
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-left bg-card w-1/3">Drug</th>
              <th scope="col" className="px-4 py-3 text-center bg-card">SPT</th>
              <th scope="col" className="px-4 py-3 text-center bg-card">IDT 1:100</th>
              <th scope="col" className="px-4 py-3 text-center bg-card">IDT 1:10</th>
              <th scope="col" className="px-4 py-3 text-center bg-card">IDT Neat</th>
              <th scope="col" className="px-4 py-3 text-center bg-card">Challenge Pos</th>
              <th scope="col" className="px-4 py-3 text-center bg-muted/50 border-l border-border">Total Cases</th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {statsByCategory.length > 0 ? (
              statsByCategory.map((categoryGroup, cIdx) => {
                const isExpanded = expandedCategories.includes(categoryGroup.category);
                const totalCategoryPositives = categoryGroup.stats.reduce((acc, curr) => acc + curr.total, 0);

                return (
                  <React.Fragment key={cIdx}>
                    <tr
                      style={{ '--row-index': Math.min(cIdx, 9) } as React.CSSProperties}
                      className="bg-card hover:bg-muted/80 border-b border-border transition-colors animate-row-enter"
                    >
                      <td colSpan={6} className="px-4 py-2.5">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 text-left section-label text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          onClick={() => toggleCategory(categoryGroup.category)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryGroup.category} skin test results`}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          {categoryGroup.category}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center border-l border-border">
                        {totalCategoryPositives > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-muted dark:bg-card text-foreground dark:text-primary border border-border/50">
                            <span className="tabular-nums">{totalCategoryPositives}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && categoryGroup.stats.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/40 dark:hover:bg-card/50 transition-colors border-b border-border animate-in fade-in slide-in-from-top-1">
                        <td className="px-4 py-3 font-medium text-foreground/80 pl-10">{item.name}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.spt || '-'}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.idt100 || '-'}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.idt10 || '-'}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.idtNeat || '-'}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{item.challenge || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-foreground bg-muted/30 dark:bg-card/30 border-l border-border tabular-nums">
                          {item.total || <span className="text-muted-foreground font-normal">-</span>}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <TableEmptyRow colSpan={7} title="No data available." />
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Card List) */}
      <div className="md:hidden divide-y divide-border">
        {statsByCategory.length > 0 ? (
          statsByCategory.map((categoryGroup, cIdx) => {
            const isExpanded = expandedCategories.includes(categoryGroup.category);
            const totalCategoryPositives = categoryGroup.stats.reduce((acc, curr) => acc + curr.total, 0);

            return (
              <div key={categoryGroup.category || cIdx} className="bg-background">
                {/* Category Header */}
                <button
                  type="button"
                  style={{ '--row-index': Math.min(cIdx, 9) } as React.CSSProperties}
                  className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between gap-2 text-left bg-card hover:bg-muted/80 transition-colors animate-row-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 btn-press"
                  onClick={() => toggleCategory(categoryGroup.category)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryGroup.category} category`}
                >
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm section-label">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    )}
                    <span>{categoryGroup.category}</span>
                  </div>
                  <div>
                    {totalCategoryPositives > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-muted dark:bg-card text-foreground dark:text-primary border border-border/50">
                        <span className="tabular-nums font-mono">{totalCategoryPositives}</span>
                        <span className="ml-1 text-xs text-muted-foreground font-normal">pos</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono">-</span>
                    )}
                  </div>
                </button>

                {/* Expanded Category Drug Cards */}
                {isExpanded && (
                  <div className="divide-y divide-border/60 bg-muted/10 dark:bg-card/20 animate-in fade-in slide-in-from-top-1">
                    {categoryGroup.stats.map((item, i) => (
                      <div key={item.name || i} className="p-3 pl-4 space-y-2 hover:bg-muted/30 dark:hover:bg-card/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-foreground">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Total:</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-bold text-foreground bg-muted/60 dark:bg-card/60 border border-border/60 tabular-nums font-mono">
                              {item.total || 0}
                            </span>
                          </div>
                        </div>

                        {/* Modality Stats Grid */}
                        <div className="grid grid-cols-5 gap-1 text-center pt-0.5">
                          <div className="bg-card dark:bg-background/60 p-1 rounded-none border border-border/50">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">SPT</div>
                            <div className="text-xs font-mono tabular-nums text-foreground mt-0.5 font-medium">{item.spt || '-'}</div>
                          </div>
                          <div className="bg-card dark:bg-background/60 p-1 rounded-none border border-border/50">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">1:100</div>
                            <div className="text-xs font-mono tabular-nums text-foreground mt-0.5 font-medium">{item.idt100 || '-'}</div>
                          </div>
                          <div className="bg-card dark:bg-background/60 p-1 rounded-none border border-border/50">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">1:10</div>
                            <div className="text-xs font-mono tabular-nums text-foreground mt-0.5 font-medium">{item.idt10 || '-'}</div>
                          </div>
                          <div className="bg-card dark:bg-background/60 p-1 rounded-none border border-border/50">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Neat</div>
                            <div className="text-xs font-mono tabular-nums text-foreground mt-0.5 font-medium">{item.idtNeat || '-'}</div>
                          </div>
                          <div className="bg-card dark:bg-background/60 p-1 rounded-none border border-border/50">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Chal</div>
                            <div className="text-xs font-mono tabular-nums text-foreground mt-0.5 font-medium">{item.challenge || '-'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState title="No data available." />
        )}
      </div>
    </Card>
  );
};

export default React.memo(SkinTestBreakdown);
