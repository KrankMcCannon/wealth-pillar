/**
 * Service Factory
 * Implementa il Factory Pattern per la creazione dei servizi
 * Segue il principio di Dependency Injection e Inversion of Control
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { ClerkSupabaseService } from './clerk-supabase.service';
import { FinanceService } from './finance.service';

/**
 * Service Factory per la creazione centralizzata dei servizi
 */
export class ServiceFactory {
  private static instances = new Map<string, any>();
  private static clientKeys = new WeakMap<SupabaseClient<Database>, string>();
  private static keyCounter = 0;

  /**
   * Ottiene una chiave univoca per il client
   */
  private static getClientKey(client: SupabaseClient<Database>): string {
    if (!this.clientKeys.has(client)) {
      this.clientKeys.set(client, `client_${++this.keyCounter}`);
    }
    return this.clientKeys.get(client)!;
  }

  /**
   * Crea o restituisce un'istanza singleton di FinanceService
   */
  static createFinanceService(client: SupabaseClient<Database>): FinanceService {
    const key = `finance_${this.getClientKey(client)}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new FinanceService(client));
    }
    
    return this.instances.get(key);
  }

  /**
   * Crea o restituisce un'istanza singleton di ClerkSupabaseService
   */
  static createClerkSupabaseService(client: SupabaseClient<Database>): ClerkSupabaseService {
    const key = `clerk_${this.getClientKey(client)}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new ClerkSupabaseService(client));
    }
    
    return this.instances.get(key);
  }

  /**
   * Pulisce la cache delle istanze (utile per test o reset)
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Rimuove un'istanza specifica dalla cache
   */
  static removeInstance(type: 'finance' | 'clerk', client: SupabaseClient<Database>): void {
    const key = `${type}_${this.getClientKey(client)}`;
    this.instances.delete(key);
  }
}