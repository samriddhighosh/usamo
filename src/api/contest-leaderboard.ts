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

  const contestId = request.query.contestId as string | undefined;
  const page = Number(request.query.page ?? 1);
  const pageSize = Math.min(Number(request.query.pageSize ?? 50), 100);

  if (!contestId) {
    response.status(400).json({ error: 'Missing contestId' });
    return;
  }

  const offset = (page - 1) * pageSize;
  const supabase = getSupabaseAdmin();

  const { data: leaderboardRows, error: leaderboardError, count } = await supabase
    .from('leaderboards')
    .select('user_id,total_score,rank,last_accepted_at', { count: 'exact' })
    .eq('contest_id', contestId)
    .order('rank', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (leaderboardError) {
    response.status(500).json({ error: leaderboardError.message });
    return;
  }

  const userIds = (leaderboardRows ?? []).map((row) => row.user_id as string);

  const { data: users } = await supabase
    .from('users')
    .select('id,handle,display_name')
    .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

  const userMap = new Map((users ?? []).map((row) => [row.id, row]));

  const { data: contestProblems } = await supabase
    .from('contest_problems')
    .select('problem_id,order_index')
    .eq('contest_id', contestId)
    .order('order_index', { ascending: true });

  const problemOrder = (contestProblems ?? []).map((row) => row.problem_id as string);

  const { data: submissions } = await supabase
    .from('submissions')
    .select('user_id,problem_id,grades(score)')
    .eq('contest_id', contestId)
    .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

  const perProblem = new Map<string, Record<string, number>>();
  (submissions ?? []).forEach((row) => {
    const userId = row.user_id as string;
    const problemId = row.problem_id as string;
    const score = (row.grades as { score?: number } | null)?.score ?? 0;
    const current = perProblem.get(userId) ?? {};
    current[problemId] = score;
    perProblem.set(userId, current);
  });

  const { data: ratingRows } = await supabase
    .from('rating_history')
    .select('user_id,delta')
    .eq('contest_id', contestId)
    .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

  const ratingMap = new Map((ratingRows ?? []).map((row) => [row.user_id, row.delta]));

  const results = (leaderboardRows ?? []).map((row) => {
    const user = userMap.get(row.user_id) as { handle: string; display_name: string } | undefined;
    const breakdown = perProblem.get(row.user_id) ?? {};
    return {
      userId: row.user_id,
      handle: user?.handle ?? 'Unknown',
      displayName: user?.display_name ?? 'Unknown',
      totalScore: row.total_score,
      rank: row.rank,
      lastAcceptedAt: row.last_accepted_at,
      ratingDelta: ratingMap.get(row.user_id) ?? null,
      perProblem: problemOrder.map((problemId) => ({
        problemId,
        score: breakdown[problemId] ?? 0,
      })),
    };
  });

  response.json({
    leaderboard: results,
    problems: problemOrder,
    page,
    pageSize,
    total: count ?? results.length,
  });
}
