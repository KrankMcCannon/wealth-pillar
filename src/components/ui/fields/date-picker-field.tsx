'use client';

import type { ComponentProps } from 'react';
import { DateField } from './date-field';

/** Single entry point for date picking (mobile drawer + desktop popover via DateField). */
export function DatePickerField(props: ComponentProps<typeof DateField>) {
  return <DateField {...props} />;
}
