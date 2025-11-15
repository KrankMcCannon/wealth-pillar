"use client";

import { Loader2, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthCard, authStyles } from "@/features/auth";
import { Button, Input, Label } from "@/components/ui";

export default function Page() {
  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <AuthCard title="Verifica email" subtitle="Conferma l'indirizzo email per abilitare tutte le funzionalità">
        {false && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{false}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {false && (
            <motion.form
              key="req"
              onSubmit={() => {}}
              className={authStyles.form.container}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <p className={authStyles.label.base}>Invia un codice di verifica al tuo indirizzo email.</p>
              <Button type="submit" disabled={false} className={authStyles.button.primary}>
                {false ? (
                  <>
                    <Loader2 className={authStyles.button.icon} /> Invio codice...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Invia codice
                  </>
                )}
              </Button>
              <div className={authStyles.toggle.container}>
                Torna al{" "}
                <Link className={authStyles.toggle.link} href="/dashboard">
                  dashboard
                </Link>
              </div>
            </motion.form>
          )}

          {false && (
            <motion.form
              key="ver"
              onSubmit={() => {}}
              className={authStyles.form.container}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="code" className={authStyles.label.base}>
                  Codice di verifica
                </Label>
                <Input
                  id="code"
                  placeholder="123456"
                  value={""}
                  onChange={() => {}}
                  className={authStyles.input.field}
                />
              </div>
              <div className={authStyles.actions.container}>
                <div className={authStyles.actions.group}>
                  <button type="button" className={authStyles.toggle.link} onClick={() => {}}>
                    Reinvia codice
                  </button>
                  <Button type="submit" disabled={false} className={authStyles.button.primary}>
                    {false ? (
                      <>
                        <Loader2 className={authStyles.button.icon} /> Verifica...
                      </>
                    ) : (
                      "Verifica"
                    )}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthCard>
    </>
  );
}
