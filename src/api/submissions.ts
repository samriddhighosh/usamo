import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireAuth } from '../lib/server/auth';
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
    const ctx = await requireAuth(request);
    const {
      contestId,
      problemId,
      contentLatex,
      submit,
    } = request.body as {
      contestId: string;
      problemId: string;
      contentLatex: string;
      submit?: boolean;
    };

    if (!contestId || !problemId) {
      response.status(400).json({ error: 'Missing contestId or problemId' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: session } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('user_id', ctx.userId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: contest } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (!contest) {
      response.status(404).json({ error: 'Contest not found' });
      return;
    }

    const now = new Date();
    const contestStart = new Date(contest.start_time);
    const contestEnd = new Date(contest.end_time);

    let canEdit = false;
    if (contest.state === 'finalized' || contest.state === 'archived') {
      response.status(400).json({ error: 'Contest submissions are locked' });
      return;
    }
    if (contest.state === 'active' && now >= contestStart && now <= contestEnd) {
      canEdit = true;
    }
    if (session && session.mode === 'virtual') {
      const sessionStart = new Date(session.start_time);
      const sessionEnd = new Date(session.end_time);
      if (now >= sessionStart && now <= sessionEnd) {
        canEdit = true;
      }
    }
    if (session && session.mode === 'practice') {
      canEdit = true;
    }

    if (!canEdit) {
      response.status(400).json({ error: 'Submission window closed' });
      return;
    }

    const state = submit ? 'submitted' : 'draft';

    const { data, error } = await supabase
      .from('submissions')
      .upsert(
        {
          contest_id: contestId,
          user_id: ctx.userId,
          problem_id: problemId,
          content_latex: contentLatex ?? '',
          state,
          is_locked: false,
          last_submit_at: submit ? now.toISOString() : null,
        },
        { onConflict: 'contest_id,user_id,problem_id' }
      )
      .select('*')
      .single();

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ submission: data });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
