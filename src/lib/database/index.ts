/**
 * Database Layer - Centralized exports
 *
 * NOTE: supabase-server is exported via app/api routes only
 * Client code should only import from supabase-client
 */

export * from "./supabase-client";
// supabase-server is server-only and should NOT be exported here
export * from "./types";
