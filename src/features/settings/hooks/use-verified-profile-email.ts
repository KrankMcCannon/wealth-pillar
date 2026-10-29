'use client';

import { useState } from 'react';
import { useReverification, useUser } from '@clerk/nextjs';

type EmailAddress = NonNullable<ReturnType<typeof useUser>['user']>['emailAddresses'][number];

export function useVerifiedProfileEmail() {
  const { user } = useUser();
  const [pending, setPending] = useState<EmailAddress | null>(null);
  const createEmail = useReverification((email: string) => user!.createEmailAddress({ email }));
  const makePrimary = useReverification((id: string) =>
    user!.update({ primaryEmailAddressId: id })
  );

  async function verifyEmail(email: string, code: string): Promise<boolean> {
    if (!user) throw new Error('Not authenticated');
    let address = user.emailAddresses.find(
      (item) => item.emailAddress.toLowerCase() === email.toLowerCase()
    );
    if (!address && pending?.emailAddress.toLowerCase() === email.toLowerCase()) address = pending;
    if (address?.verification.status !== 'verified') {
      if (!pending || pending.emailAddress.toLowerCase() !== email.toLowerCase()) {
        address ??= await createEmail(email);
        if (!address) throw new Error('Email verification was cancelled');
        await address.prepareVerification({ strategy: 'email_code' });
        setPending(address);
        return false;
      }
      if (!code.trim()) return false;
      address = await pending.attemptVerification({ code: code.trim() });
      if (address.verification.status !== 'verified')
        throw new Error('Email verification incomplete');
    }
    if (user.primaryEmailAddressId !== address.id) {
      const updated = await makePrimary(address.id);
      if (!updated || updated.primaryEmailAddressId !== address.id)
        throw new Error('Email update was cancelled');
    }
    setPending(null);
    return true;
  }

  return {
    resendVerification: async () => {
      if (pending) await pending.prepareVerification({ strategy: 'email_code' });
    },
    pendingEmail: pending?.emailAddress ?? null,
    verifyEmail,
    resetVerification: () => setPending(null),
  };
}
