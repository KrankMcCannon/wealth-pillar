import { APIError, ErrorCode, withErrorHandler } from '@/src/lib/api';
import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a unique key from label
 * Converts to lowercase and replaces spaces with underscores
 */
function generateKeyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '_')
    .replaceAll(/[^a-z0-9_]/g, '');
}

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

async function createCategory(request: NextRequest) {
    await validateUserContext();
    const body = await request.json();

    const { label, icon, color } = body;

    // Validate required fields
    if (!label || !icon || !color) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'I campi obbligatori sono: label, icon, color'
      );
    }

    // Auto-generate key from label
    const key = generateKeyFromLabel(label);

    if (!key || key.length < 2) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'La chiave generata non è valida. Assicurati che l\'etichetta contenga almeno 2 caratteri.'
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (supabaseServer.from('categories') as any)
      .insert([{ label, key, icon, color }])
      .select();

    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante la creazione della categoria.',
        response.error
      );
    }

    return NextResponse.json({ data: response.data?.[0] }, { status: 201 });
}

async function updateCategory(request: NextRequest) {
    await validateUserContext();
    const body = await request.json();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts.at(-1);

    if (!id) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'ID della categoria non fornito'
      );
    }

    const { label, icon, color } = body;

    // Validate at least one field is provided
    if (!label && !icon && !color) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Almeno un campo (label, icon, color) deve essere fornito'
      );
    }

    // Build update payload - only include provided fields
    const updatePayload = {
      ...(label && { label }),
      ...(icon && { icon }),
      ...(color && { color }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (supabaseServer.from('categories') as any)
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante l\'aggiornamento della categoria.',
        response.error
      );
    }

    if (!response.data || response.data.length === 0) {
      throw new APIError(
        ErrorCode.CATEGORY_NOT_FOUND,
        'Categoria non trovata'
      );
    }

    return NextResponse.json({ data: response.data[0] });
}

async function deleteCategory(request: NextRequest) {
    await validateUserContext();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts.at(-1);

    if (!id) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'ID della categoria non fornito'
      );
    }

    const response = await supabaseServer
      .from('categories')
      .delete()
      .eq('id', id);

    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante l\'eliminazione della categoria.',
        response.error
      );
    }

    return NextResponse.json({ data: null });
}

export const GET = withErrorHandler(getCategories);
export const POST = withErrorHandler(createCategory);
export const PUT = withErrorHandler(updateCategory);
export const DELETE = withErrorHandler(deleteCategory);
