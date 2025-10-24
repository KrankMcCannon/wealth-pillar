import { APIError, ErrorCode, supabaseServer, validateUserContext, withErrorHandler } from '@/lib';
import { NextResponse } from 'next/server';

async function getCategories() {
    await validateUserContext();
    const response = await supabaseServer
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero delle categorie.',
        response.error
      );
    }

    return NextResponse.json({ data: response.data ?? [] });
}

export const GET = withErrorHandler(getCategories);

