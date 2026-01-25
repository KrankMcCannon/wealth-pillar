import 'server-only';
import { supabase } from '@/server/db/supabase';

export const fetchUserGroupId = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  const user = data as { group_id: string | null };
  if (!user?.group_id) throw new Error('User or Group not found');
  return user.group_id;
};
