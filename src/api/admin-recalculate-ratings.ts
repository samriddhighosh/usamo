import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireRole } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';
import { calculateContestRatings } from '../lib/contest/rating';

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
    const { contestId } = request.body as { contestId: string };
    if (!contestId) {
      response.status(400).json({ error: 'Missing contestId' });
      return;
    }

    const supabase = getSupabaseAdmin();

    const { data: leaderboard } = await supabase
      .from('leaderboards')
      .select('user_id,total_score,last_accepted_at')
      .eq('contest_id', contestId)
      .order('rank', { ascending: true });

    if (!leaderboard || leaderboard.length === 0) {
      response.status(400).json({ error: 'No leaderboard data' });
      return;
    }

    const { data: ratingRows } = await supabase
      .from('ratings')
      .select('user_id,rating,contests_count')
      .in(
        'user_id',
        leaderboard.map((row) => row.user_id)
      );

    const ratingMap = new Map(
      (ratingRows ?? []).map((row) => [row.user_id, row as { rating: number; contests_count: number }])
    );

    const participants = leaderboard.map((row) => {
      const ratingRow = ratingMap.get(row.user_id);
      return {
        userId: row.user_id,
        rating: ratingRow?.rating ?? 1200,
        score: row.total_score,
        lastAcceptedAt: row.last_accepted_at,
        contestsCount: ratingRow?.contests_count ?? 0,
      };
    });

    const results = calculateContestRatings(participants, leaderboard.length);

    await supabase.from('rating_history').delete().eq('contest_id', contestId);

    for (const result of results) {
      await supabase.from('rating_history').insert({
        contest_id: contestId,
        user_id: result.userId,
        old_rating: result.oldRating,
        new_rating: result.newRating,
        delta: result.delta,
      });

      await supabase.from('ratings').upsert({
        user_id: result.userId,
        rating: result.newRating,
        contests_count: (ratingMap.get(result.userId)?.contests_count ?? 0) + 1,
        last_contest_id: contestId,
      });

      const { data: levelId } = await supabase.rpc('get_level_for_rating', {
        p_rating: result.newRating,
      });

      await supabase
        .from('users')
        .update({ rating: result.newRating, level_id: levelId })
        .eq('id', result.userId);
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
