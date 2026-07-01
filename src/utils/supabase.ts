import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Synchronize Supabase Auth session token to browser cookies for Next.js Server Actions
if (typeof window !== 'undefined') {
  const match = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/);
  const ref = match ? match[1] : '';
  const cookieName = ref ? `sb-${ref}-auth-token` : 'sb-auth-token';

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Store only access_token and refresh_token to keep cookie size small (under 4KB limit)
      const cookieValue = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };
      const maxAge = 60 * 60 * 24 * 7; // 1 week
      document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(cookieValue))}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
    } else {
      // Delete the session cookie
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; Secure`;
    }
  });
}

