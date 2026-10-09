import { useState, useEffect } from 'react';
import { Patient } from '../types';
import { APP_CONFIG } from '@shared/utils/constants';
import {
  ACTIVE_REPORT_TTL_MS,
  PATIENT_DB_KEY,
  getIfFresh,
  getSavedAt,
  removeStored,
  setWithTTL,
} from '@shared/utils/ttlStorage';
import { safeParsePatientDb } from '../utils/patientDbSchema';

export function usePatientState() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [databaseDate, setDatabaseDate] = useState<string>(APP_CONFIG.DATABASE_DEFAULT_DATE);
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const [patientDbSavedAt, setPatientDbSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const storedPatientDb = getIfFresh<unknown>(PATIENT_DB_KEY, ACTIVE_REPORT_TTL_MS);
    const parsedPatientDb = storedPatientDb ? safeParsePatientDb(storedPatientDb) : null;
    const savedAt = getSavedAt(PATIENT_DB_KEY, ACTIVE_REPORT_TTL_MS);

    if (parsedPatientDb && savedAt !== null) {
      setPatients(parsedPatientDb.patients);
      setDatabaseDate(parsedPatientDb.databaseDate);
      setHasUploadedData(parsedPatientDb.hasUploadedData);
      setPatientDbSavedAt(savedAt);
      setIsLoadingPatients(false);
      return;
    }

    if (storedPatientDb !== null) removeStored(PATIENT_DB_KEY);

    let cancelled = false;
    import('@shared/data/mockPatients')
      .then(({ MOCK_PATIENTS }) => {
        if (cancelled) return;
        setPatients(prev => prev.length === 0 ? MOCK_PATIENTS : prev);
        setIsLoadingPatients(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('Unable to load mock patients:', error);
        setIsLoadingPatients(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    
    if (patient.id === 'manual') {
      setIsPatientDialogOpen(true);
    }
  };

  const handleManualDetailChange = (field: keyof Patient | 'dob', value: string) => {
    if (!selectedPatient) return;

    setSelectedPatient(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleUploadPatients = (newPatients: Patient[], fileLastModified?: number): boolean => {
    const date = fileLastModified ? new Date(fileLastModified) : new Date();
    const nextDatabaseDate = date.toLocaleDateString('en-AU');
    const patientDb = {
      patients: newPatients,
      databaseDate: nextDatabaseDate,
      hasUploadedData: true,
    };

    // In-memory data always updates; "saved" claims require a confirmed write.
    setPatients(newPatients);

    const writeOk = setWithTTL(PATIENT_DB_KEY, patientDb);
    if (!writeOk) {
      console.warn('Unable to persist the imported patient database locally.');
      return false;
    }
    setDatabaseDate(nextDatabaseDate);
    setHasUploadedData(true);
    setPatientDbSavedAt(getSavedAt(PATIENT_DB_KEY, ACTIVE_REPORT_TTL_MS));
    return true;
  };

  const toggleSuspectedAgent = (patientId: string, drugName: string) => {
    const patientIndex = patients.findIndex(patient => patient.id === patientId);
    if (patientIndex === -1) return;

    const patient = patients[patientIndex];
    const suspectedAgents = patient.history.suspectedAgents.includes(drugName)
      ? patient.history.suspectedAgents.filter(agent => agent !== drugName)
      : [...patient.history.suspectedAgents, drugName];
    const updatedPatient = {
      ...patient,
      history: { ...patient.history, suspectedAgents },
    };
    const updatedPatients = patients.map((currentPatient, index) =>
      index === patientIndex ? updatedPatient : currentPatient
    );

    setPatients(updatedPatients);
    setSelectedPatient(currentPatient =>
      currentPatient?.id === patientId ? updatedPatient : currentPatient
    );

    if (hasUploadedData) {
      const writeOk = setWithTTL(PATIENT_DB_KEY, {
        patients: updatedPatients,
        databaseDate,
        hasUploadedData,
      });
      if (!writeOk) {
        console.warn('Unable to persist the suspected-agent change locally.');
        return;
      }
      setPatientDbSavedAt(getSavedAt(PATIENT_DB_KEY, ACTIVE_REPORT_TTL_MS));
    }
  };

  return {
    selectedPatient,
    setSelectedPatient,
    isPatientDialogOpen,
    setIsPatientDialogOpen,
    patients,
    databaseDate,
    hasUploadedData,
    patientDbSavedAt,
    isLoadingPatients,
    handlePatientSelect,
    handleManualDetailChange,
    handleUploadPatients,
    toggleSuspectedAgent,
  };
}
