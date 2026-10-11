import React from 'react';
import { DrugProtocol } from '@features/testing/types';
import { Badge } from '@/components/ui';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface ProtocolDoseTableProps {
  protocol: DrugProtocol;
  className?: string;
}

export const ProtocolDoseTable: React.FC<ProtocolDoseTableProps> = ({ protocol, className = '' }) => {
  return (
    <div
      className={`border border-border bg-card p-3 rounded-none space-y-2.5 ${className}`}
      data-testid={`protocol-dose-table-${protocol.drugName}`}
    >
      {/* Header: Drug Name, Protocol Label, Test Type, Source Deep Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-sm text-foreground">{protocol.drugName}</span>
          {protocol.protocolLabel && (
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide rounded-none">
              {protocol.protocolLabel}
            </Badge>
          )}
          {protocol.testType && protocol.testType !== 'skin' && (
            <Badge variant="secondary" className="text-[10px] uppercase rounded-none">
              {protocol.testType}
            </Badge>
          )}
        </div>
        {protocol.sourceSlug ? (
          <a
            href={`https://scratch.yuson.au/drugs/${protocol.sourceSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`View ${protocol.drugName} protocol`}
          >
            <span>Protocol</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {/* Safety Badges & Warnings: Under Review & Pharmacy Verification */}
      {(protocol.underReview || protocol.needsPharmacyVerification) && (
        <div className="space-y-1.5">
          {protocol.underReview && (
            <div className="border border-status-warning bg-status-warning/10 p-2 text-xs text-status-warning rounded-none space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>⚠ Under review</span>
              </div>
              {protocol.reviewNote && (
                <p className="text-xs font-normal text-foreground/90 leading-relaxed pl-5">
                  {protocol.reviewNote}
                </p>
              )}
            </div>
          )}
          {protocol.needsPharmacyVerification && (
            <div className="border border-status-warning bg-status-warning/10 p-2 text-xs font-bold text-status-warning rounded-none flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>⚠ Confirm preparation with pharmacy</span>
            </div>
          )}
        </div>
      )}

      {/* Presentation, SPT concentration, Diluent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-muted/30 p-2 border border-border/50">
        <div>
          <span className="text-muted-foreground uppercase font-semibold text-[10px] block">Presentation</span>
          <span className="text-foreground font-medium">{protocol.presentation || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground uppercase font-semibold text-[10px] block">SPT Neat Concentration</span>
          <span className="text-foreground font-mono font-medium">{protocol.sptNeatConcentration || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground uppercase font-semibold text-[10px] block">Diluent</span>
          <span className="text-foreground font-medium">{protocol.diluent || '—'}</span>
        </div>
      </div>

      {/* IDT Dilution Table */}
      {protocol.idtSteps && protocol.idtSteps.length > 0 ? (
        <div className="space-y-1 pt-0.5">
          <span className="text-muted-foreground uppercase font-semibold text-[10px] tracking-wider block">
            IDT Dilution Steps
          </span>
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <th scope="col" className="py-1 px-2 font-semibold w-24">Ratio</th>
                  <th scope="col" className="py-1 px-2 font-semibold w-32">Concentration</th>
                  <th scope="col" className="py-1 px-2 font-semibold">Preparation</th>
                </tr>
              </thead>
              <tbody>
                {protocol.idtSteps.map((step, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-1 px-2 font-mono font-medium text-foreground">{step.ratio}</td>
                    <td className="py-1 px-2 font-mono text-muted-foreground">{step.concentration}</td>
                    <td className="py-1 px-2 text-muted-foreground">{step.preparation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
