import { redirect } from 'next/navigation';

export default async function LocaleRootPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  redirect(`/${locale}/home`);
}
