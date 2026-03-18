import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

serve(async req => {
  try {
    const { target, claims } = await req.json();
    if (!target || !claims) {
      return new Response(JSON.stringify({ error: 'Missing params.' }), {
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

    const update = {
      is_admin: !!claims.isAdmin,
      can_moderate: !!claims.canModerate,
      can_create_groups: !!claims.canCreateGroups,
    };

    await supabaseAdmin.from('profiles').upsert({ id: target, ...update });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 500 }
    );
  }
});
