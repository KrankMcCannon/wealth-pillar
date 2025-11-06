"use client";

import { Loader2, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthCard, useEmailVerificationState, authStyles } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const { state, actions } = useEmailVerificationState();

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <AuthCard title="Verifica email" subtitle="Conferma l&apos;indirizzo email per abilitare tutte le funzionalità">
        {state.error && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{state.error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
        {state.step === 'request' && (
          <motion.form key="req" onSubmit={actions.requestCode} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <p className={authStyles.label.base}>Invia un codice di verifica al tuo indirizzo email.</p>
            <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
              {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Invio codice...</>) : (<><Mail className="mr-2 h-4 w-4" /> Invia codice</>)}
            </Button>
            <div className={authStyles.toggle.container}>
              Torna al{' '}
              <Link className={authStyles.toggle.link} href="/dashboard">dashboard</Link>
            </div>
          </motion.form>
        )}

        {state.step === 'verify' && (
          <motion.form key="ver" onSubmit={actions.verifyCode} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="code" className={authStyles.label.base}>Codice di verifica</Label>
              <Input id="code" placeholder="123456" value={state.code} onChange={(e) => actions.setCode(e.target.value)} className={authStyles.input.field} />
            </div>
            <div className={authStyles.actions.container}>
              <Button type="button" variant="outline" onClick={() => actions.setStep('request')}>Torna indietro</Button>
              <div className={authStyles.actions.group}>
                <button type="button" className={authStyles.toggle.link} onClick={actions.resend}>Reinvia codice</button>
                <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
                  {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Verifica...</>) : 'Verifica' }
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
