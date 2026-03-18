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
    const { contestId, graderId } = request.body as { contestId: string; graderId: string };
    if (!contestId || !graderId) {
      response.status(400).json({ error: 'Missing contestId or graderId' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('contest_graders').upsert({
      contest_id: contestId,
      grader_id: graderId,
    });

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
