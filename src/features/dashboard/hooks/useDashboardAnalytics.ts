import { useMemo } from 'react';
import { Patient } from '@features/patients/types';
import { LogFormData } from '@features/testing/types';
import { isSkinTestPositive, calculateTimeDifference } from '@shared/utils';
import { SKIN_TEST_POSITIVE_THRESHOLD } from '@shared/utils/constants';

interface UseDashboardAnalyticsProps {
  existingPatients: Patient[];
  recentLogs: LogFormData[];
  drugOptions: string[];
  drugCategories: Record<string, string[]>;
}

export const useDashboardAnalytics = ({
  existingPatients,
  recentLogs,
  drugOptions,
  drugCategories
}: UseDashboardAnalyticsProps) => {
  return useMemo(() => {
    const totalPatients = existingPatients.length + recentLogs.length;
    const redcapRecordCount = existingPatients.length;
    const sessionLogCount = recentLogs.length;
    let grade3PlusCount = 0;
    let redcapGrade3PlusCount = 0;
    let abandonedCount = 0;
    
    // Time Analytics
    let totalReactionTime = 0;
    let reactionTimeCount = 0;

    // Initialise stats for ALL standard drugs so they appear in the table (even with 0 count)
    const drugStats: Record<string, { spt: number, idt100: number, idt10: number, idtNeat: number, challenge: number, total: number }> = {};
    
    drugOptions.forEach(drug => {
        drugStats[drug] = { spt: 0, idt100: 0, idt10: 0, idtNeat: 0, challenge: 0, total: 0 };
    });
    // Ensure 'Other' exists
    drugStats['Other'] = { spt: 0, idt100: 0, idt10: 0, idtNeat: 0, challenge: 0, total: 0 };

    const gradeCounts = { I: 0, II: 0, III: 0, IV: 0, Ungraded: 0 };

    // Helper to normalize and count agent usage
    const normalizeAgent = (agentName: string) => {
        const normalized = agentName.trim();
        if (!normalized) return null;
        
        let key = 'Other';
        if (Object.prototype.hasOwnProperty.call(drugStats, normalized)) {
            key = normalized;
        }
        return key;
    };

    // 1. Process Existing Static Patients
    existingPatients.forEach(p => {
      const grade = p.history.grade || 'Ungraded';
      if (grade.includes("III") || grade.includes("IV") || grade.includes("Cardiac Arrest")) {
        grade3PlusCount++;
        redcapGrade3PlusCount++;
      }
      
      // Robust check for abandoned procedures
      const outcome = (p.history.procedureOutcome || '').toLowerCase();
      if (outcome.includes('abandoned') || outcome.includes('adandoned') || outcome === '1') {
          abandonedCount++;
      }
      
      if (grade.includes("IV") || grade.includes("Cardiac Arrest")) gradeCounts.IV++;
      else if (grade.includes("III")) gradeCounts.III++;
      else if (grade.includes("II")) gradeCounts.II++;
      else if (grade.includes("I ") || grade === "Grade I") gradeCounts.I++;
      else gradeCounts.Ungraded++;

      // Time Calculation
      const timeDiff = calculateTimeDifference(p.history.inductionTime, p.history.reactionTime);
      // Only include if positive difference and less than 4 hours (240 mins) to filter out outliers/delayed reactions for this average
      if (timeDiff !== null && timeDiff >= 0 && timeDiff <= 240) {
          totalReactionTime += timeDiff;
          reactionTimeCount++;
      }

      // Use Set to track unique agents for THIS patient to avoid double counting
      const uniqueAgentsForPatient = new Set<string>();

      (p.history.suspectedAgents || []).forEach(agent => {
          const key = normalizeAgent(agent);
          if (key) uniqueAgentsForPatient.add(key);
      });
      
      // Consolidate drugs from multiple possible fields
      const allDrugs = [
          ...(p.history.medications || []),
          ...(p.history.preInductionDrugs || []),
          ...(p.history.postInductionDrugs || [])
      ];

      allDrugs.forEach(str => {
          const key = normalizeAgent(str.split('@')[0].trim());
          if (key) uniqueAgentsForPatient.add(key);
      });

      // Increment totals based on unique set
      uniqueAgentsForPatient.forEach(key => {
          drugStats[key].total += 1;
      });
    });

    // 2. Process Newly Added Logs
    // NOTE (C3 — clinician review only): session-log severity is inferred
    // heuristically (UNSUCCESS + Adrenaline -> Grade III, else Grade I). This is an
    // approximation flagged for clinician sign-off; do not refine the grading rule
    // without review. See plans/2026-06-09-dashboard-review-improvements.md (C3).
    recentLogs.forEach(log => {
        if (log.outcome === 'UNSUCCESS') {
             if (log.interventionType === 'Adrenaline') {
                 gradeCounts.III++;
                 grade3PlusCount++;
             } else {
                 gradeCounts.I++;
             }
        } else {
            gradeCounts.Ungraded++;
        }

        const logReactionTime = log.reactionTime ? parseInt(log.reactionTime) : NaN;
        if (!isNaN(logReactionTime) && logReactionTime >= 0 && logReactionTime <= 240) {
             totalReactionTime += logReactionTime;
             reactionTimeCount++;
        }

        if (log.proceedToChallenge && log.outcome === 'UNSUCCESS') {
             const drugName = log.challengeDrug === 'Other' ? (log.challengeDrugCustom || 'Other') : log.challengeDrug;
             const key = normalizeAgent(drugName);
             if (key) {
                 drugStats[key].total += 1;
                 drugStats[key].challenge += 1;
             }
        }

        log.testPanel.forEach(test => {
            const drugName = test.drugName === 'Other' ? (test.customName || 'Other') : test.drugName;
            
            if (isSkinTestPositive(test)) {
                const key = normalizeAgent(drugName);
                if (key) {
                    drugStats[key].total += 1; 
                    if (test.sptWheal && parseInt(test.sptWheal, 10) >= SKIN_TEST_POSITIVE_THRESHOLD) drugStats[key].spt++;
                    // New format: idtResults array; legacy: idt100/idt10/idtNeat
                    const r = test.idtResults?.length ? test.idtResults : [test.idt100, test.idt10, test.idtNeat];
                    if (r[0] && parseInt(r[0], 10) >= SKIN_TEST_POSITIVE_THRESHOLD) drugStats[key].idt100++;
                    if (r[1] && parseInt(r[1], 10) >= SKIN_TEST_POSITIVE_THRESHOLD) drugStats[key].idt10++;
                    if (r[2] && parseInt(r[2], 10) >= SKIN_TEST_POSITIVE_THRESHOLD) drugStats[key].idtNeat++;
                }
            }
        });
    });

    const avgReactionTime = reactionTimeCount > 0 ? Math.round(totalReactionTime / reactionTimeCount) : 0;

    const topAgentsByCount = Object.entries(drugStats)
        .filter(([name, stats]) => stats.total > 0 && name !== 'Other')
        .map(([name, stats]) => ({ name, count: stats.total }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    if (topAgentsByCount.length < 5 && drugStats['Other'].total > 0) {
        topAgentsByCount.push({ name: 'Other', count: drugStats['Other'].total });
    }

    const mostCommonAgentEntry = Object.entries(drugStats)
        .sort(([, a], [, b]) => b.total - a.total)[0];

    const statsByCategory = Object.entries(drugCategories).map(([category, drugs]) => {
        const categoryStats = (drugs as string[]).map(drugName => ({
            name: drugName,
            ...drugStats[drugName]
        }));
        return { category, stats: categoryStats };
    });
    
    if (drugStats['Other'].total > 0) {
        const othersCatIndex = statsByCategory.findIndex(c => c.category === 'Others');
        const otherItem = { name: 'Other (Unlisted)', ...drugStats['Other'] };
        if (othersCatIndex >= 0) {
            statsByCategory[othersCatIndex].stats.push(otherItem);
        } else {
            statsByCategory.push({ category: 'Others', stats: [otherItem] });
        }
    }

    return {
      hasInferredSessionGrades: sessionLogCount > 0,
      totalPatients,
      redcapRecordCount,
      sessionLogCount,
      grade3PlusCount,
      redcapGrade3PlusCount,
      abandonedCount,
      avgReactionTime,
      mostCommonAgent: mostCommonAgentEntry?.[1].total > 0 ? mostCommonAgentEntry?.[0] : 'N/A',
      mostCommonAgentCount: mostCommonAgentEntry?.[1]?.total || 0,
      statsByCategory,
      gradeCounts,
      topAgentsByCount
    };
  }, [existingPatients, recentLogs, drugOptions, drugCategories]);
};
