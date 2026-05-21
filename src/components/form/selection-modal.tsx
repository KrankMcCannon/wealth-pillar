'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { cn } from '@/lib/utils';
import { settingsStyles } from '@/features/settings/theme';

export interface SelectionOption<V extends string> {
  value: V;
  label: string;
  description: string;
  icon?: ReactNode;
}

export interface SelectionModalProps<V extends string> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  value: V;
  options: SelectionOption<V>[];
  onSave: (value: V) => Promise<void>;
  isSaving: boolean;
  radioGroupLabel?: string;
}

export function SelectionModal<V extends string>({
  isOpen,
  onClose,
  title,
  description,
  value,
  options,
  onSave,
  isSaving,
  radioGroupLabel,
}: Readonly<SelectionModalProps<V>>) {
  const t = useTranslations('SettingsModals.PreferenceSelect');
  const radioGroupName = useId().replace(/:/g, '');
  const [selectedValue, setSelectedValue] = useState<V>(value);

  useEffect(() => {
    if (isOpen) {
      setSelectedValue(value);
    }
  }, [isOpen, value]);

  const handleSave = async () => {
    if (selectedValue === value) {
      onClose();
      return;
    }
    await onSave(selectedValue);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      disableOutsideClose={isSaving}
    >
      <ModalBody>
        <div
          role="radiogroup"
          aria-label={radioGroupLabel ?? title}
          className={settingsStyles.modals.preference.list}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isCurrent = value === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  settingsStyles.modals.preference.itemBase,
                  'block min-w-0 cursor-pointer',
                  isSelected
                    ? settingsStyles.modals.preference.itemActive
                    : settingsStyles.modals.preference.itemIdle,
                  isSaving && 'pointer-events-none cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="radio"
                  name={`selection-${radioGroupName}`}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setSelectedValue(option.value)}
                  disabled={isSaving}
                  className="peer sr-only"
                />
                <span className="flex w-full min-w-0 items-start gap-3 rounded-[inherit] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                  <div
                    className={cn(
                      settingsStyles.modals.preference.radioBase,
                      isSelected
                        ? settingsStyles.modals.preference.radioActive
                        : settingsStyles.modals.preference.radioIdle
                    )}
                    aria-hidden
                  >
                    {isSelected && <Check className={settingsStyles.modals.preference.radioIcon} />}
                  </div>

                  {option.icon ? (
                    <div
                      className="mr-3 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border"
                      aria-hidden
                    >
                      {option.icon}
                    </div>
                  ) : null}

                  <div className={settingsStyles.modals.preference.content}>
                    <div className={settingsStyles.modals.preference.titleRow}>
                      <span
                        className={cn(
                          settingsStyles.modals.preference.title,
                          isSelected
                            ? settingsStyles.modals.preference.titleActive
                            : settingsStyles.modals.preference.titleIdle
                        )}
                      >
                        {option.label}
                      </span>
                      {isCurrent ? (
                        <span className={settingsStyles.modals.preference.currentBadge}>
                          {t('currentBadge')}
                        </span>
                      ) : null}
                    </div>
                    <p className={settingsStyles.modals.preference.description}>
                      {option.description}
                    </p>
                  </div>
                </span>
              </label>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
          className={settingsStyles.modals.actionsButton}
        >
          {t('cancelButton')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedValue === value}
          className={settingsStyles.modals.actionsButton}
        >
          {isSaving ? (
            <>
              <Loader2 className={settingsStyles.modals.loadingIcon} />
              {t('savingButton')}
            </>
          ) : (
            t('saveButton')
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
