"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-primary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 leading-none animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-primary to-primary/70" />
          </div>

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center transform rotate-6 animate-bounce">
                <Search className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full border-4 border-white" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Pagina non trovata
          </h2>
          <p className="text-lg text-primary/70 mb-8 max-w-md mx-auto">
            Ops! La pagina che stai cercando non esiste o è stata spostata.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-6 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Torna indietro
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full px-6 py-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2 group">
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Vai alla Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
