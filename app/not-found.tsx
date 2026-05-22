'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="h-full w-full flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md rounded-2xl border border-border/25 bg-card/90 p-6 sm:p-8 shadow-xl space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 shadow-lg">
          <Home className="h-10 w-10 text-primary" />
        </div>

        <div className="mx-auto inline-flex items-center rounded-full bg-primary/30 px-4 py-1.5 text-xs font-semibold text-primary">
          Pagina non trovata
        </div>

        <h2 className="text-2xl font-bold text-primary">Ops! Pagina non trovata</h2>

        <p className="text-sm text-primary/70 leading-relaxed">
          Il percorso che stai cercando non esiste oppure è stato spostato. Torna alla dashboard per
          continuare la navigazione.
        </p>

        <Button className="w-full gap-2" asChild>
          <Link href="/home">
            <Home className="h-4 w-4" />
            Vai alla Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
