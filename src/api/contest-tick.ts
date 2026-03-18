import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireRole } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireRole(request, ['admin']);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc('update_contest_states');
    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }
    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
