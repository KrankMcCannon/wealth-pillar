import React, { memo } from "react";
import { FormField, Input, ModalActions, AvatarSelector } from "../ui";
import { PlusIcon, TrashIcon } from "../common/Icons";
import type { OnboardingPerson } from "../../types";
import { useOnboardingPeopleForm } from "../../hooks/features/onboarding/useOnboardingPeopleForm";

interface OnboardingPeopleStepProps {
  onNext: (people: OnboardingPerson[]) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  groupName: string;
}

/**
 * Step 2: Aggiunta delle persone al gruppo
 */
export const OnboardingPeopleStep = memo<OnboardingPeopleStepProps>(
  ({ onNext, onBack, isLoading, error, groupName }) => {
    const {
      people,
      availableColors,
      validationErrors,
      addPerson,
      removePerson,
      handlePersonChange,
      handleAvatarSelect,
      validateForm,
      canSubmit,
      validPeople,
    } = useOnboardingPeopleForm();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;
      onNext(validPeople);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrizione */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aggiungi le persone a "{groupName}"
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Aggiungi almeno una persona per gestire le finanze del gruppo.
          </p>
        </div>

        {/* Lista delle persone */}
        <div className="space-y-4">
          {people.map((person, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Colore tema */}
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: person.themeColor }}
                  >
                    {person.name.charAt(0).toUpperCase() || "?"}
                  </div>
                </div>

                {/* Campi della persona */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Nome */}
                  <FormField
                    id={`person_${index}_name`}
                    label="Nome"
                    error={validationErrors[`person_${index}_name`]}
                    required
                  >
                    <Input
                      type="text"
                      value={person.name}
                      onChange={(e) => handlePersonChange(index, "name", e.target.value)}
                      placeholder="Nome persona"
                      error={!!validationErrors[`person_${index}_name`]}
                      disabled={isLoading}
                    />
                  </FormField>

                  {/* Avatar */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <AvatarSelector
                      people={people.map((p, i) => ({
                        id: `temp_${i}`,
                        name: p.name,
                        avatar: p.avatar,
                        themeColor: p.themeColor,
                        budgetStartDate: p.budgetStartDate,
                        groupId: "",
                        role: "member" as const,
                        createdAt: "",
                        updatedAt: "",
                      }))}
                      selectedAvatarId={person.avatar}
                      onAvatarSelect={(avatarId) => handleAvatarSelect(index, avatarId)}
                      currentPersonId={`temp_${index}`}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Colore tema */}
                  <FormField id={`person_${index}_themeColor`} label="Colore tema">
                    <select
                      value={person.themeColor}
                      onChange={(e) => handlePersonChange(index, "themeColor", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={isLoading}
                    >
                      {availableColors.map((color, colorIndex) => (
                        <option key={color} value={color}>
                          Colore {colorIndex + 1}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* Giorno inizio budget */}
                  <FormField id={`person_${index}_budgetStartDate`} label="Giorno inizio budget mensile">
                    <select
                      value={person.budgetStartDate}
                      onChange={(e) => handlePersonChange(index, "budgetStartDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={isLoading}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day.toString()}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Pulsante rimozione */}
                {people.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePerson(index)}
                    className="flex-shrink-0 p-3 sm:p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    disabled={isLoading}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pulsante aggiungi persona */}
        <button
          type="button"
          onClick={addPerson}
          className="w-full py-4 sm:py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 font-medium"
          disabled={isLoading}
        >
          <PlusIcon className="w-5 h-5" />
          Aggiungi un'altra persona
        </button>

        {/* Errore generale */}
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Azioni */}
        <ModalActions
          onCancel={onBack}
          onSubmit={handleSubmit}
          submitText="Continua con i conti"
          cancelText="Indietro"
          isSubmitting={isLoading}
          submitDisabled={!canSubmit}
        />
      </form>
    );
  }
);

OnboardingPeopleStep.displayName = "OnboardingPeopleStep";
