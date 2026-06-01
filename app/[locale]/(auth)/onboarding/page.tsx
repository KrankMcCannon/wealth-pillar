import React from 'react';
import { redirect } from 'next/navigation';
import { getAuth, getCurrentUser } from '@/lib/auth/cached-auth';
import { isOnboardingComplete } from '@/lib/auth/clerk-session';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { getAllCategoriesUseCase } from '@/server/use-cases/categories/category.use-cases';

export default async function OnboardingPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { userId: clerkId } = await getAuth();

  if (!clerkId) {
    redirect(`/${locale}/sign-in`);
  }

  const currentUser = await getCurrentUser();
  if (isOnboardingComplete(currentUser)) {
    redirect(`/${locale}/home`);
  }

  const categories = await getAllCategoriesUseCase();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <OnboardingWizard categories={categories} />
    </div>
  );
}
