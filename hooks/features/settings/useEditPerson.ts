/**
 * Hook per gestire la logica di editing delle persone
 * Separazione della logica business dalla presentazione UI
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Person } from "../../../types";
import { useFinance } from "../../core/useFinance";
import { useModalForm } from "../../ui/useModalForm";
import { validatePersonForm } from "../../utils/validators";

interface EditPersonFormData {
  name: string;
  avatar: string;
  themeColor: string;
}

interface UseEditPersonProps {
  person: Person | null;
  onClose: () => void;
}

export const useEditPerson = ({ person, onClose }: UseEditPersonProps) => {
  const { updatePerson } = useFinance();
  const [colorValidation, setColorValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });

  // Initial form data from person
  const initialFormData: EditPersonFormData = useMemo(
    () => ({
      name: person?.name || "",
      avatar: person?.avatar || "",
      themeColor: person?.themeColor || "#3b82f6",
    }),
    [person]
  );

  const modalForm = useModalForm({
    initialData: initialFormData,
    resetOnClose: false,
    resetOnOpen: false,
  });

  const { data, errors, isSubmitting, updateField, setError, clearAllErrors, setSubmitting, resetForm } = modalForm;

  // Debounce per la validazione del colore
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (data.themeColor) {
        const isValid = /^#[0-9a-fA-F]{6}$/.test(data.themeColor);
        const hexValue = data.themeColor.replace("#", "");

        if (hexValue.length === 0) {
          setColorValidation({ isValid: true });
        } else if (hexValue.length < 6) {
          setColorValidation({ isValid: false, message: "Inserisci 6 caratteri esadecimali" });
        } else if (!isValid) {
          setColorValidation({ isValid: false, message: "Codice colore non valido. Usa solo caratteri da 0-9 e A-F" });
        } else {
          setColorValidation({ isValid: true });
        }
      } else {
        setColorValidation({ isValid: true });
      }
    }, 1000); // 1000ms di debounce

    return () => clearTimeout(timeoutId);
  }, [data.themeColor]);

  useEffect(() => {
    if (person) {
      resetForm();
    }
  }, [person, resetForm]);

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = validatePersonForm({ name: data.name });

    // Validazione aggiuntiva per il colore tema
    if (data.themeColor && !/^#[0-9a-fA-F]{6}$/.test(data.themeColor)) {
      errorsObj.themeColor = "Il colore tema deve essere un codice esadecimale valido (es. #3b82f6)";
    }

    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data.name, data.themeColor, clearAllErrors, setError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm() || !person) {
        return;
      }

      setSubmitting(true);

      try {
        await updatePerson({
          ...person,
          name: data.name.trim(),
          avatar: data.avatar.trim(),
          themeColor: data.themeColor,
        });
        onClose();
      } catch (error) {
        console.error("Failed to update person:", error);
        setError("general", "Errore nel salvataggio. Riprova.");
      } finally {
        setSubmitting(false);
      }
    },
    [data, person, updatePerson, onClose, validateForm, setSubmitting, setError]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("name", e.target.value);
    },
    [updateField]
  );

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("avatar", e.target.value);
    },
    [updateField]
  );

  const handleThemeColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("themeColor", e.target.value);
    },
    [updateField]
  );

  const handleHexColorChange = useCallback(
    (hexValue: string) => {
      // Rimuove caratteri non validi e limita a 6 caratteri
      const cleanHex = hexValue.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
      updateField("themeColor", `#${cleanHex}`);
    },
    [updateField]
  );

  const canSubmit = useMemo(() => {
    const nameValid = Object.keys(validatePersonForm({ name: data.name })).length === 0;
    const colorValid = colorValidation.isValid;
    return person !== null && nameValid && colorValid;
  }, [data.name, colorValidation.isValid, person]);

  return {
    // Form data
    data,
    errors,
    isSubmitting,

    // Actions
    handleSubmit,
    handleNameChange,
    handleAvatarChange,
    handleThemeColorChange,
    handleHexColorChange,

    // Validation
    canSubmit,
    colorValidation,
  };
};
