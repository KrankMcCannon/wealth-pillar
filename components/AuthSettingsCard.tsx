import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthSettingsCard: React.FC = () => {
  const { 
    user, 
    getUserProviders, 
    getAvailableProviders,
    linkOTPToAccount, 
    updateUserPassword 
  } = useAuth();
  
  const [providers, setProviders] = useState<string[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      if (user) {
        const [userProviders, available] = await Promise.all([
          getUserProviders(),
          getAvailableProviders()
        ]);
        setProviders(userProviders);
        setAvailableProviders(available);
      }
    };
    
    loadProviders();
  }, [user, getUserProviders, getAvailableProviders]);

  const handleAddOTP = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await linkOTPToAccount();
      if (error) {
        setError(error.message);
      } else {
        setMessage('Autenticazione OTP ora disponibile per il tuo account!');
        // Ricarica i provider
        const [userProviders, available] = await Promise.all([
          getUserProviders(),
          getAvailableProviders()
        ]);
        setProviders(userProviders);
        setAvailableProviders(available);
      }
    } catch (err) {
      setError('Errore durante l\'abilitazione dell\'OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updateUserPassword(newPassword);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Password aggiunta con successo!');
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
        // Ricarica i provider
        const [userProviders, available] = await Promise.all([
          getUserProviders(),
          getAvailableProviders()
        ]);
        setProviders(userProviders);
        setAvailableProviders(available);
      }
    } catch (err) {
      setError('Errore durante l\'aggiunta della password');
    } finally {
      setLoading(false);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'password': return 'Password';
      case 'google': return 'Google';
      case 'otp': return 'Codice OTP';
      default: return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'password':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'otp':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Metodi di Autenticazione
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Gestisci i metodi con cui puoi accedere al tuo account
      </p>

      {/* Metodi attivi */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Metodi attivi
        </h4>
        
        {providers.length > 0 ? (
          <div className="space-y-2">
            {providers.map((provider) => (
              <div
                key={provider}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-green-600 dark:text-green-400">
                    {getProviderIcon(provider)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getProviderDisplayName(provider)}
                  </span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Caricamento metodi di autenticazione...
          </p>
        )}
      </div>

      {/* Metodi disponibili da aggiungere */}
      {availableProviders.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Aggiungi metodi di autenticazione
          </h4>

          {/* Aggiungi Password (se non presente) */}
          {availableProviders.includes('password') && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-400">
                    {getProviderIcon('password')}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      Password
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aggiungi una password per il tuo account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  {showPasswordForm ? 'Annulla' : 'Aggiungi'}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleAddPassword} className="space-y-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div>
                    <input
                      type="password"
                      placeholder="Nuova password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Conferma password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Salvataggio...' : 'Salva password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Aggiungi OTP (se non presente) */}
          {availableProviders.includes('otp') && (
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="text-gray-400">
                  {getProviderIcon('otp')}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    Codice OTP
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Accedi tramite codice inviato via email
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddOTP}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
              >
                {loading ? 'Abilitazione...' : 'Abilita'}
              </button>
            </div>
          )}

          {/* Info OAuth Google - sempre mostrato come non disponibile per aggiunta diretta */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center space-x-3">
              <div className="text-gray-400">
                {getProviderIcon('google')}
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Google
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Per collegare Google, effettua il logout e accedi con Google
                </p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 rounded">
              Non disponibile
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
          <svg className="w-8 h-8 text-green-500 dark:text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tutti i metodi configurati</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Il tuo account ha già tutti i metodi di autenticazione disponibili</p>
        </div>
      )}

      {/* Messaggi */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {message && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        </div>
      )}
    </div>
  );
};
