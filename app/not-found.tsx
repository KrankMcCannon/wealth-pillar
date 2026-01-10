"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui";
import { PageContainer, Header } from "@/components/layout";
import { confirmationDialogStyles, notFoundStyles } from "@/components/shared/theme/feedback-styles";

export default function NotFound() {
  const router = useRouter();

  return (
    <PageContainer className={notFoundStyles.page}>
      <Header
        title="Errore 404"
        subtitle="Pagina non trovata"
        showBack={true}
        className={notFoundStyles.header.container}
      />

      <main className={notFoundStyles.content.container}>
        <div className={notFoundStyles.content.card}>
          <div className={notFoundStyles.content.illustration}>
            <Search className={notFoundStyles.content.illustrationIcon} />
          </div>
          <span className={notFoundStyles.content.badge}>Percorso non trovato</span>
          <h2 className={notFoundStyles.content.title}>Non riusciamo a trovare questa pagina</h2>
          <p className={notFoundStyles.content.description}>
            Il link potrebbe essere errato oppure la pagina è stata spostata. Torna indietro o rientra
            nella dashboard per continuare la navigazione.
          </p>

          <div className={notFoundStyles.content.actions}>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className={`${notFoundStyles.content.backButton} ${confirmationDialogStyles.buttons.cancel} ${notFoundStyles.content.backButtonVariant}`}
            >
              Torna indietro
            </Button>

            <Link href="/dashboard" className={notFoundStyles.content.actionLink}>
              <Button className={`${notFoundStyles.content.homeButton} ${confirmationDialogStyles.buttons.confirm}`}>
                <Home className={notFoundStyles.content.actionIcon} />
                Vai alla Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </PageContainer>
  );
}
