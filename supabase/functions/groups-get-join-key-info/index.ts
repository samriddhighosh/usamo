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
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: link } = await supabase
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

    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', link.group_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ success: true, name: group?.name ?? '' }),
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
