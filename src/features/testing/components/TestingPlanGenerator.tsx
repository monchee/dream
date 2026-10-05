import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, Button, Label, Switch, Checkbox, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Patient, TestingPlanData, CustomDrugEntry, DocumentsToChase } from '@shared/types';
import { DrugProtocol } from '@features/testing/types';
import { Printer, Check, X, ClipboardList, ChevronDown, Plus, History, Pin, Search, AlertTriangle } from 'lucide-react';
import { CATEGORY_THEMES, DEFAULT_THEME, DEFAULT_SELECTED_DRUGS } from '@shared/utils/constants';
import { getSkinProtocolsForDrug } from '@shared/data/drugMasterlist';
import { resolveSelectedProtocol, type ProtocolResolution } from '@shared/utils/protocolResolver';
import { getIfFresh, setWithTTL, TESTING_PLAN_BUILDER_DRAFTS_KEY } from '@shared/utils/ttlStorage';
import { DraftSaveIndicator } from './DraftSaveIndicator';
import { ProtocolDoseTable } from './ProtocolDoseTable';


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
    const isBlocked = selectedListedDrugResolutions.some(
      item => item.resolution.status === 'invalid' || item.resolution.status === 'empty'
    );
    if (isBlocked) {
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

                    {/* Request Details: Date of Reaction + Urgent */}
                    <div className={`space-y-2 rounded-none p-3 transition-colors duration-150 ${
                        urgent
                            ? 'bg-status-danger/10 ring-1 ring-status-danger/30'
                            : ''
                    }`}>
                        <div className={`flex items-center border-b border-dashed pb-1 mb-2 ${
                            urgent ? 'border-status-danger/30' : 'border-border'
                        }`}>
                            <h3 className={`section-label ${
                                urgent ? 'text-status-danger' : ''
                            }`}>Request Details</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="reaction-date" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider whitespace-nowrap">Date of Reaction</Label>
                                <Input
                                    id="reaction-date"
                                    type="date"
                                    value={reactionDate ? reactionDate.slice(0, 10) : ''}
                                    max={today}
                                    onChange={e => setReactionDate(e.target.value)}
                                    className="h-11 xl:h-8 w-auto"
                                />
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
                                <Label
                                    htmlFor="urgent"
                                    className={`text-sm font-bold uppercase tracking-wide cursor-pointer ${
                                        urgent ? 'text-status-danger' : 'text-muted-foreground'
                                    }`}
                                >
                                    Urgent
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Documents to Chase */}
                    <div className="space-y-2 rounded-none p-3 transition-colors duration-150">
                        <div className="flex items-center border-b border-dashed border-border pb-1 mb-2">
                            <h3 className="section-label">Documents to Chase</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Checkbox id="doc-tryptases" checked={documentsToChase.tryptases} onCheckedChange={() => toggleDoc('tryptases')} />
                                <Label htmlFor="doc-tryptases" className="text-sm cursor-pointer">Tryptases</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="doc-anaesthetic" checked={documentsToChase.anaestheticChart} onCheckedChange={() => toggleDoc('anaestheticChart')} />
                                <Label htmlFor="doc-anaesthetic" className="text-sm cursor-pointer">Anaesthetic Chart</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="doc-other" checked={documentsToChase.other} onCheckedChange={() => toggleDoc('other')} />
                                <Label htmlFor="doc-other" className="text-sm cursor-pointer">Other</Label>
                            </div>
                            {documentsToChase.other && (
                                <Input
                                    placeholder="Specify..."
                                    aria-label="Specify other document to chase"
                                    value={documentsToChase.otherText}
                                    onChange={e => setDocumentsToChase(prev => ({ ...prev, otherText: e.target.value }))}
                                    className="flex-1 min-w-[160px] h-11 xl:h-8"
                                />
                            )}
                        </div>
                    </div>

                    {/* Drug Selection Grid */}
                    <div className="space-y-2 rounded-none p-3 transition-colors duration-150">
                        <div className="flex items-center justify-between border-b border-dashed border-border pb-1 mb-2">
                            <h3 className="section-label">Select Drugs for Testing</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmClearOpen(true)}
                              className="text-xs text-muted-foreground hover:text-destructive min-h-[44px] xl:min-h-0 xl:h-6 px-2 rounded-none"
                              title="Clear all selected drugs"
                              disabled={selectedDrugs.length === 0 && customDrugs.length === 0}
                            >
                              Clear All
                            </Button>
                        </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        value={drugFilter}
                        onChange={e => setDrugFilter(e.target.value)}
                        placeholder="Filter drugs..."
                        aria-label="Filter drugs"
                        className="h-11 xl:h-8 pl-8 pr-11 xl:pr-8 text-xs rounded-none"
                      />
                      {drugFilter && (
                        <button
                          type="button"
                          onClick={() => setDrugFilter('')}
                          aria-label="Clear drug filter"
                          className="absolute right-1 xl:right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                        {Object.entries(drugCategories).map(([category, drugs]) => {
                            const categoryDrugs = drugs as string[];
                            const filteredDrugs = drugFilter
                              ? categoryDrugs.filter(d => d.toLowerCase().includes(drugFilter.toLowerCase()))
                              : categoryDrugs;

                            if (drugFilter && filteredDrugs.length === 0) return null;

                            const allCategorySelected = categoryDrugs.every(d => selectedDrugs.includes(d));
                            const hasActiveSelection = categoryDrugs.some(d => selectedDrugs.includes(d));

                            const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;

                            return (
                                <div
                                    key={category}
                                    className={`space-y-2 rounded-none p-3 transition-colors duration-150 ${category === 'Others' ? 'col-span-full' : ''} ${hasActiveSelection ? `${theme.activeBg} ${theme.activeRing} ring-1` : 'hover:bg-muted/50'}`}
                                >
                                    <div className={`flex justify-between items-center border-b border-dashed pb-1 mb-2 ${hasActiveSelection ? `${theme.headerBorder}` : 'border-border'}`}>
                                        <h4 className={`section-label flex items-center gap-2 ${hasActiveSelection ? theme.headerText : ''}`}>
                                            {category}
                                            {hasActiveSelection && <span className={`flex h-1.5 w-1.5 rounded-none ${theme.pulse} animate-pulse`}></span>}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); toggleCategory(categoryDrugs); }}
                                            className={`text-xs hover:underline font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] xl:min-h-0 inline-flex items-center ${hasActiveSelection ? theme.actionText : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {allCategorySelected ? 'Select None' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className={category === 'Others' ? 'flex flex-wrap gap-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'flex flex-wrap gap-2'}>
                                        {filteredDrugs.map(drug => {
                                            const fromHistory = historyDrugs.includes(drug);
                                            const isDefault = DEFAULT_SELECTED_DRUGS.includes(drug);
                                            const protocols = getSkinProtocolsForDrug(drug);
                                            const resolution = resolveSelectedProtocol(protocols, selectedProtocols[drug]);
                                            const needsPharmacyVerification = resolution.status === 'valid' && resolution.protocol.needsPharmacyVerification === true;
                                            return (
                                            <button
                                                key={drug}
                                                onClick={() => toggleDrug(drug)}
                                                aria-pressed={selectedDrugs.includes(drug)}
                                                className={`text-xs px-2.5 py-1.5 min-h-[44px] xl:min-h-0 rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === 'Others' ? 'md:w-full' : ''} ${
                                                selectedDrugs.includes(drug)
                                                ? theme.btnSelected
                                                : `bg-card text-muted-foreground border-border hover:bg-muted/50 ${theme.btnHover}`
                                                }`}
                                            >
                                                {selectedDrugs.includes(drug) && <Check className="w-3 h-3 shrink-0" />}
                                                {drug}
                                                {selectedDrugs.includes(drug) && needsPharmacyVerification && (
                                                    <span className="border border-status-warning bg-status-warning/10 px-1.5 py-0.5 text-xs font-semibold leading-tight text-status-warning rounded-none">
                                                        ⚠ Confirm preparation with pharmacy
                                                    </span>
                                                )}
                                                {isDefault && (
                                                    <span title="Pre-filled for all patients by default" className="inline-flex">
                                                        <Pin className="w-3 h-3 shrink-0 opacity-70" aria-label="Standard pre-fill" />
                                                    </span>
                                                )}
                                                {fromHistory && (
                                                    <span title="Auto-selected from patient history" className="inline-flex">
                                                        <History className="w-3 h-3 shrink-0 opacity-70" aria-label="Given at time of reaction" />
                                                    </span>
                                                )}
                                            </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {drugFilter && Object.values(drugCategories).every(
                          drugs => !(drugs as string[]).some(d => d.toLowerCase().includes(drugFilter.toLowerCase()))
                        ) && (
                          <p className="text-xs text-muted-foreground col-span-full py-2">No drugs match &ldquo;{drugFilter}&rdquo;</p>
                        )}

                        {protocolChoices.length > 0 && (
                          <div className="col-span-full border border-border bg-muted/30 p-3 space-y-3 rounded-none">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h5 className="section-label">Protocol Choices</h5>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {protocolChoices.length} drug{protocolChoices.length === 1 ? '' : 's'} with multiple protocols
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {protocolChoices.map(({ drug, protocols }) => {
                                const resolution = resolveSelectedProtocol(protocols, selectedProtocols[drug]);
                                const isInvalid = resolution.status === 'invalid';
                                const selectValue = resolution.status === 'valid' ? String(resolution.index) : '';
                                return (
                                  <div key={drug} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`protocol-${drug}`} className="text-xs font-medium text-foreground">
                                        {drug}
                                      </Label>
                                      {isInvalid && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-status-danger">
                                          <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Review required
                                        </span>
                                      )}
                                    </div>
                                    <Select
                                      value={selectValue}
                                      onValueChange={(value) => updateSelectedProtocol(drug, Number(value))}
                                    >
                                      <SelectTrigger
                                        id={`protocol-${drug}`}
                                        className={`h-11 xl:h-8 text-xs rounded-none bg-background ${
                                          isInvalid ? 'border-status-danger text-status-danger ring-1 ring-status-danger/30' : ''
                                        }`}
                                      >
                                        <SelectValue placeholder="Select protocol (review required)..." />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-none">
                                        {protocols.map((protocol, index) => (
                                          <SelectItem key={`${drug}-${index}`} value={String(index)} className="text-xs rounded-none">
                                            {protocol.protocolLabel || `Protocol ${index + 1}`}
                                            {protocol.presentation ? ` - ${protocol.presentation}` : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}


                        {/* Custom Drugs Section */}
                        <div className={`col-span-full space-y-2 rounded-none p-3 transition-colors duration-150 ${
                            hasPendingRedcapOther
                              ? 'bg-status-warning/10 ring-1 ring-status-warning/30'
                              : hasCustomActive ? `${customTheme.activeBg} ${customTheme.activeRing} ring-1` : 'hover:bg-muted/50'
                          }`}>
                            <div className={`flex justify-between items-center border-b border-dashed pb-1 mb-2 ${
                                hasPendingRedcapOther ? 'border-status-warning/30' : hasCustomActive ? `${customTheme.headerBorder}` : 'border-border'
                              }`}>
                                <h4 className={`section-label flex items-center gap-2 ${
                                    hasPendingRedcapOther ? 'text-status-warning' : hasCustomActive ? customTheme.headerText : ''
                                  }`}>
                                    Additional Items
                                    {hasPendingRedcapOther
                                      ? <span className="flex h-1.5 w-1.5 rounded-none bg-status-warning animate-pulse"></span>
                                      : hasCustomActive && <span className={`flex h-1.5 w-1.5 rounded-none ${customTheme.pulse} animate-pulse`}></span>}
                                </h4>
                            </div>
                            {hasPendingRedcapOther && (
                              <div className="mb-3 border border-status-warning/30 bg-status-warning/10 p-3 rounded-none">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-status-warning">
                                      From REDCap — Others (not listed)
                                    </p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{redcapOtherText}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addRedcapOtherAsCustomDrug}
                                    className="min-h-[44px] xl:h-8 shrink-0 border-status-warning/50 text-status-warning hover:bg-status-warning/15 rounded-none"
                                  >
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    Add as custom item
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {customDrugs.map(entry => (
                                    <div key={entry.name} className="md:w-full flex items-stretch">
                                        <button
                                            type="button"
                                            onClick={() => toggleDrug(entry.name)}
                                            aria-pressed={selectedDrugs.includes(entry.name)}
                                            className={`min-w-0 flex-1 text-xs px-2.5 py-1.5 rounded-none border transition-[color,background-color,border-color,box-shadow] duration-150 flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                entry.fromRedcapOther
                                                ? selectedDrugs.includes(entry.name)
                                                  ? 'bg-status-warning text-status-warning-foreground border-status-warning shadow-sm ring-1 ring-status-warning/30'
                                                  : 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning/20'
                                                : selectedDrugs.includes(entry.name)
                                                  ? customTheme.btnSelected
                                                  : `bg-card text-muted-foreground border-border hover:bg-muted/50 ${customTheme.btnHover}`
                                            }`}
                                        >
                                            {selectedDrugs.includes(entry.name) && <Check className="w-3 h-3 shrink-0" />}
                                            <span className="truncate">{entry.name}</span>
                                            {entry.fromRedcapOther && (
                                              <span className="shrink-0 text-xs uppercase tracking-wider opacity-90">
                                                (not listed)
                                              </span>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeCustomDrug(entry.name)}
                                            className="border border-l-0 border-border px-2 min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 inline-flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive rounded-none"
                                            aria-label={`Remove custom drug ${entry.name}`}
                                            title={`Remove ${entry.name}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {/* Inline protocol editing for selected custom drugs */}
                            {customDrugs.filter(e => selectedDrugs.includes(e.name)).map(entry => (
                                <div key={`proto-${entry.name}`} className="border border-dashed border-border p-2 space-y-2 bg-muted/30 mb-2 rounded-none">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{entry.name} — Protocol</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0 w-7">SPT</span>
                                        <Input
                                            className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono"
                                            placeholder="Neat concentration (e.g. 10mg/mL)..."
                                            aria-label={`${entry.name} SPT neat concentration`}
                                            value={entry.sptConcentration || ''}
                                            onChange={ev => updateCustomEntry(entry.name, 'sptConcentration', ev.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IDT Dilutions</div>
                                        {(entry.idtSteps ?? []).map((step, si) => (
                                            <div key={si} className="flex items-center gap-1.5">
                                                <Input className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono" placeholder="Ratio (e.g. 1:100)" aria-label={`${entry.name} IDT dilution step ${si + 1} ratio`} value={step.ratio} onChange={ev => updateCustomEntryStep(entry.name, si, 'ratio', ev.target.value)} />
                                                <Input className="h-11 xl:h-7 text-xs flex-1 rounded-none font-mono" placeholder="Conc. (e.g. 0.1mg/mL)" aria-label={`${entry.name} IDT dilution step ${si + 1} concentration`} value={step.concentration} onChange={ev => updateCustomEntryStep(entry.name, si, 'concentration', ev.target.value)} />
                                                <button type="button" onClick={() => removeCustomEntryIdtStep(entry.name, si)} aria-label={`Remove ${entry.name} IDT dilution step ${si + 1}`} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors p-2 -m-1 min-h-[44px] min-w-[44px] flex items-center justify-center xl:min-h-0 xl:min-w-0 xl:m-0 xl:p-0.5" title="Remove step">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addCustomEntryIdtStep(entry.name)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[44px] xl:min-h-0 w-fit">
                                            <Plus className="w-3 h-3" /> Add IDT dilution step
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox id={`plan-challenge-${entry.name}`} checked={entry.includeInChallenge || false} onCheckedChange={checked => updateCustomEntry(entry.name, 'includeInChallenge', checked === true)} />
                                        <Label htmlFor={`plan-challenge-${entry.name}`} className="text-xs text-muted-foreground cursor-pointer select-none">Include in drug challenge</Label>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    className="flex-1 h-8 text-xs rounded-none bg-background"
                                    placeholder="Add custom drug..."
                                    value={newCustomDrug}
                                    onChange={e => setNewCustomDrug(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCustomDrug()}
                                    aria-describedby={customDrugNotice ? 'custom-drug-notice' : undefined}
                                />
                                <Button size="sm" variant="outline" onClick={addCustomDrug} className="h-8 w-8 p-0 rounded-none" aria-label="Add custom drug">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            {customDrugNotice && (
                              <p id="custom-drug-notice" className="text-xs text-muted-foreground">
                                {customDrugNotice}
                              </p>
                            )}
                        </div>

                        {/* Selected Protocol & Dose Details for Listed Drugs */}
                        {selectedListedDrugs.length > 0 && (
                          <div className="col-span-full border border-border bg-muted/20 p-3 space-y-3 rounded-none" data-testid="selected-protocol-details">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-dashed border-border pb-1">
                              <h5 className="section-label">Protocol &amp; Dose Specifications</h5>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {selectedListedDrugs.length} selected drug{selectedListedDrugs.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                              {selectedListedDrugs.map(({ drug, resolution }) => {
                                if (resolution.status === 'valid') {
                                  return <ProtocolDoseTable key={drug} protocol={resolution.protocol} />;
                                }
                                if (resolution.status === 'invalid') {
                                  return (
                                    <div
                                      key={drug}
                                      role="alert"
                                      aria-live="assertive"
                                      className="border border-status-danger bg-status-danger/10 p-3 rounded-none space-y-1 text-status-danger"
                                      data-testid={`protocol-review-required-${drug}`}
                                    >
                                      <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <span>⚠ {drug} — Protocol selection requires review</span>
                                      </div>
                                      <p className="text-xs font-normal text-foreground/90 leading-relaxed">
                                        Saved protocol selection index is invalid. Please select a valid protocol option in Protocol Choices below.
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                    </div>

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

                    <div className="pt-4 border-t border-border space-y-3">
                        {hasUnresolvedProtocols && (
                          <div
                            role="alert"
                            aria-live="assertive"
                            className="border border-status-danger bg-status-danger/10 p-3 rounded-none text-status-danger space-y-1"
                            data-testid="protocol-selection-review-alert"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span>⚠ Protocol selection requires review</span>
                            </div>
                            <p className="text-xs font-normal text-foreground/90 leading-relaxed">
                              Protocol selection requires review. A valid protocol option must be selected before previewing or printing.
                            </p>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button onClick={handlePreview} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold rounded-none btn-press">
                              <Printer className="w-4 h-4 mr-2" /> Preview & Print Request Form
                          </Button>
                        </div>
                    </div>
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
