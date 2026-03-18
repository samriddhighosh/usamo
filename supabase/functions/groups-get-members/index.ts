import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

serve(async req => {
  try {
    const { groupId } = await req.json();
    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Missing groupId.' }),
        { status: 400 }
      );
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
      return new Response(
        JSON.stringify({ error: 'Not authenticated.' }),
        { status: 401 }
      );
    }

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('owner_ids, admin_ids, member_ids')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ error: 'Group not found.' }),
        { status: 404 }
      );
    }

    const isAdmin =
      group.owner_ids.includes(user.id) || group.admin_ids.includes(user.id);
    const isMember =
      isAdmin || group.member_ids.includes(user.id);

    if (!isMember) {
      return new Response(
        JSON.stringify({ error: 'Permission denied.' }),
        { status: 403 }
      );
    }

    const memberIds = [
      ...group.owner_ids,
      ...group.admin_ids,
      ...group.member_ids,
    ];

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', memberIds);

    const members = (profiles ?? []).map(profile => ({
      uid: profile.id,
      displayName: profile.display_name,
      photoURL: profile.avatar_url,
    }));

    if (isAdmin) {
      for (const member of members) {
        const { data } = await supabaseAdmin.auth.admin.getUserById(member.uid);
        member.email = data?.user?.email ?? null;
      }
    }

    return new Response(JSON.stringify(members), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 500 }
    );
  }
});
