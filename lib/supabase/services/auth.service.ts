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
}
