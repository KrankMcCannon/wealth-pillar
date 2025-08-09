/**
 * Authentication Service
 * Implements secure authentication with Supabase
 */

import { getSupabaseClient } from '../client';
import { AuthError, IAuthService } from '../interfaces';

export class SupabaseAuthService implements IAuthService {
  private supabase = getSupabaseClient();

  async signIn(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new AuthError('Failed to sign in', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during sign in', 'UNKNOWN_ERROR', error);
    }
  }

  async signUp(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw new AuthError('Failed to sign up', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during sign up', 'UNKNOWN_ERROR', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new AuthError('Failed to sign out', error.message, error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during sign out', 'UNKNOWN_ERROR', error);
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error) {
        throw new AuthError('Failed to get current user', error.message, error);
      }

      return user;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error getting current user', 'UNKNOWN_ERROR', error);
    }
  }

  onAuthStateChange(callback: (user: any) => void): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  // Additional utility methods
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new AuthError('Failed to send reset password email', error.message, error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during password reset', 'UNKNOWN_ERROR', error);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new AuthError('Failed to update password', error.message, error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during password update', 'UNKNOWN_ERROR', error);
    }
  }

  async updateEmail(newEmail: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        throw new AuthError('Failed to update email', error.message, error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during email update', 'UNKNOWN_ERROR', error);
    }
  }

  // Passwordless OTP methods
  async signInWithOTP(email: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw new AuthError('Failed to send OTP', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during OTP sign in', 'UNKNOWN_ERROR', error);
    }
  }

  async verifyOTP(email: string, token: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        throw new AuthError('Failed to verify OTP', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during OTP verification', 'UNKNOWN_ERROR', error);
    }
  }

  // OAuth methods
  async signInWithGoogle(): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw new AuthError('Failed to sign in with Google', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during Google sign in', 'UNKNOWN_ERROR', error);
    }
  }

  // User management methods
  async linkOTPToAccount(): Promise<any> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new AuthError('User must be logged in to link OTP', 'USER_NOT_FOUND');
      }

      // OTP è già collegato di default per tutti gli utenti Supabase
      return { success: true, message: 'OTP is now available for your account' };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during OTP linking', 'UNKNOWN_ERROR', error);
    }
  }

  async updateUserPassword(password: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password
      });

      if (error) {
        throw new AuthError('Failed to set password', error.message, error);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Unexpected error during password update', 'UNKNOWN_ERROR', error);
    }
  }

  async getUserProviders(): Promise<string[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const providers: string[] = [];
      
      // Verifica i provider realmente usati dall'utente
      if (user.app_metadata?.providers) {
        user.app_metadata.providers.forEach((provider: string) => {
          if (provider === 'email') {
            // Se l'utente si è registrato con email/password
            if (user.user_metadata?.password_set !== false) {
              providers.push('password');
            }
            // Se l'utente si è registrato solo con OTP (senza password)
            if (user.user_metadata?.password_set === false || 
                user.email_confirmed_at && !user.user_metadata?.password_set) {
              providers.push('otp');
            }
          } else {
            // Provider OAuth (google, github, etc.)
            providers.push(provider);
          }
        });
      }
      
      // Caso speciale: se l'utente ha una password ma non è nei provider, aggiungila
      if (user.user_metadata?.password_set && !providers.includes('password')) {
        providers.push('password');
      }
      
      return [...new Set(providers)]; // Rimuovi duplicati
    } catch (error) {
      console.error('Error getting user providers:', error);
      return [];
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    try {
      const currentProviders = await this.getUserProviders();
      const allPossibleProviders = ['password', 'otp'];
      
      // Restituisci solo i provider che non sono già attivi
      return allPossibleProviders.filter(provider => !currentProviders.includes(provider));
    } catch (error) {
      console.error('Error getting available providers:', error);
      return [];
    }
  }
}
