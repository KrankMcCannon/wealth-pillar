'use client';

import { useId, useState, type ReactNode } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { cn } from '@/lib/utils';
import { formModalStyles as modalS } from './form-modal-styles';

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

interface SelectionModalContentProps<V extends string> {
  onClose: () => void;
  title: string;
  value: V;
  options: SelectionOption<V>[];
  onSave: (value: V) => Promise<void>;
  isSaving: boolean;
  radioGroupLabel?: string;
}

function SelectionModalContent<V extends string>({
  onClose,
  title,
  value,
  options,
  onSave,
  isSaving,
  radioGroupLabel,
}: Readonly<SelectionModalContentProps<V>>) {
  const t = useTranslations('SettingsModals.PreferenceSelect');
  const radioGroupName = useId().replace(/:/g, '');
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSave = async () => {
    if (selectedValue === value) {
      onClose();
      return;
    }
    await onSave(selectedValue);
  };

  return (
    <>
      <ModalBody>
        <div
          role="radiogroup"
          aria-label={radioGroupLabel ?? title}
          className={modalS.preference.list}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isCurrent = value === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  modalS.preference.itemBase,
                  'block min-w-0 cursor-pointer',
                  isSelected ? modalS.preference.itemActive : modalS.preference.itemIdle,
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
                <span className="flex w-full min-w-0 items-start gap-3 rounded-[inherit] peer-focus-visible:ring-2 peer-focus-visible:ring-modal-ring/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-modal-surface">
                  <div
                    className={cn(
                      modalS.preference.radioBase,
                      isSelected ? modalS.preference.radioActive : modalS.preference.radioIdle
                    )}
                    aria-hidden
                  >
                    {isSelected && <Check className={modalS.preference.radioIcon} />}
                  </div>

                  {option.icon ? (
                    <div
                      className="mr-3 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-modal-border/35"
                      aria-hidden
                    >
                      {option.icon}
                    </div>
                  ) : null}

                  <div className={modalS.preference.content}>
                    <div className={modalS.preference.titleRow}>
                      <span
                        className={cn(
                          modalS.preference.title,
                          isSelected ? modalS.preference.titleActive : modalS.preference.titleIdle
                        )}
                      >
                        {option.label}
                      </span>
                      {isCurrent ? (
                        <span className={modalS.preference.currentBadge}>{t('currentBadge')}</span>
                      ) : null}
                    </div>
                    <p className={modalS.preference.description}>{option.description}</p>
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
          className="w-full sm:w-auto"
        >
          {t('cancelButton')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedValue === value}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('savingButton')}
            </>
          ) : (
            t('saveButton')
          )}
        </Button>
      </ModalFooter>
    </>
  );
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
  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      disableOutsideClose={isSaving}
    >
      {isOpen ? (
        <SelectionModalContent
          key={value}
          onClose={onClose}
          title={title}
          value={value}
          options={options}
          onSave={onSave}
          isSaving={isSaving}
          {...(radioGroupLabel !== undefined ? { radioGroupLabel } : {})}
        />
      ) : null}
    </ModalWrapper>
  );
}
