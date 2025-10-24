/**
 * Database Layer - Centralized exports
 *
 * NOTE: supabase-server and auth-filters are server-only
 * They must be imported directly from their modules in API routes only
 * Client code should only import from supabase-client
 */

export * from "./supabase-client";
export * from "./types";
