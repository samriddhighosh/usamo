import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const type = (request.query.type as string) ?? 'global';

  if (type === 'contest') {
    const contestId = request.query.contestId as string | undefined;
    if (!contestId) {
      response.status(400).json({ error: 'Missing contestId' });
      return;
    }
    const { data, error } = await supabase
      .from('leaderboards')
      .select('user_id,total_score,rank,last_accepted_at')
      .eq('contest_id', contestId)
      .order('rank', { ascending: true });

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }
    response.json({ leaderboard: data });
    return;
  }

  if (type === 'level') {
    const levelId = request.query.levelId as string | undefined;
    if (!levelId) {
      response.status(400).json({ error: 'Missing levelId' });
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('id,handle,display_name,rating')
      .eq('level_id', levelId)
      .order('rating', { ascending: false })
      .limit(200);

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }
    response.json({ leaderboard: data });
    return;
  }

  if (type === 'weekly') {
    const weekStart = request.query.weekStart as string | undefined;
    if (!weekStart) {
      response.status(400).json({ error: 'Missing weekStart' });
      return;
    }
    const { data, error } = await supabase
      .from('rating_history')
      .select('user_id,delta,created_at')
      .gte('created_at', weekStart)
      .order('delta', { ascending: false })
      .limit(200);

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }
    response.json({ leaderboard: data });
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,handle,display_name,rating')
    .order('rating', { ascending: false })
    .limit(200);

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }
  response.json({ leaderboard: data });
}
