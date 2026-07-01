import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  let allCookies: any[] = [];
  let authCookies: any[] = [];
  let combinedValue = '';
  let sessionData: any = null;
  let parseError: string | null = null;
  let accessToken: string | null = null;

  try {
    const cookieStore = await cookies();
    allCookies = cookieStore.getAll().map(c => ({ name: c.name, valueLength: c.value.length }));

    authCookies = cookieStore.getAll()
      .filter(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookies.length > 0) {
      combinedValue = authCookies.map(c => c.value).join('');
      try {
        sessionData = JSON.parse(combinedValue);
      } catch (err1: any) {
        try {
          sessionData = JSON.parse(decodeURIComponent(combinedValue));
        } catch (err2: any) {
          parseError = `err1: ${err1.message}, err2: ${err2.message}`;
        }
      }

      if (sessionData) {
        accessToken = Array.isArray(sessionData)
          ? sessionData[0]
          : sessionData?.access_token;
      }
    }
  } catch (cookieErr: any) {
    parseError = `Cookie retrieval error: ${cookieErr.message}`;
  }

  // Create standard client
  const client = accessToken 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })
    : createClient(supabaseUrl, supabaseAnonKey);

  let sessionUser: any = null;
  try {
    const { data: { session } } = await client.auth.getSession();
    sessionUser = session?.user || null;
  } catch (err: any) {
    sessionUser = `Error getting session: ${err.message}`;
  }

  // Query invitation
  let inviteData: any = null;
  let inviteError: any = null;
  let bypassInviteData: any = null;
  let bypassInviteError: any = null;
  let serviceRoleKeyFound = false;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
  if (serviceRoleKey) {
    serviceRoleKeyFound = true;
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await adminClient
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .single();
      bypassInviteData = data;
      bypassInviteError = error;
    } catch (err: any) {
      bypassInviteError = { message: err.message };
    }
  }

  if (slug) {
    try {
      const { data, error } = await client
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .single();
      inviteData = data;
      inviteError = error;
    } catch (err: any) {
      inviteError = { message: err.message };
    }
  }

  // Query counts or other tables to check general connectivity
  let publicInvCount: any = null;
  let publicInvError: any = null;
  try {
    const { count, error } = await client
      .from('invitations')
      .select('*', { count: 'exact', head: true });
    publicInvCount = count;
    publicInvError = error;
  } catch (err: any) {
    publicInvError = { message: err.message };
  }

  // Get list of env keys safely
  const envKeys = Object.keys(process.env);

  return NextResponse.json({
    diagnostics: {
      slug,
      supabaseUrl,
      cookieCount: allCookies.length,
      allCookies,
      authCookiesFound: authCookies.map(c => c.name),
      combinedCookieLength: combinedValue.length,
      parseError,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      sessionUser,
      inviteData,
      inviteError,
      serviceRoleKeyFound,
      bypassInviteData,
      bypassInviteError,
      publicInvCount,
      publicInvError,
      envKeys
    }
  });
}
