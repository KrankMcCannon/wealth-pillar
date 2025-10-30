"use client";

import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthCard, getRequirementsStatus, PasswordInput, PasswordRequirements, PasswordStrength, usePasswordResetState, authStyles } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const { state, actions } = usePasswordResetState();

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <AuthCard title="Recupera la password" subtitle="Ricevi un codice via email e imposta una nuova password">
        {state.error && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{state.error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
        {state.step === 'request' && (
          <motion.form key="req" onSubmit={actions.requestCode} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="email" className={authStyles.label.base}>Email</Label>
              <div className={authStyles.input.wrapper}>
                <Mail className={authStyles.input.icon} />
                <Input id="email" type="email" placeholder="name@example.com" value={state.email} onChange={(e) => actions.setEmail(e.target.value)} required className={`${authStyles.input.field} pl-9`} />
              </div>
            </div>

            <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
              {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Invio codice...</>) : 'Invia codice'}
            </Button>

            <div className={authStyles.toggle.container}>
              Hai già la password?{' '}
              <Link className={authStyles.toggle.link} href="/sign-in">Accedi</Link>
            </div>
          </motion.form>
        )}

        {state.step === 'verify' && (
          <motion.form key="ver" onSubmit={actions.verifyCode} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="code" className={authStyles.label.base}>Codice ricevuto via email</Label>
              <Input id="code" placeholder="123456" value={state.code} onChange={(e) => actions.setCode(e.target.value)} className={authStyles.input.field} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => actions.setStep('request')}>Torna indietro</Button>
              <div className="flex items-center gap-3">
                <button type="button" className={authStyles.toggle.link} onClick={actions.resendCode}>Reinvia codice</button>
                <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
                  {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Verifica...</>) : 'Verifica codice'}
                </Button>
              </div>
            </div>
          </motion.form>
        )}

        {state.step === 'reset' && (
          <motion.form key="reset" onSubmit={actions.submitNewPassword} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="password" className={authStyles.label.base}>Nuova password</Label>
              <div className={authStyles.input.wrapper}>
                <Lock className={authStyles.input.icon} />
                <PasswordInput id="password" placeholder="••••••••" value={state.password} onChange={(e) => actions.setPassword(e.target.value)} required className={`${authStyles.password.field} pl-9`} />
              </div>
              <PasswordStrength password={state.password} />
              <PasswordRequirements password={state.password} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => actions.setStep('verify')}>Torna indietro</Button>
              <Button type="submit" disabled={state.loading || !getRequirementsStatus(state.password).meetsAll} className={authStyles.button.primary}>
                {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Salvataggio...</>) : 'Salva nuova password'}
              </Button>
            </div>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </>
  );
}
