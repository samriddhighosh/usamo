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
    const { contestId, eventType, payload } = request.body as {
      contestId: string | null;
      eventType: string;
      payload: Record<string, unknown> | null;
    };

    if (!eventType) {
      response.status(400).json({ error: 'Missing eventType' });
      return;
    }

    const supabase = getSupabaseAdmin();
    await supabase.from('anti_cheat_events').insert({
      user_id: ctx.userId,
      contest_id: contestId,
      event_type: eventType,
      payload: payload ?? {},
    });

    const ip =
      (request.headers['x-forwarded-for'] as string | undefined) ||
      (request.headers['x-real-ip'] as string | undefined) ||
      '';
    const ua = request.headers['user-agent'] as string | undefined;

    if (ip) {
      await supabase.from('ip_logs').insert({
        user_id: ctx.userId,
        contest_id: contestId,
        ip_address: ip,
        user_agent: ua ?? '',
      });
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
