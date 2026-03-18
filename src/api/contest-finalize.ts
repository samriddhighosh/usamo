import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireRole } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';
import { calculateContestRatings } from '../lib/contest/rating';

type SubmissionRow = {
  id: string;
  user_id: string;
  contest_id: string;
  last_submit_at: string | null;
  grades: { score: number } | null;
};

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

    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      response.status(404).json({ error: 'Contest not found' });
      return;
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, user_id, contest_id, last_submit_at, grades(score)')
      .eq('contest_id', contestId);

    if (submissionsError) {
      response.status(500).json({ error: submissionsError.message });
      return;
    }

    const totals = new Map<string, { total: number; last: string | null }>();
    (submissions as SubmissionRow[]).forEach((row) => {
      const current = totals.get(row.user_id) ?? { total: 0, last: null };
      const add = row.grades?.score ?? 0;
      const last = row.last_submit_at ?? current.last;
      totals.set(row.user_id, {
        total: current.total + add,
        last: current.last ? (last && last < current.last ? last : current.last) : last,
      });
    });

    const leaderboardRows = Array.from(totals.entries()).map(([userId, info]) => ({
      contest_id: contestId,
      user_id: userId,
      total_score: info.total,
      last_accepted_at: info.last,
    }));

    const sorted = [...leaderboardRows].sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      const aTime = a.last_accepted_at ? new Date(a.last_accepted_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.last_accepted_at ? new Date(b.last_accepted_at).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    const ranked = sorted.map((row, index) => ({ ...row, rank: index + 1 }));
    await supabase.from('leaderboards').delete().eq('contest_id', contestId);
    if (ranked.length > 0) {
      await supabase.from('leaderboards').insert(ranked);
    }

    if (contest.rating_enabled && ranked.length >= 3) {
      const { data: ratingRows } = await supabase
        .from('ratings')
        .select('user_id, rating, contests_count')
        .in(
          'user_id',
          ranked.map((row) => row.user_id)
        );

      const ratingMap = new Map(
        (ratingRows ?? []).map((row) => [row.user_id, row as { rating: number; contests_count: number }])
      );

      const participants = ranked.map((row) => {
        const ratingRow = ratingMap.get(row.user_id);
        return {
          userId: row.user_id,
          rating: ratingRow?.rating ?? 1200,
          score: row.total_score,
          lastAcceptedAt: row.last_accepted_at,
          contestsCount: ratingRow?.contests_count ?? 0,
        };
      });

      const results = calculateContestRatings(participants, ranked.length);

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
    }

    await supabase.rpc('lock_submissions_for_contest', { p_contest_id: contestId });

    await supabase.from('contests').update({ state: 'finalized' }).eq('id', contestId);

    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
