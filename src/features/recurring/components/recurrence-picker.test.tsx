import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import { RecurrencePicker } from './recurrence-picker';
import type { RecurringFormData } from './recurring-form-schema';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

function Form() {
  const form = useForm<RecurringFormData>({
    defaultValues: { frequency: 'monthly', due_day: '31', start_date: '2026-05-31' },
  });
  const dueDay = useWatch({ control: form.control, name: 'due_day' });
  return (
    <>
      <RecurrencePicker form={form} t={((key: string) => key) as never} isSubmitting={false} />
      <output data-testid="day">{dueDay}</output>
    </>
  );
}

it('resets the day when the frequency semantics change and preserves it between weekly modes', async () => {
  const user = userEvent.setup();
  render(<Form />);
  await user.click(screen.getByRole('radio', { name: 'frequencyOptions.weekly' }));
  expect(screen.getByTestId('day')).toHaveTextContent('7');
  await user.click(screen.getByRole('radio', { name: 'frequencyOptions.biweekly' }));
  expect(screen.getByTestId('day')).toHaveTextContent('7');
  await user.click(screen.getByRole('radio', { name: 'frequencyOptions.monthly' }));
  expect(screen.getByTestId('day')).toHaveTextContent('31');
});
