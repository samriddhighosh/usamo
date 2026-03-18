import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';
import { requireAuth, requireRole } from '../lib/server/auth';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  const supabase = getSupabaseAdmin();

  if (request.method === 'GET') {
    const contestId = request.query.contestId as string | undefined;
    const visibility = request.query.visibility as string | undefined;

    let userId: string | null = null;
    let roles: string[] = [];
    try {
      const ctx = await requireAuth(request);
      userId = ctx.userId;
      roles = ctx.roles;
    } catch {
      userId = null;
      roles = [];
    }

    let query = supabase.from('contests').select('*').order('start_time', { ascending: true });
    if (contestId) {
      query = query.eq('id', contestId);
    }
    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    const { data, error } = await query;
    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    if (roles.includes('admin')) {
      response.json({ contests: data });
      return;
    }

    const allowed = new Set<string>();
    if (userId) {
      const { data: accessRows } = await supabase
        .from('contest_access')
        .select('contest_id')
        .eq('user_id', userId);
      (accessRows ?? []).forEach((row) => allowed.add(row.contest_id as string));
    }

    const filtered = (data ?? []).filter((contest) => {
      if (contest.visibility === 'public') return true;
      return userId ? allowed.has(contest.id) : false;
    });

    response.json({ contests: filtered });
    return;
  }

  if (request.method === 'POST') {
    try {
      await requireRole(request, ['admin']);
    } catch (error) {
      response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
      return;
    }

    const body = request.body as Record<string, unknown>;
    const payload = {
      id: body.id as string | undefined,
      title: body.title as string,
      description: (body.description as string) ?? '',
      level_id: (body.level_id as string) ?? null,
      start_time: body.start_time as string,
      end_time: body.end_time as string,
      duration_minutes: Number(body.duration_minutes ?? 300),
      state: (body.state as string) ?? 'scheduled',
      visibility: (body.visibility as string) ?? 'public',
      rating_enabled: Boolean(body.rating_enabled ?? true),
      created_by: body.created_by as string,
    };

    if (!payload.title || !payload.start_time || !payload.end_time || !payload.created_by) {
      response.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const { data, error } = await supabase
      .from('contests')
      .upsert(payload)
      .select('*')
      .single();

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ contest: data });
    return;
  }

  response.status(405).json({ error: 'Method not allowed' });
}
