"use client";

import { Loader2, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AuthCard, getRequirementsStatus, PasswordInput, PasswordRequirements, PasswordStrength, usePasswordResetState, authStyles } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';
import { useEffect, useState } from 'react';

export default function Page() {
  const router = useRouter();
  const { state, actions } = usePasswordResetState();
  const [canGoBack, setCanGoBack] = useState(false);

  // Check if browser history is available
  useEffect(() => {
    setCanGoBack(globalThis.window !== undefined && globalThis.history.length > 1);
  }, []);

  const handleBackNavigation = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push('/sign-in');
    }
  };

  const getBackButton = () => {
    if (state.step === 'request') {
      return (
        <button
          type="button"
          className={authStyles.recovery.backButton}
          title="Torna indietro"
          onClick={handleBackNavigation}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      );
    }

    if (state.step === 'verify') {
      return (
        <button
          type="button"
          className={authStyles.recovery.backButton}
          title="Torna indietro"
          onClick={() => actions.setStep('request')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      );
    }

    if (state.step === 'reset') {
      return (
        <button
          type="button"
          className={authStyles.recovery.backButton}
          title="Torna indietro"
          onClick={() => actions.setStep('verify')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      );
    }

    return null;
  };

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <AuthCard
        title="Recupera la password"
        subtitle="Ricevi un codice via email e imposta una nuova password"
        backButton={getBackButton()}
      >
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

            <div className={authStyles.recovery.verifyActions}>
              <button
                type="button"
                disabled={state.resendCooldown > 0 || state.resendLoading}
                className={`${authStyles.recovery.resendLink} transition-all duration-300 ${state.resendCooldown > 0 || state.resendLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'}`}
                onClick={actions.resendCode}
              >
                {state.resendLoading && (
                  <>
                    <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                    Invio in corso...
                  </>
                )}
                {!state.resendLoading && state.resendCooldown > 0 && `Riprova tra ${state.resendCooldown}s`}
                {!state.resendLoading && state.resendCooldown === 0 && 'Reinvia codice'}
              </button>
              <Button
                type="submit"
                disabled={state.loading}
                className={authStyles.button.primary}
              >
                {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Verifica...</>) : 'Verifica codice'}
              </Button>
            </div>
          </motion.form>
        )}

        {state.step === 'reset' && (
          <motion.form key="reset" onSubmit={actions.submitNewPassword} className={authStyles.form.container} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="password" className={authStyles.label.base}>Nuova password</Label>
              <PasswordInput id="password" placeholder="••••••••" value={state.password} onChange={(e) => actions.setPassword(e.target.value)} required icon={<Lock className="h-3.5 w-3.5" />} />
              <PasswordStrength password={state.password} />
              <PasswordRequirements password={state.password} />
            </div>

            <Button
              type="submit"
              disabled={state.loading || !getRequirementsStatus(state.password).meetsAll}
              className={authStyles.button.primary}
            >
              {state.loading ? (<><Loader2 className={authStyles.button.icon} /> Salvataggio...</>) : 'Salva nuova password'}
            </Button>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </>
  );
}
