import { z } from 'zod';

export const notificationPageSchema = z
  .object({
    status: z.enum(['pending', 'history']).default('pending'),
    cursor: z
      .object({ receivedAt: z.iso.datetime({ offset: true }), id: z.uuid() })
      .strict()
      .optional(),
  })
  .strict();
export type NotificationPageInput = z.infer<typeof notificationPageSchema>;

export const manualNotificationSchema = z
  .object({
    description: z.string().trim().min(2).max(500),
    amount: z
      .number()
      .positive()
      .max(9_999_999_999.99)
      .refine((value) => Math.round(value * 100) / 100 === value),
    type: z.enum(['income', 'expense']),
    date: z.iso.date(),
  })
  .strict();
export type ManualNotification = z.infer<typeof manualNotificationSchema>;
