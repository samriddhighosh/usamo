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
    await requireRole(request, ['admin']);
    const { userId, newRating } = request.body as { userId: string; newRating: number };
    if (!userId || typeof newRating !== 'number') {
      response.status(400).json({ error: 'Missing userId or newRating' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: levelId } = await supabase.rpc('get_level_for_rating', {
      p_rating: newRating,
    });

    await supabase.from('ratings').upsert({
      user_id: userId,
      rating: newRating,
    });

    await supabase
      .from('users')
      .update({ rating: newRating, level_id: levelId })
      .eq('id', userId);

    response.json({ ok: true });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Forbidden' });
  }
}
