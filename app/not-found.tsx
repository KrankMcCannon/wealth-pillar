"use client";

import { Home } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center px-4 relative">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-primary" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-secondary" />

      <div className="w-full max-w-md rounded-2xl bg-card p-6 sm:p-8 shadow-xl border border-primary/20 space-y-6 text-center">
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

        <Link href="/dashboard" className="w-full">
          <Button className="w-full gap-2">
            <Home className="h-4 w-4" />
            Vai alla Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
