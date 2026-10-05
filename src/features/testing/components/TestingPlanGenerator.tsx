import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, Label, Textarea } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Patient, TestingPlanData, CustomDrugEntry, DocumentsToChase } from '@shared/types';
import { DrugProtocol } from '@features/testing/types';
import { ClipboardList, ChevronDown, History, Pin } from 'lucide-react';
import { CATEGORY_THEMES, DEFAULT_THEME, DEFAULT_SELECTED_DRUGS } from '@shared/utils/constants';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { resolveSelectedProtocol, type ProtocolResolution } from '@shared/utils/protocolResolver';
import { getIfFresh, setWithTTL, TESTING_PLAN_BUILDER_DRAFTS_KEY } from '@shared/utils/ttlStorage';
import { DraftSaveIndicator } from './DraftSaveIndicator';
import TestingPlanGeneratorDrugSelection from './TestingPlanGeneratorDrugSelection';
import { ProtocolChoicesSection, DoseSpecificationsSection } from './TestingPlanGeneratorProtocolDetails';
import TestingPlanGeneratorCustomDrug from './TestingPlanGeneratorCustomDrug';
import TestingPlanGeneratorActions from './TestingPlanGeneratorActions';
import { RequestDetailsSection, DocumentsToChaseSection } from './TestingPlanGeneratorRequestDetails';


interface TestingPlanGeneratorProps {
  patient: Patient;
  drugCategories: Record<string, string[]>;
  onPreview: (data: TestingPlanData) => void;
}

interface TestingPlanBuilderDraft {
  selectedDrugs: string[];
  selectedProtocols: Record<string, number>;
  customDrugs: CustomDrugEntry[];
  notes: string;
  urgent: boolean;
  reactionDate: string;
  documentsToChase: DocumentsToChase;
}

type TestingPlanBuilderDrafts = Record<string, TestingPlanBuilderDraft>;

const getTodayDate = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const normalizeDrugName = (value: string) => value.trim().toLowerCase();

// Loose key for matching drug names across REDCap's inconsistent spellings
// (strips hyphens, spaces, and case — e.g. "Cisatracurium" ≡ "Cis-atracurium").
const stripForMatch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const readDraftForPatient = (patientId: string): TestingPlanBuilderDraft | null => {
  const drafts = getIfFresh<TestingPlanBuilderDrafts>(TESTING_PLAN_BUILDER_DRAFTS_KEY);
  return drafts?.[patientId] ?? null;
};

