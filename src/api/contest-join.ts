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
    const { contestId, mode } = request.body as { contestId: string; mode: string };

    if (!contestId || !mode) {
      response.status(400).json({ error: 'Missing contestId or mode' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      response.status(404).json({ error: 'Contest not found' });
      return;
    }

    if (contest.state === 'finalized' || contest.state === 'archived') {
      response.status(400).json({ error: 'Contest is finalized' });
      return;
    }

    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

    if (mode === 'live') {
      if (now < startTime || now > endTime) {
        response.status(400).json({ error: 'Contest not active' });
        return;
      }
    }

    if (mode === 'virtual') {
      if (now < endTime) {
        response.status(400).json({ error: 'Virtual allowed after official end' });
        return;
      }
    }

    const { data: existingSession } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('contest_id', contestId)
      .eq('user_id', ctx.userId)
      .eq('mode', mode)
      .maybeSingle();

    if (existingSession) {
      if (mode === 'virtual') {
        const virtualEnd = new Date(existingSession.end_time);
        if (now > virtualEnd) {
          response.status(400).json({ error: 'Virtual session ended' });
          return;
        }
      }
      response.json({ session: existingSession });
      return;
    }

    const durationMinutes = Number(contest.duration_minutes ?? 300);
    const sessionStart = now.toISOString();
    const sessionEnd = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

    const { data: session, error: sessionError } = await supabase
      .from('contest_sessions')
      .insert({
        contest_id: contestId,
        user_id: ctx.userId,
        mode,
        start_time: sessionStart,
        end_time: mode === 'live' ? contest.end_time : sessionEnd,
      })
      .select('*')
      .single();

    if (sessionError) {
      response.status(500).json({ error: sessionError.message });
      return;
    }

    response.json({ session });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
