import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

serve(async req => {
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email.' }), {
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Not an admin.' }), {
        status: 403,
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    if (error || !data?.user) {
      return new Response(JSON.stringify({ users: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUser = data.user;
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, avatar_url, is_admin, can_moderate, can_create_groups')
      .eq('id', targetUser.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        users: [
          {
            uid: targetUser.id,
            email: targetUser.email,
            displayName: targetProfile?.display_name ?? null,
            photoURL: targetProfile?.avatar_url ?? null,
            disabled: targetUser.banned ?? false,
            customClaims: {
              isAdmin: !!targetProfile?.is_admin,
              canModerate: !!targetProfile?.can_moderate,
              canCreateGroups: !!targetProfile?.can_create_groups,
            },
          },
        ],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 500 }
    );
  }
});
