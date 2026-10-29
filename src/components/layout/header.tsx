'use client';

import { Suspense } from 'react';
import { useLinkStatus } from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib';
import { parseReturnTo } from '@/lib/navigation/return-to';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';

const headerStyles = {
  container: 'px-4 py-2',
  inner: 'flex min-h-11 items-center gap-1',
  title: 'min-w-0 flex-1 truncate text-base font-semibold text-foreground',
  titleSkeleton: 'block h-5 w-36 max-w-[70%] rounded-md bg-muted',
  iconButton:
    'flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
  icon: 'h-5 w-5',
} as const;

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  className?: string;
  ready?: boolean;
}

export function Header({
  title,
  showBack = false,
  backHref,
  className,
  ready = true,
}: Readonly<HeaderProps>) {
  const pathname = usePathname();
  const t = useTranslations('Header');

  const pathSegments = pathname.split('/').filter(Boolean);
  const isSettingsPage = pathSegments[pathSegments.length - 1] === 'settings';
  const heading = title?.trim() ? title : t('appName');

  return (
    <header
      className={cn(STICKY_HEADER_BASE, headerStyles.container, className)}
      aria-busy={ready ? undefined : true}
    >
      <div className={headerStyles.inner}>
        <HeaderBack
          showBack={showBack}
          label={t('aria.back')}
          {...(backHref !== undefined ? { backHref } : {})}
        />

        {ready ? (
          <h1 className={headerStyles.title}>{heading}</h1>
        ) : (
          <span className="min-w-0 flex-1">
            <span className={headerStyles.titleSkeleton} aria-hidden />
          </span>
        )}

        {!isSettingsPage ? (
          <Link
            href="/settings"
            prefetch
            aria-label={t('aria.settings')}
            className={headerStyles.iconButton}
          >
            <SettingsLinkIcon className={headerStyles.icon} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function HeaderBack({
  showBack,
  backHref,
  label,
}: Readonly<{ showBack: boolean; backHref?: string | undefined; label: string }>) {
  if (backHref) {
    return <BackLink href={backHref} label={label} />;
  }
  if (showBack) {
    return <HistoryBackButton label={label} />;
  }
  return (
    <Suspense fallback={<BackSlot />}>
      <ReturnToBack label={label} />
    </Suspense>
  );
}

function ReturnToBack({ label }: Readonly<{ label: string }>) {
  const searchParams = useSearchParams();
  const href = parseReturnTo(searchParams);
  if (!href) return <BackSlot />;
  return <BackLink href={href} label={label} />;
}

function BackLink({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <Link href={href} prefetch aria-label={label} className={headerStyles.iconButton}>
      <BackLinkIcon className={headerStyles.icon} />
    </Link>
  );
}

function HistoryBackButton({ label }: Readonly<{ label: string }>) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      className={headerStyles.iconButton}
      onClick={() => router.back()}
    >
      <ArrowLeft className={headerStyles.icon} />
    </button>
  );
}

function BackSlot() {
  return <span className="min-h-11 min-w-11 shrink-0" aria-hidden />;
}

function BackLinkIcon({ className }: Readonly<{ className: string }>) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex" aria-busy={pending || undefined}>
      <ArrowLeft className={className} aria-hidden />
    </span>
  );
}

function SettingsLinkIcon({ className }: Readonly<{ className: string }>) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex" aria-busy={pending || undefined}>
      <Settings className={className} aria-hidden />
    </span>
  );
}