const TestingPlanGenerator: React.FC<TestingPlanGeneratorProps> = ({ patient, drugCategories, onPreview }) => {
  // Drugs matched from the patient's reaction history (used for UI badges).
  // Match is hyphen/space/case-insensitive: REDCap's reaction form spells some
  // drugs differently from the masterlist (e.g. reaction "Cisatracurium" vs
  // masterlist "Cis-atracurium"), so we strip non-alphanumerics before comparing.
  const historyDrugs = useMemo(() => {
    const patientDrugs = [
      ...(patient.history.preInductionDrugs ?? []),
      ...(patient.history.postInductionDrugs ?? []),
      ...(patient.history.medications ?? []),
      ...(patient.history.suspectedAgents ?? []),
    ].map(stripForMatch).filter(Boolean);
    return Object.values(drugCategories).flat().filter(drug => {
      const normDrug = stripForMatch(drug);
      return normDrug.length > 0 && patientDrugs.some(pd => pd.includes(normDrug) || normDrug.includes(pd));
    });
  }, [
    drugCategories,
    patient.history.medications,
    patient.history.postInductionDrugs,
    patient.history.preInductionDrugs,
    patient.history.suspectedAgents,
  ]);

  const initialDrugs = useMemo(() => {
    // Priority 1: explicit testing plan from REDCap instrument
    if (patient.history.testingPlan?.length) {
      return [...new Set([...DEFAULT_SELECTED_DRUGS, ...patient.history.testingPlan])];
    }
    // Fallback: infer from drugs given during the reaction
    return [...new Set([...DEFAULT_SELECTED_DRUGS, ...historyDrugs])];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  const defaultDraft = useMemo<TestingPlanBuilderDraft>(() => ({
    selectedDrugs: initialDrugs,
    selectedProtocols: {},
    customDrugs: [],
    notes: '',
    urgent: false,
    reactionDate: patient.history.date ?? '',
    documentsToChase: {
      tryptases: patient.history.documentsToChase?.tryptases ?? false,
      anaestheticChart: patient.history.documentsToChase?.anaestheticChart ?? false,
      other: patient.history.documentsToChase?.other ?? false,
      otherText: patient.history.documentsToChase?.otherText ?? '',
    },
  }), [
    initialDrugs,
    patient.history.date,
    patient.history.documentsToChase?.anaestheticChart,
    patient.history.documentsToChase?.other,
    patient.history.documentsToChase?.otherText,
    patient.history.documentsToChase?.tryptases,
  ]);

  const restoredDraft = readDraftForPatient(patient.id) ?? defaultDraft;

  const [isOpen, setIsOpen] = useState(true);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(restoredDraft.selectedDrugs);
  const [selectedProtocols, setSelectedProtocols] = useState<Record<string, number>>(restoredDraft.selectedProtocols);
  const [customDrugs, setCustomDrugs] = useState<CustomDrugEntry[]>(restoredDraft.customDrugs);
  const [notes, setNotes] = useState(restoredDraft.notes);
  const [drugFilter, setDrugFilter] = useState('');
  const [newCustomDrug, setNewCustomDrug] = useState('');
  const [customDrugNotice, setCustomDrugNotice] = useState('');
  const [urgent, setUrgent] = useState(restoredDraft.urgent);
  const [reactionDate, setReactionDate] = useState(restoredDraft.reactionDate);
  const [documentsToChase, setDocumentsToChase] = useState<DocumentsToChase>(restoredDraft.documentsToChase);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [draftPatientId, setDraftPatientId] = useState(patient.id);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const previousHistoryDrugs = useRef({ patientId: patient.id, drugs: historyDrugs });
  const today = useMemo(getTodayDate, []);
  const allKnownDrugs = useMemo(
    () => [...new Set(Object.values(drugCategories).flat())],
    [drugCategories]
  );
  const redcapOtherText = patient.history.testingPlanCustom?.trim() ?? '';

  useEffect(() => {
    const nextDraft = readDraftForPatient(patient.id) ?? defaultDraft;
    setSelectedDrugs(nextDraft.selectedDrugs);
    setSelectedProtocols(nextDraft.selectedProtocols);
    setCustomDrugs(nextDraft.customDrugs);
    setNotes(nextDraft.notes);
    setUrgent(nextDraft.urgent);
    setReactionDate(nextDraft.reactionDate);
    setDocumentsToChase(nextDraft.documentsToChase);
    setCustomDrugNotice('');
    setDrugFilter('');
    setNewCustomDrug('');
    setIsOpen(true);
    setDraftPatientId(patient.id);
  }, [patient.id, defaultDraft]);

  useEffect(() => {
    if (previousHistoryDrugs.current.patientId !== patient.id) {
      previousHistoryDrugs.current = { patientId: patient.id, drugs: historyDrugs };
      return;
    }

    const newlyAddedHistoryDrugs = historyDrugs.filter(
      drug => !previousHistoryDrugs.current.drugs.includes(drug)
    );
    previousHistoryDrugs.current = { patientId: patient.id, drugs: historyDrugs };
    if (newlyAddedHistoryDrugs.length > 0) {
      setSelectedDrugs(currentDrugs => [
        ...currentDrugs,
        ...newlyAddedHistoryDrugs.filter(drug => !currentDrugs.includes(drug)),
      ]);
    }
  }, [historyDrugs, patient.id]);

  useEffect(() => {
    if (draftPatientId !== patient.id) return;

    const drafts = getIfFresh<TestingPlanBuilderDrafts>(TESTING_PLAN_BUILDER_DRAFTS_KEY) ?? {};
    setWithTTL<TestingPlanBuilderDrafts>(TESTING_PLAN_BUILDER_DRAFTS_KEY, {
      ...drafts,
      [patient.id]: {
        selectedDrugs,
        selectedProtocols,
        customDrugs,
        notes,
        urgent,
        reactionDate,
        documentsToChase,
      },
    });
    setLastDraftSavedAt(Date.now());
  }, [customDrugs, documentsToChase, draftPatientId, notes, patient.id, reactionDate, selectedDrugs, selectedProtocols, urgent]);

  const toggleDoc = (key: 'tryptases' | 'anaestheticChart' | 'other') => {
    setDocumentsToChase(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDrug = (drug: string) => {
    setSelectedDrugs(prev => {
      if (prev.includes(drug)) {
        setSelectedProtocols(protocols => {
          const next = { ...protocols };
          delete next[drug];
          return next;
        });
        return prev.filter(d => d !== drug);
      }
      return [...prev, drug];
    });
  };

  const toggleCategory = (categoryDrugs: string[]) => {
    const allSelected = categoryDrugs.every(d => selectedDrugs.includes(d));
    if (allSelected) {
      // Deselect all in category
      setSelectedDrugs(prev => prev.filter(d => !categoryDrugs.includes(d)));
      setSelectedProtocols(prev => {
        const next = { ...prev };
        categoryDrugs.forEach(drug => delete next[drug]);
        return next;
      });
    } else {
      // Select all in category
      setSelectedDrugs(prev => [...new Set([...prev, ...categoryDrugs])]);
    }
  };

  const addCustomDrugByName = (rawName: string, options?: { fromRedcapOther?: boolean }) => {
    const name = rawName.trim();
    if (!name) return;

    const normalized = normalizeDrugName(name);
    const knownDrug = allKnownDrugs.find(drug => normalizeDrugName(drug) === normalized);
    if (knownDrug) {
      setSelectedDrugs(prev => prev.includes(knownDrug) ? prev : [...prev, knownDrug]);
      setDrugFilter(knownDrug);
      setCustomDrugNotice(`${knownDrug} is already in the master list and has been selected from its category.`);
      setNewCustomDrug('');
      return;
    }

    const existingCustom = customDrugs.find(entry => normalizeDrugName(entry.name) === normalized);
    if (existingCustom) {
      if (options?.fromRedcapOther && !existingCustom.fromRedcapOther) {
        setCustomDrugs(prev => prev.map(entry =>
          normalizeDrugName(entry.name) === normalized ? { ...entry, fromRedcapOther: true } : entry
        ));
      }
      setSelectedDrugs(prev => prev.includes(existingCustom.name) ? prev : [...prev, existingCustom.name]);
      setCustomDrugNotice(`${existingCustom.name} is already in Additional Items and has been selected.`);
      setNewCustomDrug('');
      return;
    }

    setCustomDrugs(prev => [...prev, {
      name,
      sptConcentration: '',
      idtSteps: [],
      includeInChallenge: false,
      fromRedcapOther: options?.fromRedcapOther,
    }]);
    setSelectedDrugs(prev => [...prev, name]);
    setNewCustomDrug('');
    setCustomDrugNotice('');
  };

  const addCustomDrug = () => addCustomDrugByName(newCustomDrug);

  const addRedcapOtherAsCustomDrug = () => {
    addCustomDrugByName(redcapOtherText, { fromRedcapOther: true });
  };

  const removeCustomDrug = (name: string) => {
    setCustomDrugs(prev => prev.filter(e => e.name !== name));
    setSelectedDrugs(prev => prev.filter(d => d !== name));
  };

  const updateCustomEntry = (name: string, field: keyof CustomDrugEntry, value: any) => {
    setCustomDrugs(prev => prev.map(e => e.name === name ? { ...e, [field]: value } : e));
  };

  const updateCustomEntryStep = (name: string, si: number, field: string, value: string) => {
    setCustomDrugs(prev => prev.map(e => {
      if (e.name !== name) return e;
      const steps = [...(e.idtSteps ?? [])];
      steps[si] = { ...(steps[si] ?? { ratio: '', concentration: '' }), [field]: value };
      return { ...e, idtSteps: steps };
    }));
  };

  const addCustomEntryIdtStep = (name: string) => {
    setCustomDrugs(prev => prev.map(e =>
      e.name === name ? { ...e, idtSteps: [...(e.idtSteps ?? []), { ratio: '', concentration: '' }] } : e
    ));
  };

  const removeCustomEntryIdtStep = (name: string, idx: number) => {
    setCustomDrugs(prev => prev.map(e =>
      e.name === name ? { ...e, idtSteps: (e.idtSteps ?? []).filter((_, i) => i !== idx) } : e
    ));
  };

  const updateSelectedProtocol = (drug: string, protocolIndex: number) => {
    setSelectedProtocols(prev => ({ ...prev, [drug]: protocolIndex }));
  };

  const clearPlan = () => {
    setSelectedDrugs([]);
    setSelectedProtocols({});
    setCustomDrugs([]);
    setCustomDrugNotice('');
  };

  const protocolChoices = useMemo(() => (
    selectedDrugs
      .map(drug => ({ drug, protocols: getSkinProtocolsForDrug(drug) }))
      .filter(({ protocols }) => protocols.length > 1)
  ), [selectedDrugs]);

  const selectedListedDrugResolutions = useMemo(() => {
    return selectedDrugs
      .filter(drug => !customDrugs.some(c => c.name === drug))
      .map(drug => {
        const protocols = getSkinProtocolsForDrug(drug);
        const resolution = resolveSelectedProtocol(protocols, selectedProtocols[drug]);
        return { drug, protocols, resolution };
      });
  }, [selectedDrugs, customDrugs, selectedProtocols]);

  const hasUnresolvedProtocols = useMemo(() => {
    return selectedListedDrugResolutions.some(
      item => item.resolution.status === 'invalid' || item.resolution.status === 'empty'
    );
  }, [selectedListedDrugResolutions]);

  const selectedListedDrugs = useMemo(() => {
    return selectedListedDrugResolutions.filter(
      (item): item is { drug: string; protocols: DrugProtocol[]; resolution: ProtocolResolution } => item.protocols.length > 0
    );
  }, [selectedListedDrugResolutions]);

  const handlePreview = () => {
    if (hasUnresolvedProtocols) {
      return;
    }

    const selectedProtocolPayload: Record<string, number> = {};
    selectedDrugs.forEach(drug => {
      if (selectedProtocols[drug] !== undefined) {
        selectedProtocolPayload[drug] = selectedProtocols[drug];
      }
    });

    onPreview({
      selectedDrugs,
      selectedProtocols: selectedProtocolPayload,
      customDrugs,
      notes,
      urgent,
      reactionDate,
      documentsToChase,
    });
  };


  const customTheme = CATEGORY_THEMES['Others'] || DEFAULT_THEME;
  const hasCustomActive = customDrugs.some(e => selectedDrugs.includes(e.name));
  const selectedSummary = `${selectedDrugs.length} drug${selectedDrugs.length === 1 ? '' : 's'} selected`;
  const redcapOtherAlreadyAdded = redcapOtherText
    ? selectedDrugs.some(drug => normalizeDrugName(drug) === normalizeDrugName(redcapOtherText))
      || customDrugs.some(entry => normalizeDrugName(entry.name) === normalizeDrugName(redcapOtherText))
    : false;
  // A REDCap "(not listed)" item is awaiting action — emphasize Additional Items.
  const hasPendingRedcapOther = Boolean(redcapOtherText) && !redcapOtherAlreadyAdded;

  return (
    <>
      <Card elevation="raised" className="bg-card overflow-hidden" data-testid="testing-plan-builder">
        <div
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-controls="testing-plan-builder-content"
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen(open => !open);
              }
            }}
        >
             <div className="flex items-center gap-3">
                <div className="bg-muted p-1.5 rounded-none text-muted-foreground">
                    <ClipboardList className="w-5 h-5" />
                </div>
                 <div>
                     <h2 className="heading-section text-primary dark:text-primary">Testing Request Form</h2>
                     <p className="text-xs text-muted-foreground font-medium">
                      Select drugs to generate a printable testing plan
                    </p>
                    <DraftSaveIndicator lastSavedAt={lastDraftSavedAt} className="mt-1 block" />
                </div>
             </div>
             <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex border border-border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground tabular-nums">
                  {selectedSummary}
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
             </div>
        </div>

        {isOpen && (
            <CardContent id="testing-plan-builder-content" className="p-4 sm:p-6">
                <div className="border-t border-border pt-4 space-y-6">

                    <RequestDetailsSection
                      urgent={urgent}
                      reactionDate={reactionDate}
                      today={today}
                      setUrgent={setUrgent}
                      setReactionDate={setReactionDate}
                    />

                    <DocumentsToChaseSection
                      documentsToChase={documentsToChase}
                      toggleDoc={toggleDoc}
                      setDocumentsToChase={setDocumentsToChase}
                    />

                    {/* Drug Selection Grid + full-span sections */}
                    <TestingPlanGeneratorDrugSelection
                      drugCategories={drugCategories}
                      selectedDrugs={selectedDrugs}
                      selectedProtocols={selectedProtocols}
                      historyDrugs={historyDrugs}
                      drugFilter={drugFilter}
                      setDrugFilter={setDrugFilter}
                      toggleDrug={toggleDrug}
                      toggleCategory={toggleCategory}
                      onClearAll={() => setConfirmClearOpen(true)}
                      hasNothingToClear={selectedDrugs.length === 0 && customDrugs.length === 0}
                    >
                      <ProtocolChoicesSection
                        protocolChoices={protocolChoices}
                        selectedProtocols={selectedProtocols}
                        updateSelectedProtocol={updateSelectedProtocol}
                      />
                      <TestingPlanGeneratorCustomDrug
                        customDrugs={customDrugs}
                        selectedDrugs={selectedDrugs}
                        customTheme={customTheme}
                        hasCustomActive={hasCustomActive}
                        hasPendingRedcapOther={hasPendingRedcapOther}
                        redcapOtherText={redcapOtherText}
                        newCustomDrug={newCustomDrug}
                        setNewCustomDrug={setNewCustomDrug}
                        customDrugNotice={customDrugNotice}
                        toggleDrug={toggleDrug}
                        addRedcapOtherAsCustomDrug={addRedcapOtherAsCustomDrug}
                        removeCustomDrug={removeCustomDrug}
                        updateCustomEntry={updateCustomEntry}
                        updateCustomEntryStep={updateCustomEntryStep}
                        addCustomEntryIdtStep={addCustomEntryIdtStep}
                        removeCustomEntryIdtStep={removeCustomEntryIdtStep}
                        addCustomDrug={addCustomDrug}
                      />
                      <DoseSpecificationsSection selectedListedDrugs={selectedListedDrugs} />
                    </TestingPlanGeneratorDrugSelection>

                    {/* Legend callout */}
                    <div className="flex flex-col gap-1.5 p-3 border border-border bg-muted/40 rounded-none">
                        <div className="flex items-start gap-2">
                            <Pin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground leading-snug">
                                <span className="font-semibold">Pre-filled</span> for all patients by default.
                            </p>
                        </div>
                        {historyDrugs.length > 0 && (
                            <div className="flex items-start gap-2">
                                <History className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground leading-snug">
                                    <span className="font-semibold">Auto-selected</span> from patient history — given at time of reaction.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-2">
                        <Label htmlFor="testing-plan-notes" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Clinical Notes / Indication</Label>
                        <Textarea
                            id="testing-plan-notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="min-h-[60px] rounded-none bg-background"
                        />
                    </div>

                    <TestingPlanGeneratorActions
                      hasUnresolvedProtocols={hasUnresolvedProtocols}
                      onPreview={handlePreview}
                    />
                </div>
            </CardContent>
        )}
      </Card>
      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear testing plan?"
        message="This removes every selected drug and all custom drug protocol details for this patient. This cannot be undone."
        confirmLabel="Clear plan"
        cancelLabel="Keep plan"
        variant="danger"
        onConfirm={clearPlan}
      />
    </>
  );
};

export default TestingPlanGenerator;
