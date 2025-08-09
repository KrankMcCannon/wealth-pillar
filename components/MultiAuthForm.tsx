import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'password' | 'otp' | 'verify-otp';

interface MultiAuthFormProps {
  onToggleSignUpMode: () => void;
  isSignUp: boolean;
}

export const MultiAuthForm: React.FC<MultiAuthFormProps> = ({ onToggleSignUpMode, isSignUp }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const { 
    signUp, 
    signIn, 
    signInWithOTP, 
    verifyOTP, 
    signInWithGoogle 
  } = useAuth();

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validazione
    if (!email || !password) {
      setError('Email e password sono richiesti');
      setLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
          setLoading(false);
        } else {
          setMessage('Registrazione completata! Controlla la tua email per confermare l\'account.');
          setLoading(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          setLoading(false);
        }
        // Se il login è successful, non impostare loading=false qui
        // sarà gestito dall'AuthContext quando lo stato cambia
      }
    } catch (err) {
      setError('Si è verificato un errore imprevisto');
      setLoading(false);
    }
  };

  const handleOTPAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Email è richiesta');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signInWithOTP(email);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setMessage('Codice OTP inviato! Controlla la tua email.');
        setAuthMode('verify-otp');
        setLoading(false);
      }
    } catch (err) {
      setError('Si è verificato un errore durante l\'invio del codice OTP');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email || !otpToken) {
      setError('Email e codice OTP sono richiesti');
      setLoading(false);
      return;
    }

    try {
      const { error } = await verifyOTP(email, otpToken);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setMessage('Accesso eseguito con successo!');
        // Non impostare loading=false qui - sarà gestito dall'AuthContext
      }
    } catch (err) {
      setError('Si è verificato un errore durante la verifica del codice OTP');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // Se il login Google è successful, il reindirizzamento è gestito automaticamente da Supabase
      // Non impostare loading=false qui perché l'utente verrà reindirizzato
    } catch (err) {
      setError('Si è verificato un errore durante l\'accesso con Google');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtpToken('');
    setError(null);
    setMessage(null);
    setAuthMode('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isSignUp ? 'Crea il tuo account' : 'Accedi al tuo account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Gestisci le tue finanze personali' : 'Bentornato!'}
          </p>
        </div>

        {/* Tab per scegliere il metodo di autenticazione */}
        {authMode !== 'verify-otp' && (
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                authMode === 'password'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Password
            </button>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'otp'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Codice OTP
              </button>
            )}
          </div>
        )}

        {/* Form Password */}
        {authMode === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordAuth}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="La tua email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="La tua password"
                />
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Conferma Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Conferma la tua password"
                  />
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Registrazione...' : 'Accesso...'}
                  </span>
                ) : (
                  isSignUp ? 'Registrati' : 'Accedi'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Form OTP */}
        {authMode === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleOTPAuth}>
            <div>
              <label htmlFor="email-otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email-otp"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="La tua email"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Invio codice...
                  </span>
                ) : (
                  'Invia codice OTP'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Form Verifica OTP */}
        {authMode === 'verify-otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label htmlFor="otp-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Codice OTP
              </label>
              <input
                id="otp-token"
                name="otpToken"
                type="text"
                required
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Inserisci il codice ricevuto via email"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Codice inviato a: {email}
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifica...
                  </span>
                ) : (
                  'Verifica codice'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Indietro
              </button>
            </div>
          </form>
        )}

        {/* Separatore e OAuth */}
        {authMode !== 'verify-otp' && (
          <>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    oppure
                  </span>
                </div>
              </div>
            </div>

            {/* Google OAuth Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Caricamento...' : 'Continua con Google'}
              </button>
            </div>
          </>
        )}

        {/* Messaggi di errore e successo */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-700 dark:text-green-400">
              {message}
            </div>
          </div>
        )}

        {/* Toggle tra registrazione e accesso */}
        {authMode !== 'verify-otp' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                onToggleSignUpMode();
                resetForm();
              }}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              {isSignUp 
                ? 'Hai già un account? Accedi' 
                : 'Non hai un account? Registrati'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
