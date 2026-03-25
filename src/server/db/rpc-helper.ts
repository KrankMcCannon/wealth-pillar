import { supabase } from '@/server/db/supabase';

type RpcClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Generic RPC (e.g. available_shares helpers) when a dedicated typed wrapper is not needed.
 */
export async function supabaseRpc<TResult>(
  fnName: string,
  args?: Record<string, unknown>
): Promise<TResult> {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client.rpc(fnName, args);
  if (error) throw new Error(error.message);
  return data as TResult;
}

/**
 * Typed RPC calls for PostgREST functions not fully reflected in generated types.
 */
export async function typedGroupRpc<TResult>(
  fnName:
    | 'get_group_category_spending'
    | 'get_group_monthly_spending'
    | 'get_group_user_category_spending',
  args: { p_group_id: string; p_start_date: string; p_end_date: string }
): Promise<TResult> {
  const client = supabase as unknown as {
    rpc: (
      fn: string,
      params: Record<string, string>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc(fnName, args);
  if (error) throw new Error(error.message);
  return data as TResult;
}
