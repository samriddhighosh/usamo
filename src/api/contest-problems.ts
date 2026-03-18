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
    const { contestId, problemIds } = request.body as {
      contestId: string;
      problemIds: string[];
    };

    if (!contestId || !Array.isArray(problemIds)) {
      response.status(400).json({ error: 'Missing contestId or problemIds' });
      return;
    }

    const supabase = getSupabaseAdmin();
    await supabase.from('contest_problems').delete().eq('contest_id', contestId);

    const rows = problemIds.map((problemId, index) => ({
      contest_id: contestId,
      problem_id: problemId,
      order_index: index,
    }));

    const { error } = await supabase.from('contest_problems').insert(rows);
    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
