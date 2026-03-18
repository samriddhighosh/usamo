import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const isExpired = (expirationTime: string | null) => {
  if (!expirationTime) return false;
  return new Date(expirationTime).getTime() < Date.now();
};

serve(async req => {
  try {
    const { key } = await req.json();
    if (!key) {
      return new Response(
        JSON.stringify({ success: false, errorCode: 'KEY_NOT_FOUND' }),
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
        JSON.stringify({ success: false, errorCode: 'NOT_AUTHENTICATED' }),
        { status: 401 }
      );
    }

    const { data: link } = await supabaseAdmin
      .from('group_join_links')
      .select('*')
      .eq('id', key)
      .maybeSingle();

    if (!link) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'KEY_NOT_FOUND',
          message: 'The given key does not exist.',
        }),
        { status: 404 }
      );
    }

    if (
      link.revoked ||
      (link.max_uses && link.num_uses >= link.max_uses) ||
      isExpired(link.expiration_time)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_KEY',
          message: 'The given key is no longer valid.',
        }),
        { status: 400 }
      );
    }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', link.group_id)
      .maybeSingle();

    if (!group) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'GROUP_NOT_FOUND',
          message: 'We were unable to find the requested group.',
        }),
        { status: 404 }
      );
    }

    if (
      group.member_ids.includes(user.id) ||
      group.admin_ids.includes(user.id) ||
      group.owner_ids.includes(user.id)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'ALREADY_IN_GROUP',
          message: "You're already in this group, so you can't join it again.",
          groupId: link.group_id,
        }),
        { status: 200 }
      );
    }

    const memberIds = [...group.member_ids, user.id];

    await supabaseAdmin
      .from('groups')
      .update({ member_ids: memberIds })
      .eq('id', link.group_id);

    await supabaseAdmin
      .from('group_join_links')
      .update({
        used_by: [...(link.used_by ?? []), user.id],
        num_uses: link.num_uses + 1,
      })
      .eq('id', key);

    return new Response(
      JSON.stringify({ success: true, groupId: link.group_id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'UNKNOWN',
        message: error?.message ?? 'Unknown error',
      }),
      { status: 500 }
    );
  }
});
