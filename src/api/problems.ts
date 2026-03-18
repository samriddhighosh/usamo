import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireRole } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  const supabase = getSupabaseAdmin();

  if (request.method === 'GET') {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ problems: data });
    return;
  }

  if (request.method === 'POST') {
    try {
      const ctx = await requireRole(request, ['admin', 'problem_manager']);
      const body = request.body as Record<string, unknown>;
      const payload = {
        id: body.id as string | undefined,
        title: body.title as string,
        statement_latex: body.statement_latex as string,
        solution_latex: body.solution_latex as string,
        tags: (body.tags as string[]) ?? [],
        difficulty: Number(body.difficulty ?? 1200),
        point_value: Number(body.point_value ?? 7),
        created_by: ctx.userId,
      };

      if (!payload.title || !payload.statement_latex || !payload.solution_latex) {
        response.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const { data, error } = await supabase
        .from('problems')
        .upsert(payload)
        .select('*')
        .single();

      if (error) {
        response.status(500).json({ error: error.message });
        return;
      }

      response.json({ problem: data });
      return;
    } catch (error) {
      response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
      return;
    }
  }

  response.status(405).json({ error: 'Method not allowed' });
}
