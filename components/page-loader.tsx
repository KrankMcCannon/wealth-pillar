interface PageLoaderProps {
  message?: string;
  submessage?: string;
}

export function PageLoader({ message = 'Caricamento...', submessage = 'Attendere prego' }: PageLoaderProps) {
  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[hsl(var(--color-primary))]/10 mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-[hsl(var(--color-primary))] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900">{message}</p>
          <p className="text-xs text-slate-600 mt-1">{submessage}</p>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
