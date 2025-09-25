import { NextResponse } from 'next/server';
import { supabaseServer, ServerDatabaseError, validateUserContext } from '@/lib/supabase-server';

export async function GET() {
  try {
    await validateUserContext();
    const response = await supabaseServer
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (response.error) throw new ServerDatabaseError('Failed to fetch categories', 'DB_ERROR');
    return NextResponse.json({ data: response.data ?? [] });
  } catch (error) {
    if (error instanceof ServerDatabaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

