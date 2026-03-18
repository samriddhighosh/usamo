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
    const ctx = await requireRole(request, ['admin', 'grader']);
    const { submissionId, feedback, parts } = request.body as {
      submissionId: string;
      feedback?: string;
      parts: Array<{ partId: string | null; score: number; maxScore: number; feedback?: string }>;
    };

    if (!submissionId || !Array.isArray(parts)) {
      response.status(400).json({ error: 'Missing submissionId or parts' });
      return;
    }

    const supabase = getSupabaseAdmin();

    const { data: gradeRow, error: gradeError } = await supabase
      .from('grades')
      .upsert(
        {
          submission_id: submissionId,
          grader_id: ctx.userId,
          feedback: feedback ?? '',
        },
        { onConflict: 'submission_id' }
      )
      .select('*')
      .single();

    if (gradeError || !gradeRow) {
      response.status(500).json({ error: gradeError?.message ?? 'Failed to grade' });
      return;
    }

    await supabase.from('grade_parts').delete().eq('grade_id', gradeRow.id);

    const partRows = parts.map((part) => ({
      grade_id: gradeRow.id,
      part_id: part.partId,
      score: part.score,
      max_score: part.maxScore,
      feedback: part.feedback ?? '',
    }));

    const { error: partsError } = await supabase.from('grade_parts').insert(partRows);
    if (partsError) {
      response.status(500).json({ error: partsError.message });
      return;
    }

    await supabase.rpc('recalculate_grade_total', { p_submission_id: submissionId });

    response.json({ grade: gradeRow });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
