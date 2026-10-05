import React, { useState } from 'react';
import { X, Filter, Calendar, Building2, Activity, Search as SearchIcon } from 'lucide-react';
import { Button, Badge, Input, Label, Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui';
import { AdvancedSearchFilters as Filters } from '../hooks/useAdvancedSearch';
import { DRUG_CATEGORIES, CATEGORY_THEMES } from '@shared/utils/constants';

interface AdvancedSearchFiltersProps {
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  suggestions: {
    procedures: string[];
    hospitals: string[];
    agents: string[];
  };
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

const GRADE_OPTIONS = [
  { value: 'I', label: 'Grade I', color: 'bg-status-grade1/15 text-status-grade1 border-status-grade1/30' },
  { value: 'II', label: 'Grade II', color: 'bg-status-grade2/15 text-status-grade2 border-status-grade2/30' },
  { value: 'III', label: 'Grade III', color: 'bg-status-grade3/15 text-status-grade3 border-status-grade3/30' },
  { value: 'IV', label: 'Grade IV', color: 'bg-status-grade4/15 text-status-grade4 border-status-grade4/30' },
  { value: 'ungraded', label: 'Ungraded', color: 'bg-muted text-muted-foreground border-border' },
];

export const AdvancedSearchFilters: React.FC<Pick<AdvancedSearchFiltersProps, 'activeFilterCount' | 'isExpanded' | 'setIsExpanded'>> = ({
  activeFilterCount,
  isExpanded,
  setIsExpanded,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsExpanded(!isExpanded)}
      className={`h-9 font-medium text-xs border-border transition-colors ${
        isExpanded 
          ? 'bg-muted text-foreground' 
          : 'bg-card hover:bg-muted text-foreground/80'
      }`}
    >
      <Filter className="w-4 h-4 mr-2" />
      Filters
      {activeFilterCount > 0 && (
        <Badge variant="default" className="ml-2 h-5 px-1.5 min-w-5 justify-center text-xs bg-primary text-primary-foreground">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );
};

export const AdvancedSearchPanel: React.FC<Omit<AdvancedSearchFiltersProps, 'isExpanded' | 'setIsExpanded'>> = ({
  filters,
  updateFilter,
  clearFilters,
  activeFilterCount,
  suggestions,
}) => {
  const [agentSearch, setAgentSearch] = useState('');
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(false);

  const toggleGrade = (grade: string) => {
    const newGrades = filters.grades.includes(grade)
      ? filters.grades.filter(g => g !== grade)
      : [...filters.grades, grade];
    updateFilter('grades', newGrades);
  };

  const toggleAgent = (agent: string) => {
    const newAgents = filters.suspectedAgents.includes(agent)
      ? filters.suspectedAgents.filter(a => a !== agent)
      : [...filters.suspectedAgents, agent];
    updateFilter('suspectedAgents', newAgents);
  };

  const getOutcomeStyle = (outcome: string, isSelected: boolean) => {
    if (!isSelected) return 'bg-card text-muted-foreground border border-border hover:border-primary/50';
    
    switch (outcome) {
      case 'all': return 'bg-primary text-primary-foreground border-transparent shadow-sm';
      case 'completed': return 'bg-status-grade1 text-status-grade1-foreground border-transparent shadow-sm';
      case 'abandoned': return 'bg-status-grade4 text-status-grade4-foreground border-transparent shadow-sm';
      default: return 'bg-primary text-primary-foreground border-transparent shadow-sm';
    }
  };

  // Flatten all drugs from all categories
  const allDrugs = Object.entries(DRUG_CATEGORIES).flatMap(([category, drugs]) => 
    drugs.map(drug => ({ drug, category }))
  );

  const filteredDrugs = allDrugs.filter(d => d.drug.toLowerCase().includes(agentSearch.toLowerCase()));

  // Active status checks
  const hasGrades = filters.grades.length > 0;
  const isOutcomeActive = filters.outcomeFilter !== 'all';
  const hasDates = !!filters.dateFrom || !!filters.dateTo;
  const hasHospital = !!filters.hospital;
  const hasAgents = filters.suspectedAgents.length > 0;

  const triggerClassName = (isActive: boolean) => `
    h-8 text-xs rounded-none border-dashed transition-[color,background-color,border-color,box-shadow]
    ${isActive 
      ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary" 
      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
    }
  `;

  return (
    <div className="w-full mt-3 animate-in fade-in duration-200 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Reaction Severity Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={triggerClassName(hasGrades)}>
              <Activity className="w-3.5 h-3.5 mr-2" />
              Severity
              {hasGrades && (
                <Badge variant="secondary" className="ml-2 px-1 text-xs rounded-none bg-primary/20 text-primary border-none leading-none pt-0.5 h-4">
                  {filters.grades.length}
                </Badge>
              )}
              {!hasGrades && <span className="ml-1 opacity-50">Any</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4 rounded-none border-border shadow-md" align="start">
            <Label className="section-label mb-3 block">
              Reaction Severity
            </Label>
            <div className="grid grid-cols-3 gap-2 w-full">
              {GRADE_OPTIONS.map(grade => {
                const isSelected = filters.grades.includes(grade.value);
                const isUngraded = grade.value === 'ungraded';
                return (
                  <button
                    key={grade.value}
                    onClick={() => toggleGrade(grade.value)}
                    aria-pressed={isSelected}
                    aria-label={grade.label}
                    className={`
                      ${isUngraded ? 'col-span-2' : 'col-span-1'}
                      min-h-[44px] rounded-none border text-xs font-bold transition-[color,background-color,border-color,box-shadow] flex items-center justify-center gap-1
                      ${isSelected
                        ? `${grade.color} ring-1 ring-inset ring-current shadow-sm`
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {grade.label.replace('Grade ', '')}
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 2. Procedure Outcome Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={triggerClassName(isOutcomeActive)}>
              Outcome: <span className={`ml-1 ${!isOutcomeActive ? 'opacity-50' : 'capitalize'}`}>{filters.outcomeFilter}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4 rounded-none border-border shadow-md" align="start">
            <Label className="section-label mb-3 block">
              Procedure Outcome
            </Label>
            <div className="flex bg-muted dark:bg-card p-1 border border-border h-11 xl:h-9" role="group" aria-label="Procedure outcome">
              {(['all', 'completed', 'abandoned'] as const).map(outcome => (
                <button
                  key={outcome}
                  onClick={() => updateFilter('outcomeFilter', outcome)}
                  aria-pressed={filters.outcomeFilter === outcome}
                  className={`
                    flex-1 px-3 text-xs font-bold transition-[color,background-color,border-color,box-shadow] capitalize whitespace-nowrap flex items-center justify-center
                    ${getOutcomeStyle(outcome, filters.outcomeFilter === outcome)}
                  `}
                >
                  {outcome}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Date Range Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={triggerClassName(hasDates)}>
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Date
              {(filters.dateFrom || filters.dateTo) && (
                <span className="ml-1 opacity-70">
                  : {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Start'} 
                  {' - '} 
                  {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'End'}
                </span>
              )}
              {!hasDates && <span className="ml-1 opacity-50">All Time</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 rounded-none border-border shadow-md" align="start">
            <Label className="section-label mb-3 flex items-center gap-1.5">
              Date Range
            </Label>
            <div className="flex items-center gap-2 h-9">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="h-full flex-1 text-xs px-2 rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 bg-card"
              />
              <span className="text-xs text-muted-foreground font-black uppercase shrink-0 px-0.5">To</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="h-full flex-1 text-xs px-2 rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 bg-card"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Hospital Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={triggerClassName(hasHospital)}>
              <Building2 className="w-3.5 h-3.5 mr-2" />
              Hospital
              <span className={`ml-1 truncate max-w-[120px] ${!hasHospital ? 'opacity-50' : 'capitalize'}`}>
                {filters.hospital || 'All Locations'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4 rounded-none border-border shadow-md" align="start">
            <Label className="section-label mb-3 block">
              Hospital Location
            </Label>
            <div className="relative h-9">
              <select
                value={filters.hospital}
                onChange={(e) => updateFilter('hospital', e.target.value)}
                className="w-full h-full px-3 text-xs appearance-none rounded-none border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer pr-10"
              >
                <option value="">All Hospitals</option>
                {suggestions.hospitals.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <Building2 className="w-3 h-3" />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 5. Suspected Agents Toggle (Expanded Below) */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAgentsExpanded((prev) => !prev)}
          className={triggerClassName(hasAgents || isAgentsExpanded)}
        >
          <SearchIcon className="w-3.5 h-3.5 mr-2" />
          Agents
          {hasAgents && (
            <Badge variant="secondary" className="ml-2 px-1 text-xs rounded-none bg-primary/20 text-primary border-none leading-none pt-0.5 h-4">
              {filters.suspectedAgents.length}
            </Badge>
          )}
          {!hasAgents && <span className="ml-1 opacity-50">0 Selected</span>}
        </Button>

        {/* Clear All action (only visible when filters are active) */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="min-h-[44px] xl:h-8 px-2.5 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto transition-colors rounded-none"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Agents Panel */}
      {isAgentsExpanded && (
        <div className="w-full border border-border bg-background shadow-sm flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 rounded-none">
          <div className="px-4 py-3 border-b border-border bg-muted/40 dark:bg-card/50 flex flex-wrap items-center gap-4 justify-between">
            <div className="relative w-full max-w-[320px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search specific drugs or agents..."
                aria-label="Search specific drugs or agents"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="pl-9 pr-11 xl:pr-9 h-11 xl:h-8 text-xs rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary bg-background w-full shadow-sm"
              />
              {agentSearch && (
                <button
                  type="button"
                  onClick={() => setAgentSearch('')}
                  aria-label="Clear agent search"
                  className="absolute right-1 xl:right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center justify-center min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0 rounded-none hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="section-label flex items-center gap-2">
               {hasAgents && <span className="text-primary">{filters.suspectedAgents.length} Selected</span>}
               {!hasAgents && <span>0 Selected</span>}
            </div>
          </div>
          
          <div className="p-4 min-h-[100px] max-h-[40vh] sm:max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap gap-2">
              {filteredDrugs.length > 0 ? (
                filteredDrugs.map(({ drug, category }) => {
                  const isSelected = filters.suspectedAgents.includes(drug);
                  const theme = CATEGORY_THEMES[category];
                  
                  return (
                    <button
                      key={drug}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleAgent(drug);
                      }}
                      aria-pressed={isSelected}
                      className={`
                        px-3 py-1.5 min-h-[44px] xl:min-h-0 text-xs font-bold transition-[color,background-color,border-color,box-shadow] relative overflow-hidden group rounded-none
                        ${isSelected
                          ? `${theme.btnSelected} ring-1 ring-inset ring-black/5 dark:ring-white/5 shadow-sm scale-[1.02]`
                          : `bg-card text-muted-foreground border border-border hover:border-primary/50 hover:bg-card`
                        }
                      `}
                      title={category}
                    >
                      <span className="relative z-10">{drug}</span>
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white/30 -mr-0.5 -mt-0.5 rotate-45" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground py-8 text-center w-full font-medium italic">
                  No agents found matching "{agentSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
