import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient } from '@shared/types';
import { formatDate } from '@shared/utils';
import { Search, ChevronDown, Check, UserPlus } from 'lucide-react';
import { EmptyState } from '@shared/components/states';

interface PatientSelectorProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId?: string;
  patients: Patient[];
}

const PatientSelector: React.FC<PatientSelectorProps> = ({ onSelectPatient, selectedPatientId, patients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Memoize sorted patients to avoid recalculating on every render
  // Handle non-numeric IDs gracefully
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
        const idA = parseInt(a.id);
        const idB = parseInt(b.id);
        if (isNaN(idA) || isNaN(idB)) {
            return a.id.localeCompare(b.id);
        }
        return idA - idB;
    });
  }, [patients]);

  // Memoize filtered patients based on search term
  const filteredPatients = useMemo(() => {
      const lowerSearch = searchTerm.toLowerCase();
      return sortedPatients.filter(p => {
        const searchString = `${p.id} ${p.firstName} ${p.lastName} ${formatDate(p.dob)}`.toLowerCase();
        return searchString.includes(lowerSearch);
      });
  }, [sortedPatients, searchTerm]);

  const selectedPatient = sortedPatients.find(p => p.id === selectedPatientId);
  const isManualSelection = selectedPatientId === 'manual';
  const activeOptionId = activeIndex === 0
    ? 'patient-option-manual'
    : `patient-option-${filteredPatients[activeIndex - 1]?.id}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    onSelectPatient(patient);
    setIsOpen(false);
    setSearchTerm("");
    setActiveIndex(0);
  };

  const handleManualEntry = () => {
    const manualPatient: Patient = {
        id: 'manual',
        firstName: '',
        lastName: '',
        dob: '',
        mrn: '',
        gender: '',
        city: '',
        history: {
            date: new Date().toISOString(),
            grade: 'Ungraded',
            reactionSummary: 'Manual entry - no history.',
            symptoms: [],
            treatment: [],
            suspectedAgents: [],
            procedure: 'N/A',
            anaesthetist: '',
            inductionTime: '',
            reactionTime: ''
        }
    };
    handleSelect(manualPatient);
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent) => {
    const optionCount = filteredPatients.length + 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => (index + 1) % optionCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => (index - 1 + optionCount) % optionCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex === 0) {
        handleManualEntry();
      } else {
        const patient = filteredPatients[activeIndex - 1];
        if (patient) handleSelect(patient);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <span className="text-sm font-medium text-foreground/80 mb-1 block" id="patient-selector-label">
        Select Patient from Database
      </span>

      <div className="relative">
        <button
          type="button"
          ref={triggerRef}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="patient-selector-listbox"
          aria-labelledby="patient-selector-label"
          className="flex min-h-[44px] xl:min-h-10 h-auto w-full items-center justify-between rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-[color,background-color,border-color,box-shadow]"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <span className={`mr-2 whitespace-normal text-left leading-tight ${selectedPatient || isManualSelection ? "text-foreground" : "text-muted-foreground"}`}>
            {isManualSelection
                ? "[New] Manual Entry"
                : selectedPatient
                    ? `[ID: ${selectedPatient.id}] ${selectedPatient.lastName}, ${selectedPatient.firstName} (DOB: ${formatDate(selectedPatient.dob)})`
                    : "Search or select patient..."
            }
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 dark:text-muted-foreground shrink-0" />
        </button>

        {isOpen && (
          <div
            id="patient-selector-listbox"
            role="listbox"
            aria-label="Patient list"
            aria-activedescendant={activeOptionId}
            className="absolute z-50 mt-1 max-h-[50vh] sm:max-h-80 w-full overflow-auto rounded-none border border-border bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100 dark:shadow-xl"
          >
            {/* Sticky Search Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-2 py-1.5">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        aria-label="Filter patients by ID or name"
                        aria-controls="patient-selector-listbox"
                        aria-autocomplete="list"
                        aria-activedescendant={activeOptionId}
                        className="w-full rounded-none border border-input bg-muted py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                        placeholder="Filter by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setActiveIndex(0); }}
                        onKeyDown={handleOptionKeyDown}
                        autoFocus
                    />
                </div>
            </div>

            {/* Manual Entry Option - Static List Item */}
            <div
                id="patient-option-manual"
                role="option"
                aria-selected={isManualSelection}
                className={`min-h-[44px] cursor-pointer select-none py-2 px-3 border-b border-border hover:bg-muted flex items-center gap-3 text-sm text-foreground/80 transition-colors ${activeIndex === 0 ? 'bg-muted' : ''}`}
                onClick={handleManualEntry}
            >
                <div className="bg-muted p-1.5 rounded-none text-muted-foreground">
                    <UserPlus className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-primary">New Patient (Manual Entry)</span>
                    <span className="text-xs text-muted-foreground">Create a record without database ID</span>
                </div>
                {isManualSelection && (
                    <div className="ml-auto text-primary">
                        <Check className="h-4 w-4" />
                    </div>
                )}
            </div>
            
            {filteredPatients.length === 0 ? (
                <EmptyState size="sm" title="No matching records found." />
            ) : (
                filteredPatients.map((patient, index) => (
                <div
                    id={`patient-option-${patient.id}`}
                    key={patient.id}
                    role="option"
                    aria-selected={selectedPatientId === patient.id}
                    className={`relative min-h-[44px] cursor-default select-none py-2 pl-3 pr-9 hover:bg-muted border-b border-border/50 transition-colors last:border-0 ${
                        selectedPatientId === patient.id || activeIndex === index + 1 ? "bg-muted/60 font-medium" : ""
                    }`}
                    onClick={() => handleSelect(patient)}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="block whitespace-normal leading-tight">
                            <span className="text-muted-foreground mr-2 font-mono text-xs">[{patient.id}]</span>
                            <span className="font-medium text-foreground">{patient.lastName}, {patient.firstName}</span>
                        </span>
                        <span className="block text-xs text-muted-foreground pl-8">
                            DOB: {formatDate(patient.dob)}
                        </span>
                    </div>
                    
                    {selectedPatientId === patient.id && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                            <Check className="h-4 w-4" />
                        </span>
                    )}
                </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PatientSelector);
