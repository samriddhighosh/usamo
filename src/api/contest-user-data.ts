import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireAuth } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

type SubmissionRow = {
  id: string;
  problem_id: string;
  content_latex: string;
  last_submit_at: string | null;
  state: string;
  is_locked: boolean;
};

type GradeRow = {
  submission_id: string;
  score: number;
  max_score: number;
  feedback: string;
  grade_parts: Array<{
    part_id: string | null;
    score: number;
    max_score: number;
    feedback: string;
  }>;
};

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

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id,problem_id,content_latex,last_submit_at,state,is_locked')
      .eq('contest_id', contestId)
      .eq('user_id', ctx.userId);

    if (submissionsError) {
      response.status(500).json({ error: submissionsError.message });
      return;
    }

    const submissionIds = (submissions ?? []).map((row) => row.id);

    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('submission_id,score,max_score,feedback,grade_parts(part_id,score,max_score,feedback)')
      .in('submission_id', submissionIds.length ? submissionIds : ['00000000-0000-0000-0000-000000000000']);

    if (gradesError) {
      response.status(500).json({ error: gradesError.message });
      return;
    }

    const { data: ratingRow } = await supabase
      .from('rating_history')
      .select('delta')
      .eq('contest_id', contestId)
      .eq('user_id', ctx.userId)
      .maybeSingle();

    const totalScore = (grades ?? []).reduce((sum, grade) => sum + (grade.score ?? 0), 0);

    response.json({
      submissions: submissions as SubmissionRow[],
      grades: grades as GradeRow[],
      totalScore,
      ratingDelta: ratingRow?.delta ?? null,
    });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
