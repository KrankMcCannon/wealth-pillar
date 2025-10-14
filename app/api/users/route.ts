import { NextResponse } from 'next/server';
import { supabaseServer, validateUserContext } from '@/lib/supabase-server';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/api-errors';
import { currentUser } from '@clerk/nextjs/server';

async function getUsers() {
    const userContext = await validateUserContext();

    let query = supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });


    if (userContext.role === 'superadmin') {
      // Superadmin sees all users
      // No additional filtering needed
    } else if (userContext.role === 'admin') {
      // Admin sees users in their group
      const adminUserResponse = await supabaseServer
        .from('users')
        .select('group_id')
        .eq('id', userContext.userId)
        .single();

      const adminGroupId = adminUserResponse.error ? null : (adminUserResponse.data as { group_id: string }).group_id;
      if (adminGroupId) {
        query = query.eq('group_id', adminGroupId);
      } else {
        // Fallback: admin sees only themselves
        query = query.eq('id', userContext.userId);
      }
    } else {
      // Members see only themselves
      query = query.eq('id', userContext.userId);
    }

    const response = await query;
    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero degli utenti.',
        response.error
      );
    }

    return NextResponse.json({ data: response.data ?? [] });
}

async function createUser(request: Request) {
  // Verify user is authenticated with Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new APIError(
      ErrorCode.AUTH_REQUIRED,
      'Non autenticato. Effettua il login.'
    );
  }

  const body = await request.json() as {
    clerk_id: string;
    email: string;
    name: string;
    avatar?: string;
    group_name?: string;
    account_name?: string;
    initial_balance?: number;
  };

  // Validate required fields - now group and account are REQUIRED
  if (!body.clerk_id || !body.email || !body.name || !body.group_name || !body.account_name) {
    throw new APIError(
      ErrorCode.MISSING_FIELDS,
      'Campi richiesti mancanti: clerk_id, email, name, group_name, account_name'
    );
  }

  // Ensure the Clerk user creating this matches the clerk_id
  if (clerkUser.id !== body.clerk_id) {
    throw new APIError(
      ErrorCode.PERMISSION_DENIED,
      'Non puoi creare un utente per un altro account Clerk'
    );
  }

  // Step 1: Create the group first
  const groupId = crypto.randomUUID();
  const { error: groupError } = (await (supabaseServer
    .from('groups') as any)
    .insert({
      id: groupId,
      name: body.group_name,
      plan: 'free',
    })) as { error: unknown };

  if (groupError) {
    console.error('Supabase error creating group:', groupError);
    throw new APIError(
      ErrorCode.DB_QUERY_ERROR,
      'Errore durante la creazione del gruppo.',
      groupError
    );
  }

  // Step 2: Create the user with the group_id
  const { data: userData, error: userError } = (await (supabaseServer
    .from('users') as any)
    .insert({
      clerk_id: body.clerk_id,
      name: body.name,
      email: body.email,
      avatar: body.avatar || '',
      role: 'member',
      theme_color: '#7678EC',
      budget_start_date: 1,
      group_id: groupId,
    })
    .select('*')
    .single()) as { data: { id: string; [key: string]: unknown }; error: unknown };

  if (userError) {
    console.error('Supabase error creating user:', userError);
    throw new APIError(
      ErrorCode.DB_QUERY_ERROR,
      'Errore durante la creazione dell\'utente nel database.',
      userError
    );
  }

  // Step 3: Update the group with created_by after user is created
  const { error: updateGroupError } = (await (supabaseServer
    .from('groups') as any)
    .update({ created_by: userData.id })
    .eq('id', groupId)) as { error: unknown };

  if (updateGroupError) {
    console.error('Supabase error updating group:', updateGroupError);
    // Non-critical error, just log it
  }

  // Step 4: Create the account linked to the user
  const { error: accountError } = (await (supabaseServer
    .from('accounts') as any)
    .insert({
      name: body.account_name,
      type: 'payroll',
      user_ids: [userData.id], // Array of user IDs
      group_id: groupId,
    })) as { error: unknown };

  if (accountError) {
    console.error('Supabase error creating account:', accountError);
    throw new APIError(
      ErrorCode.DB_QUERY_ERROR,
      'Errore durante la creazione del conto.',
      accountError
    );
  }

  return NextResponse.json({ data: userData, success: true });
}

export const GET = withErrorHandler(getUsers);
export const POST = withErrorHandler(createUser);
