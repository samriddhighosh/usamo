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

  const userId = request.query.userId as string | undefined;
  if (!userId) {
    response.status(400).json({ error: 'Missing userId' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('rating_history')
    .select('contest_id,old_rating,new_rating,delta,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.json({ history: data });
}
