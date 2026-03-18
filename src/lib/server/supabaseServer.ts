import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

const env: SupabaseEnv = {
  url: process.env.SUPABASE_URL ?? process.env.GATSBY_SUPABASE_URL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};

export function getSupabaseAdmin(): SupabaseClient {
  if (!env.url || !env.serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseUser(accessToken: string): SupabaseClient {
  if (!env.url) {
    throw new Error('Missing SUPABASE_URL');
  }
  return createClient(env.url, process.env.SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
