import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireAuth } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const ctx = await requireAuth(request);
    const contestId = request.query.contestId as string | undefined;
    if (!contestId) {
      response.status(400).json({ error: 'Missing contestId' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('user_id', ctx.userId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ session: data ?? null });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
