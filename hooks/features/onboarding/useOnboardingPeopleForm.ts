import { useCallback, useMemo, useState } from "react";
import type { OnboardingPerson } from "../../../types";

/**
 * Hook per gestire il form delle persone nell'onboarding
 * Principio SRP: Si occupa solo della gestione delle persone
 * Principio OCP: Facilmente estendibile per nuove validazioni
 */
export const useOnboardingPeopleForm = (initialPeople: OnboardingPerson[] = []) => {
  // Inizializza con almeno una persona vuota
  const [people, setPeople] = useState<OnboardingPerson[]>(
    initialPeople.length > 0
      ? initialPeople
      : [
          {
            name: "",
            avatar: "",
            themeColor: "#3b82f6",
            budgetStartDate: "1",
          },
        ]
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Palette di colori predefinita
  const availableColors = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280", // Gray
  ];

  /**
   * Aggiunge una nuova persona con valori di default
   */
  const addPerson = useCallback(() => {
    setPeople((prev) => {
      const newColorIndex = prev.length % availableColors.length;
      return [
        ...prev,
        {
          name: "",
          avatar: "",
          themeColor: availableColors[newColorIndex],
          budgetStartDate: "1",
        },
      ];
    });
  }, [availableColors]);

  /**
   * Rimuove una persona per indice (deve rimanere almeno una)
   */
  const removePerson = useCallback(
    (index: number) => {
      if (people.length <= 1) return; // Mantieni almeno una persona

      setPeople((prev) => prev.filter((_, i) => i !== index));

      // Rimuovi errori associati a questa persona
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`person_${index}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    },
    [people.length]
  );

  /**
   * Aggiorna un campo di una persona specifica
   */
  const handlePersonChange = useCallback((index: number, field: keyof OnboardingPerson, value: string) => {
    setPeople((prev) => prev.map((person, i) => (i === index ? { ...person, [field]: value } : person)));

    // Pulisci errori per questo campo
    const errorKey = `person_${index}_${field}`;
    setValidationErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  /**
   * Gestisce la selezione dell'avatar per una persona specifica
   */
  const handleAvatarSelect = useCallback((index: number, avatarId: string) => {
    setPeople((prev) => prev.map((person, i) => (i === index ? { ...person, avatar: avatarId } : person)));

    // Pulisci errori per questo campo
    const errorKey = `person_${index}_avatar`;
    setValidationErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  /**
   * Valida tutti i dati delle persone
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const names = new Set<string>();

    people.forEach((person, index) => {
      const trimmedName = person.name?.trim();

      // Validazione nome
      if (!trimmedName) {
        errors[`person_${index}_name`] = "Il nome è obbligatorio";
      } else if (trimmedName.length < 2) {
        errors[`person_${index}_name`] = "Il nome deve essere di almeno 2 caratteri";
      } else if (trimmedName.length > 30) {
        errors[`person_${index}_name`] = "Il nome non può superare i 30 caratteri";
      } else if (names.has(trimmedName.toLowerCase())) {
        errors[`person_${index}_name`] = "Questo nome è già stato utilizzato";
      } else {
        names.add(trimmedName.toLowerCase());
      }

      // Validazione giorno di inizio budget
      const startDay = parseInt(person.budgetStartDate);
      if (isNaN(startDay) || startDay < 1 || startDay > 31) {
        errors[`person_${index}_budgetStartDate`] = "Giorno di inizio budget non valido (1-31)";
      }

      // Validazione colore tema
      if (!person.themeColor || !person.themeColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        errors[`person_${index}_themeColor`] = "Colore tema non valido";
      }

      // Validazione avatar
      if (!person.avatar) {
        errors[`person_${index}_avatar`] = "Seleziona un avatar";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [people]);

  /**
   * Controlla se il form può essere sottomesso
   */
  const canSubmit = useMemo(() => {
    return people.some((person) => person.name.trim().length > 0 && person.avatar);
  }, [people]);

  /**
   * Persone valide (con nome compilato e avatar selezionato) pronte per l'invio
   */
  const validPeople = useMemo(() => {
    return people
      .filter((person) => person.name.trim().length > 0 && person.avatar)
      .map((person) => ({
        ...person,
        name: person.name.trim(),
        avatar: person.avatar, // Usa direttamente l'ID dell'avatar predefinito
      }));
  }, [people]);

  /**
   * Opzioni per il selettore di giorno di inizio budget
   */
  const budgetStartDayOptions = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `${i + 1}° giorno del mese`,
    }));
  }, []);

  return {
    people,
    setPeople,
    validationErrors,
    availableColors,
    budgetStartDayOptions,
    addPerson,
    removePerson,
    handlePersonChange,
    handleAvatarSelect,
    validateForm,
    canSubmit,
    validPeople,
  };
};
